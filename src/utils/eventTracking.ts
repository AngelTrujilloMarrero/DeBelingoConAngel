import { Event } from '../types';
import { ref, set } from 'firebase/database';
import { db, eventsRef } from './firebase';

/**
 * Guarda un evento con la lógica mejorada para diferenciar entre nuevo, modificado y re-agregado
 * @param event Evento a guardar
 * @param userId ID del usuario que realiza la acción
 * @param isUpdate Si es una actualización de un evento existente
 */
export const saveEventWithTracking = async (
  event: Event, 
  userId: string, 
  isUpdate: boolean = false
): Promise<void> => {
  const timestamp = new Date().toISOString();
  
  // Preparar el evento con los timestamps y flags necesarios
  const eventToSave: Event = {
    ...event,
    FechaEditado: timestamp,
    // Si es nuevo y no tiene FechaAgregado, establecerlo
    FechaAgregado: event.FechaAgregado || timestamp,
    // Limpiar flags de re-agregado si es una edición normal
    reAgregado: isUpdate ? false : event.reAgregado,
    originalEventId: isUpdate ? undefined : event.originalEventId
  };

  // Guardar en Firebase
  await set(ref(db, `events/${event.id}`), eventToSave);
};

/**
 * Marca un evento como cancelado y lo registra en el historial de eliminaciones
 * @param event Evento a cancelar
 * @param userId ID del usuario que cancela el evento
 */
export const cancelEvent = async (
  event: Event, 
  userId: string
): Promise<void> => {
  const timestamp = new Date().toISOString();
  
  // Marcar el evento como cancelado
  const cancelledEvent: Event = {
    ...event,
    cancelado: true,
    FechaEditado: timestamp,
    cancelTimestamp: timestamp
  };

  // Actualizar el evento en Firebase
  await set(ref(db, `events/${event.id}`), cancelledEvent);

  // Registrar la eliminación en el historial
  const deletionRecord = {
    eventId: event.id,
    deletedBy: userId,
    deletedAt: timestamp,
    eventData: { ...event, cancelado: false } // Guardar el estado original
  };

  await set(ref(db, `eventDeletions/${event.id}_${timestamp.replace(/[:.]/g, '-')}`), deletionRecord);
};

/**
 * Detecta si un evento debería ser marcado como re-agregado basado en similitudes
 * @param newEvent Nuevo evento a verificar
 * @param existingEvents Lista de eventos existentes
 * @param recentDeletions Lista de eliminaciones recientes
 */
export const detectReaggregatedEvent = async (
  newEvent: Event,
  existingEvents: Event[],
  recentDeletions: any[]
): Promise<Event> => {
  // Verificar si hay eliminaciones similares
  const similarDeletion = recentDeletions.find(deletion => {
    const deletionEvent = deletion.eventData || deletion.event;
    return areEventsSimilar(newEvent, deletionEvent) && 
           isWithinTimeWindow(
             newEvent.FechaAgregado || '', 
             deletion.deletedAt || deletion.event.FechaEditado || ''
           );
  });

  if (similarDeletion) {
    return {
      ...newEvent,
      reAgregado: true,
      originalEventId: similarDeletion.eventData?.id || similarDeletion.event.id,
      cancelTimestamp: similarDeletion.deletedAt || similarDeletion.event.FechaEditado
    };
  }

  return newEvent;
};

/**
 * Verifica si dos eventos son similares (versión optimizada)
 */
const areEventsSimilar = (event1: Event, event2: Event): boolean => {
  const config = {
    TIME_TOLERANCE_MINUTES: 15,
    SIMILARITY_THRESHOLD: 4
  };

  // Verificación por ID primero
  if (event1.id === event2.id) return true;

  // Normalizar y comparar campos clave
  const normalizeText = (text: string) => text?.toLowerCase().trim() || '';
  
  const sameOrchestra = normalizeText(event1.orquesta) === normalizeText(event2.orquesta);
  const sameMunicipality = normalizeText(event1.municipio) === normalizeText(event2.municipio);
  const sameType = normalizeText(event1.tipo) === normalizeText(event2.tipo);
  
  // Normalizar lugar eliminando términos comunes
  const normalizePlace = (place: string) => {
    if (!place) return '';
    return place.toLowerCase()
      .replace(/\b(casco|centro|plaza|plaza mayor|plaza del ayuntamiento)\b/g, '')
      .trim();
  };
  const similarPlace = normalizePlace(event1.lugar || '') === normalizePlace(event2.lugar || '');

  // Comparar horas con tolerancia
  const getTimeInMinutes = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  };
  const timeDiff = Math.abs(getTimeInMinutes(event1.hora) - getTimeInMinutes(event2.hora));
  const sameHour = timeDiff <= config.TIME_TOLERANCE_MINUTES;

  // Exigir al menos el umbral de coincidencias
  const conditions = [sameOrchestra, sameMunicipality, sameType, sameHour, similarPlace];
  const trueConditions = conditions.filter(Boolean).length;

  return trueConditions >= config.SIMILARITY_THRESHOLD;
};

/**
 * Verifica si dos timestamps están dentro de una ventana de tiempo
 */
const isWithinTimeWindow = (
  timestamp1: string, 
  timestamp2: string, 
  hours: number = 12
): boolean => {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);
  const diffInHours = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60);
  return diffInHours <= hours;
};
import { useState, useEffect, useRef } from 'react';
import { onValue } from '../utils/firebase';
import { eventsRef, eventDeletionsRef } from '../utils/firebase';
import { Event, RecentActivityItem } from '../types';
import { getCachedHistoricalStats } from '../utils/dataLoaders';

// Función para cargar eventos históricos desde archivos estáticos por año
const loadEventsFromArchive = async (year: number): Promise<Event[]> => {
  try {
    const response = await fetch(`/events-archive/${year}.json`);
    if (!response.ok) {
      console.log(`No se encontró archivo de eventos para el año ${year}`);
      return [];
    }
    const data = await response.json();
    return data.events || [];
  } catch (error) {
    console.error(`Error cargando eventos del año ${year}:`, error);
    return [];
  }
};

// Configuración flexible para similitud de eventos
const SIMILARITY_CONFIG = {
  TIME_WINDOW_HOURS: 12,      // Reducido de 24 a 12 horas
  SIMILARITY_THRESHOLD: 4,    // Exigir 4 de 5 condiciones
  TIME_TOLERANCE_MINUTES: 15  // Reducido de 30 a 15 minutos
};

// Función para verificar si dos eventos son similares
const areSimilarEvents = (event1: Event, event2: Event): boolean => {
  // Verificación por ID: si tienen mismo ID, es definitivamente el mismo evento
  if (event1.id === event2.id) return true;

  // Misma orquesta y municipio
  const sameOrchestra = event1.orquesta.toLowerCase().trim() === event2.orquesta.toLowerCase().trim();
  const sameMunicipality = event1.municipio.toLowerCase().trim() === event2.municipio.toLowerCase().trim();

  // Mismo tipo de evento
  const sameType = event1.tipo.toLowerCase().trim() === event2.tipo.toLowerCase().trim();

  // Lugar similar (considerando variaciones como "Casco", "Centro", etc.)
  const normalizePlace = (place: string) => {
    if (!place) return '';
    return place.toLowerCase().replace(/\b(casco|centro|plaza|plaza mayor|plaza del ayuntamiento)\b/g, '').trim();
  };
  const similarPlace = normalizePlace(event1.lugar || '') === normalizePlace(event2.lugar || '');

  // Misma hora (con tolerancia configurable)
  const getTimeInMinutes = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  };
  const timeDiff = Math.abs(getTimeInMinutes(event1.hora) - getTimeInMinutes(event2.hora));
  const sameHour = timeDiff <= SIMILARITY_CONFIG.TIME_TOLERANCE_MINUTES;

  // Criterios: exigir SIMILARITY_THRESHOLD condiciones
  const conditions = [sameOrchestra, sameMunicipality, sameType, sameHour, similarPlace];
  const trueConditions = conditions.filter(Boolean).length;

  return trueConditions >= SIMILARITY_CONFIG.SIMILARITY_THRESHOLD;
};

// Función para verificar si dos timestamps están dentro de una ventana de tiempo (horas)
const isWithinTimeWindow = (timestamp1: string, timestamp2: string, hours: number = SIMILARITY_CONFIG.TIME_WINDOW_HOURS): boolean => {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);
  const diffInHours = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60);
  return diffInHours <= hours;
};

let historicalData: {
  years: any;
  events: Event[];
} | null = null;

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const deletionsRef = useRef<RecentActivityItem[]>([]);

  useEffect(() => {
    let unsubscribeEvents: (() => void) | null = null;
    let unsubscribeDeletions: (() => void) | null = null;

    const setupEventListeners = async () => {
      setLoading(true);

      // Load historical data lazily
      if (!historicalData) {
        const stats = await getCachedHistoricalStats();
        historicalData = stats as {
          years: any;
          events: Event[];
        };
      }

      const currentYear = new Date().getFullYear();
      const previousYear = currentYear - 1;

      // 1. Cargar eventos del año anterior desde archivos estáticos
      const archivedEvents = await loadEventsFromArchive(previousYear);
      const hasArchivedEvents = archivedEvents.length > 0;

      // 2. Escuchar cambios en eventos de Firebase (año actual)
      unsubscribeEvents = onValue(eventsRef, (snapshot) => {
        const data = snapshot.val();
        const loadedEvents: Event[] = [];
        const allEvents: Event[] = [];

        if (data) {
          Object.entries(data).forEach(([key, value]: [string, any]) => {
            const event: Event = { id: key, ...value };
            const eventYear = new Date(event.day).getFullYear();

            // Lógica de carga híbrida:
            // 1. Siempre cargamos el año actual (o superior)
            // 2. Si NO hay archivo histórico cargado, cargamos todo el año anterior de Firebase (evita el "apagón" del 1 de enero)
            // 3. Si HAY archivo histórico, solo cargamos diciembre del año anterior de Firebase (margen de seguridad para solapamiento)
            const eventMonth = new Date(event.day).getMonth();
            const isCurrentOrFuture = eventYear >= currentYear;
            const isPrevYearAndNoArchive = !hasArchivedEvents && eventYear === previousYear;
            const isPrevYearDecember = eventYear === previousYear && eventMonth === 11;

            if (isCurrentOrFuture || isPrevYearAndNoArchive || isPrevYearDecember) {
              allEvents.push(event);
              if (!event.cancelado) {
                loadedEvents.push(event);
              }
            }
          });
        }

        // Combinar eventos y eliminar duplicados por ID
        // Es posible que un evento exista tanto en el archivo (si ya se generó) como en Firebase
        const combinedEvents = [...historicalData.events, ...archivedEvents, ...loadedEvents];
        const uniqueEventsMap = new Map();
        combinedEvents.forEach(event => {
          if (event && event.id) {
            uniqueEventsMap.set(event.id, event);
          }
        });

        setEvents(Array.from(uniqueEventsMap.values()));

        // Actualizar actividad reciente basada en los datos actuales
        updateActivityLocally(allEvents, deletionsRef.current, previousYear);
      });

      // 3. Escuchar eliminaciones de Firebase
      unsubscribeDeletions = onValue(eventDeletionsRef, (snapshot) => {
        const deletions: RecentActivityItem[] = [];
        const data = snapshot.val();

        if (data) {
          Object.entries(data).forEach(([key, value]: [string, any]) => {
            const deletion = value as {
              eventId: string;
              deletedBy: string;
              deletedAt: string;
              eventData: Event;
            };

            const deletionDate = new Date(deletion.deletedAt);
            const fourHundredDaysAgo = new Date();
            fourHundredDaysAgo.setDate(fourHundredDaysAgo.getDate() - 400);

            if (deletionDate >= fourHundredDaysAgo) {
              const eventYear = new Date(deletion.eventData.day).getFullYear();
              // Solo considerar eliminaciones del año actual o anterior (para mostrar actividad relevante)
              if (eventYear >= previousYear) {
                deletions.push({
                  type: 'delete',
                  event: {
                    ...deletion.eventData,
                    FechaEditado: deletion.deletedAt
                  }
                });
              }
            }
          });
        }

        deletionsRef.current = deletions;
      });
    };

    const updateActivityLocally = (allEvents: Event[], currentDeletions: RecentActivityItem[], thresholdYear: number) => {
      const currentActivity: RecentActivityItem[] = allEvents
        .filter(e => e.FechaEditado || e.FechaAgregado)
        .map(event => {
          let type: 'add' | 'edit' | 'delete' | 'reagregado' = 'edit';
          if (event.cancelado) {
            type = 'delete';
          } else if (event.reAgregado) {
            type = 'reagregado';
          } else if (event.FechaAgregado === event.FechaEditado) {
            type = 'add';
          }
          return { type, event };
        });

      const processActivity = (current: RecentActivityItem[], deletions: RecentActivityItem[]) => {
        const filteredDeletions = [...deletions];
        const result: RecentActivityItem[] = [];

        current.forEach(activity => {
          if (activity.type === 'add') {
            const similarDeletionIndex = filteredDeletions.findIndex(deletion =>
              areSimilarEvents(activity.event, deletion.event) &&
              isWithinTimeWindow(activity.event.FechaAgregado || '', deletion.event.FechaEditado || '')
            );

            if (similarDeletionIndex !== -1) {
              const similarDeletion = filteredDeletions[similarDeletionIndex];
              result.push({
                type: 'reagregado',  // Nuevo tipo para re-agregados
                event: {
                  ...activity.event,
                  FechaEditado: similarDeletion.event.FechaEditado,
                  reAgregado: true,
                  originalEventId: similarDeletion.event.id,
                  cancelTimestamp: similarDeletion.event.FechaEditado
                }
              });
              filteredDeletions.splice(similarDeletionIndex, 1);
            } else {
              result.push(activity);
            }
          } else {
            result.push(activity);
          }
        });

        result.push(...filteredDeletions);
        return result;
      };

      const combinedActivity = processActivity(currentActivity, currentDeletions)
        .filter(item => {
          const eventDate = new Date(item.event.day);
          return eventDate.getFullYear() >= thresholdYear;
        });

      const sortedActivity = combinedActivity
        .sort((a, b) => {
          const dateA = new Date(a.event.FechaEditado || a.event.FechaAgregado || 0).getTime();
          const dateB = new Date(b.event.FechaEditado || b.event.FechaAgregado || 0).getTime();
          return dateB - dateA;
        })
        .slice(0, 5);

      setRecentActivity(sortedActivity);
      setLoading(false);
    };

    setupEventListeners();

    return () => {
      if (unsubscribeEvents) unsubscribeEvents();
      if (unsubscribeDeletions) unsubscribeDeletions();
    };
  }, []);

  return { events, recentActivity, loading };
}
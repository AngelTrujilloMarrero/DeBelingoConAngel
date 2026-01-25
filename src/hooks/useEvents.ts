import { useState, useEffect, useRef } from 'react';
import { onValue } from '../utils/firebase';
import { eventsRef, eventDeletionsRef } from '../utils/firebase';
import { Event, RecentActivityItem } from '../types';
import historicalStatsRaw from '../data/historicalStats.json';

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

// Función para verificar si dos eventos son similares
const areSimilarEvents = (event1: Event, event2: Event): boolean => {
  // Misma orquesta y municipio
  const sameOrchestra = event1.orquesta.toLowerCase().trim() === event2.orquesta.toLowerCase().trim();
  const sameMunicipality = event1.municipio.toLowerCase().trim() === event2.municipio.toLowerCase().trim();

  // Mismo tipo de evento
  const sameType = event1.tipo.toLowerCase().trim() === event2.tipo.toLowerCase().trim();

  // Lugar similar (considerando variations como "Casco", "Centro", etc.)
  const normalizePlace = (place: string) => {
    if (!place) return '';
    return place.toLowerCase().replace(/\b(casco|centro|plaza|plaza mayor|plaza del ayuntamiento)\b/g, '').trim();
  };
  const similarPlace = normalizePlace(event1.lugar || '') === normalizePlace(event2.lugar || '');

  // Misma hora (con tolerancia de 30 minutos)
  const getTimeInMinutes = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + (minutes || 0);
  };
  const timeDiff = Math.abs(getTimeInMinutes(event1.hora) - getTimeInMinutes(event2.hora));
  const sameHour = timeDiff <= 30; // 30 minutos de tolerancia

  // Criterios: al menos 3 de 4 condiciones deben cumplirse
  const conditions = [sameOrchestra, sameMunicipality, sameType, sameHour];
  const trueConditions = conditions.filter(Boolean).length;

  return trueConditions >= 3;
};

// Función para verificar si dos timestamps están dentro de una ventana de tiempo (horas)
const isWithinTimeWindow = (timestamp1: string, timestamp2: string, hours: number): boolean => {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);
  const diffInHours = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60);
  return diffInHours <= hours;
};

const historicalData = historicalStatsRaw as {
  years: any;
  events: Event[];
};

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

      const currentYear = new Date().getFullYear();
      const previousYear = currentYear - 1;

      // 1. Cargar eventos del año anterior desde archivos estáticos
      const archivedEvents = await loadEventsFromArchive(previousYear);

      // 2. Escuchar cambios en eventos de Firebase (año actual)
      unsubscribeEvents = onValue(eventsRef, (snapshot) => {
        const data = snapshot.val();
        const loadedEvents: Event[] = [];
        const allEvents: Event[] = [];

        if (data) {
          Object.entries(data).forEach(([key, value]: [string, any]) => {
            const event: Event = { id: key, ...value };
            const eventYear = new Date(event.day).getFullYear();

            // Cargar eventos del año actual Y eventos de Diciembre del año anterior
            // Esto asegura que en el cambio de año (ej: 1 Enero), los eventos del 31 Dic sigan visibles
            // aunque el archivo estático del año anterior aún no se haya generado/desplegado.
            const eventMonth = new Date(event.day).getMonth();
            if (eventYear >= currentYear || (eventYear === previousYear && eventMonth === 11)) {
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
          let type: 'add' | 'edit' | 'delete' = 'edit';
          if (event.cancelado) {
            type = 'delete';
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
              isWithinTimeWindow(activity.event.FechaAgregado || '', deletion.event.FechaEditado || '', 24)
            );

            if (similarDeletionIndex !== -1) {
              const similarDeletion = filteredDeletions[similarDeletionIndex];
              result.push({
                type: 'edit',
                event: {
                  ...activity.event,
                  FechaEditado: similarDeletion.event.FechaEditado
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
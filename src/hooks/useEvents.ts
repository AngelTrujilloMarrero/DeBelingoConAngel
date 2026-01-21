import { useState, useEffect, useRef } from 'react';
import { onValue } from '../utils/firebase';
import { eventsRef, eventDeletionsRef } from '../utils/firebase';
import { Event, RecentActivityItem } from '../types';
import historicalStatsRaw from '../data/historicalStats.json';

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
    // Escuchar cambios en eventos y eliminaciones
    const unsubscribeEvents = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      const loadedEvents: Event[] = [];
      const allEvents: Event[] = [];

      const storedYears = Object.keys(historicalData.years).map(Number);
      const thresholdYear = storedYears.length > 0 ? Math.max(...storedYears) + 1 : 0;

      if (data) {
        Object.entries(data).forEach(([key, value]: [string, any]) => {
          const event: Event = { id: key, ...value };
          const eventYear = new Date(event.day).getFullYear();

          if (eventYear >= thresholdYear) {
            allEvents.push(event);
            if (!event.cancelado) {
              loadedEvents.push(event);
            }
          }
        });
      }

      setEvents([...historicalData.events, ...loadedEvents]);

      // Actualizar actividad reciente basada en los datos actuales
      updateActivityLocally(allEvents, deletionsRef.current, thresholdYear);
    });

    const unsubscribeDeletions = onValue(eventDeletionsRef, (snapshot) => {
      const deletions: RecentActivityItem[] = [];
      const data = snapshot.val();

      const storedYears = Object.keys(historicalData.years).map(Number);
      const thresholdYear = storedYears.length > 0 ? Math.max(...storedYears) + 1 : 0;

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
            if (eventYear >= thresholdYear) {
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

      // Si eventos ya cargaron, actualizar actividad
      if (!loading) {
        // Nota: esto asume que 'events' ya contiene los datos actuales filtrados por el threshold
        // Para mayor precisión, podríamos disparar una actualización local si tuviéramos acceso a todos los eventos actuales
      }
    });

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

    return () => {
      unsubscribeEvents();
      unsubscribeDeletions();
    };
  }, []);

  return { events, recentActivity, loading };
}

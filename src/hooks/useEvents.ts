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
    const unsubscribeEvents = onValue(eventsRef, (snapshot) => {
      const loadedEvents: Event[] = [];
      const allEvents: Event[] = [];
      const data = snapshot.val();

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

          // Solo incluir eliminaciones de los últimos 400 días
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
    });

    // Combinar actividad actual y actualizaciones periódicas
    const updateRecentActivity = () => {
      const unsubscribeEventsTemp = onValue(eventsRef, (snapshot) => {
        const allEvents: Event[] = [];
        const data = snapshot.val();

        const storedYears = Object.keys(historicalData.years).map(Number);
        const thresholdYear = storedYears.length > 0 ? Math.max(...storedYears) + 1 : 0;

        if (data) {
          Object.entries(data).forEach(([key, value]: [string, any]) => {
            const event: Event = { id: key, ...value };
            const eventYear = new Date(event.day).getFullYear();

            if (eventYear >= thresholdYear) {
              allEvents.push(event);
            }
          });
        }

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

        // Agrupar actividad similar para evitar "Eliminado y luego Agregado"
        const processActivity = (current: RecentActivityItem[], deletions: RecentActivityItem[]) => {
          const filteredDeletions = [...deletions];
          const result: RecentActivityItem[] = [];

          // Detectar eventos similares entre agregados recientes y eliminaciones
          current.forEach(activity => {
            if (activity.type === 'add') {
              const similarDeletionIndex = filteredDeletions.findIndex(deletion => 
                areSimilarEvents(activity.event, deletion.event) &&
                isWithinTimeWindow(activity.event.FechaAgregado || '', deletion.event.FechaEditado || '', 24) // 24 horas
              );

              if (similarDeletionIndex !== -1) {
                // Encontramos un evento similar eliminado, lo convertimos en "modificado"
                const similarDeletion = filteredDeletions[similarDeletionIndex];
                result.push({
                  type: 'edit', // Mostrar como editado/modificado
                  event: {
                    ...activity.event,
                    FechaEditado: similarDeletion.event.FechaEditado // Usar timestamp de eliminación
                  }
                });
                // Eliminar la eliminación para no mostrarla por separado
                filteredDeletions.splice(similarDeletionIndex, 1);
              } else {
                result.push(activity);
              }
            } else {
              result.push(activity);
            }
          });

          // Agregar las eliminaciones restantes que no tienen agregado similar
          result.push(...filteredDeletions);

          return result;
        };

        const combinedActivity = processActivity(currentActivity, deletionsRef.current)
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
      });

      setTimeout(() => unsubscribeEventsTemp(), 100);
    };

    const activityInterval = setInterval(updateRecentActivity, 5000);
    updateRecentActivity();

    return () => {
      unsubscribeEvents();
      unsubscribeDeletions();
      clearInterval(activityInterval);
    };
  }, []);

  return { events, recentActivity, loading };
}

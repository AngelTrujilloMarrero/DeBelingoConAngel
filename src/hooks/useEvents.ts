import { useState, useEffect, useRef } from 'react';
import { onValue } from '../utils/firebase';
import { eventsRef } from '../utils/firebase';
import { Event, RecentActivityItem } from '../types';
import historicalStatsRaw from '../data/historicalStats.json';

const historicalData = historicalStatsRaw as {
  years: any;
  events: Event[];
};

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const prevEventsRef = useRef<Event[]>([]);
  const deletedEventsRef = useRef<RecentActivityItem[]>([]);

  useEffect(() => {
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      const loadedEvents: Event[] = [];
      const allEvents: Event[] = [];
      const data = snapshot.val();

      const currentYear = new Date().getFullYear();
      if (data) {
        Object.entries(data).forEach(([key, value]: [string, any]) => {
          const event: Event = { id: key, ...value };
          const eventYear = new Date(event.day).getFullYear();

          if (eventYear >= currentYear) {
            allEvents.push(event);
            if (!event.cancelado) {
              loadedEvents.push(event);
            }
          }
        });
      }

      // Detect hard deletions
      if (prevEventsRef.current.length > 0) {
        const currentIds = new Set(allEvents.map(e => e.id));
        const newlyDeleted = prevEventsRef.current.filter(e => !currentIds.has(e.id));

        newlyDeleted.forEach(deletedEvent => {
          // Check if already in deletedEventsRef to avoid duplicates
          if (!deletedEventsRef.current.some(item => item.event.id === deletedEvent.id)) {
            deletedEventsRef.current.push({
              type: 'delete',
              event: {
                ...deletedEvent,
                FechaEditado: new Date().toISOString() // Mark as deleted NOW
              }
            });
          }
        });
      }

      prevEventsRef.current = allEvents;

      // Calculate recent activity
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

      const combinedActivity = [...currentActivity, ...deletedEventsRef.current]
        .filter(item => {
          const eventDate = new Date(item.event.day);
          return eventDate.getFullYear() >= currentYear;
        });

      const sortedActivity = combinedActivity
        .sort((a, b) => {
          const dateA = new Date(a.event.FechaEditado || a.event.FechaAgregado || 0).getTime();
          const dateB = new Date(b.event.FechaEditado || b.event.FechaAgregado || 0).getTime();
          return dateB - dateA;
        })
        .slice(0, 5);

      setEvents([...historicalData.events, ...loadedEvents]);
      setRecentActivity(sortedActivity);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { events, recentActivity, loading };
}

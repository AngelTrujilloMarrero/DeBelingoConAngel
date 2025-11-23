import { useState, useEffect } from 'react';
import { onValue } from '../utils/firebase';
import { eventsRef } from '../utils/firebase';
import { Event, RecentActivityItem } from '../types';

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      const loadedEvents: Event[] = [];
      const allEvents: Event[] = [];
      const data = snapshot.val();

      if (data) {
        Object.entries(data).forEach(([key, value]: [string, any]) => {
          const event: Event = { id: key, ...value };

          // Ensure dates exist for comparison, but don't overwrite with 'now' if missing
          // If missing, they will be treated as old dates during sort

          allEvents.push(event);

          // Solo agregar eventos que NO estén cancelados para la lista principal
          if (!event.cancelado) {
            loadedEvents.push(event);
          }
        });
      }

      // Calculate recent activity (last 3 modifications)
      const activity = allEvents
        .filter(e => e.FechaEditado || e.FechaAgregado) // Only show events that actually have a date
        .sort((a, b) => {
          const dateA = new Date(a.FechaEditado || a.FechaAgregado || 0).getTime();
          const dateB = new Date(b.FechaEditado || b.FechaAgregado || 0).getTime();
          return dateB - dateA;
        })
        .slice(0, 5)
        .map(event => {
          let type: 'add' | 'edit' | 'delete' = 'edit';
          if (event.cancelado) {
            type = 'delete';
          } else if (event.FechaAgregado === event.FechaEditado) {
            type = 'add';
          }
          return { type, event };
        });

      setEvents(loadedEvents);
      setRecentActivity(activity);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { events, recentActivity, loading };
}

import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { logEvent } from 'firebase/analytics';
import { runTransaction, visitCountRef, analytics, db, ref } from '../utils/firebase';

export function useAnalytics() {
  const location = useLocation();
  const currentPath = location.pathname;
  const lastTrackedPath = useRef<string | null>(null);

  const trackVisit = useCallback(async (page: string) => {
    console.log('[Analytics] Tracking visit to page via GA4:', page);

    try {
      // 1. Log event to Google Analytics 4
      if (analytics) {
        logEvent(analytics, 'page_view', {
          page_path: page,
          page_title: document.title,
          page_location: window.location.href
        });
        console.log('[Analytics] GA4 page_view logged successfully');
      }
      
      // 2. Increment global lifetime visit count in Firebase (session-based)
      const hasCounted = sessionStorage.getItem('hasCountedVisit');
      if (!hasCounted) {
        await runTransaction(visitCountRef, (c) => (c || 0) + 1);

        // Daily visits atomic tracking (only 365 keys per year)
        const date = new Date();
        const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        
        const dayName = daysOfWeek[date.getDay()];
        const dayNum = date.getDate();
        const monthName = months[date.getMonth()];
        const year = date.getFullYear();

        // Unique daily key sorted: e.g. "2026-05-17 (Domingo 17 de Mayo)"
        const formattedDate = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')} (${dayName} ${dayNum} de ${monthName})`;
        
        try {
          const dailyVisitRef = ref(db, `dailyVisits/${formattedDate}`);
          await runTransaction(dailyVisitRef, (c) => (c || 0) + 1);
          console.log('[Analytics] Daily visit counter updated in real-time');
        } catch (dailyError) {
          console.error('[Analytics] Error updating daily visit counter:', dailyError);
        }

        sessionStorage.setItem('hasCountedVisit', 'true');
        console.log('[Analytics] Global visit counter incremented successfully');
      } else {
        console.log('[Analytics] Session already counted, skipping Firebase increment');
      }
    } catch (error) {
      console.error('[Analytics] Error tracking visit:', error);
    }
  }, []);

  useEffect(() => {
    if (lastTrackedPath.current !== currentPath) {
      lastTrackedPath.current = currentPath;
      trackVisit(currentPath);
    }
  }, [currentPath, trackVisit]);
}

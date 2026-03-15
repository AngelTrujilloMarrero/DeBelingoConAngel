import { useEffect, useRef } from 'react';
import { push, ref, runTransaction } from 'firebase/database';
import { db, visitCountRef } from '../utils/firebase';

interface VisitData {
  timestamp: number;
  page: string;
  country: string;
  city?: string;
  browser: string;
  os: string;
  device: string;
  referrer: string;
  duration?: number;
  // Nuevos campos (sin cookies)
  screenWidth?: number;
  screenHeight?: number;
  language?: string;
  timezone?: string;
  connection?: string;
}

const getDeviceInfo = () => {
  const ua = navigator.userAgent;

  // --- Browser ---
  let browser = 'Unknown';
  if (ua.includes('Edg/') || ua.includes('Edge/')) browser = 'Edge';
  else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera';
  else if (ua.includes('SamsungBrowser')) browser = 'Samsung Browser';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  // Chrome debe ir ANTES de Safari porque Chrome incluye "Safari" en su UA
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';

  // --- OS: Android ANTES que Linux (Android UA contiene "Linux") ---
  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Android')) os = 'Android';          // ← ANTES de Linux
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('CrOS')) os = 'Chrome OS';
  else if (ua.includes('Linux')) os = 'Linux';

  // --- Device ---
  let device = 'desktop';
  if (ua.includes('iPad') || (ua.includes('Tablet') && !ua.includes('Mobile'))) {
    device = 'tablet';
  } else if (
    ua.includes('Mobile') ||
    ua.includes('Android') ||
    ua.includes('iPhone') ||
    ua.includes('iPod')
  ) {
    device = 'mobile';
  }

  // --- Parámetros adicionales sin cookies ---
  const screenWidth = window.screen?.width ?? undefined;
  const screenHeight = window.screen?.height ?? undefined;
  const language = navigator.language || undefined;
  const timezone = Intl?.DateTimeFormat?.()?.resolvedOptions?.()?.timeZone || undefined;

  // API de red (no disponible en todos los navegadores)
  const nav = navigator as any;
  const connection = nav.connection?.effectiveType || nav.mozConnection?.effectiveType || undefined;

  return { browser, os, device, screenWidth, screenHeight, language, timezone, connection };
};

const getGeoInfo = async (): Promise<{ country: string; city: string }> => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (response.ok) {
      const data = await response.json();
      return {
        country: data.country_name || 'Unknown',
        city: data.city || 'Unknown'
      };
    }
  } catch (error) {
    console.warn('[Analytics] Geo fetch failed:', error);
  }
  return { country: 'Unknown', city: 'Unknown' };
};

export function useAnalytics() {
  const startTime = useRef<number>(Date.now());
  const hasTracked = useRef(false);

  useEffect(() => {
    const trackVisit = async () => {
      if (hasTracked.current) return;
      hasTracked.current = true;

      try {
        const { browser, os, device, screenWidth, screenHeight, language, timezone, connection } = getDeviceInfo();
        const { country, city } = await getGeoInfo();

        const visitData: VisitData = {
          timestamp: Date.now(),
          page: window.location.pathname || '/',
          country,
          city,
          browser,
          os,
          device,
          referrer: document.referrer || 'direct',
          ...(screenWidth !== undefined && { screenWidth }),
          ...(screenHeight !== undefined && { screenHeight }),
          ...(language && { language }),
          ...(timezone && { timezone }),
          ...(connection && { connection }),
        };

        const visitsRef = ref(db, 'analytics/visits');
        await push(visitsRef, visitData);

        await runTransaction(visitCountRef, (current) => {
          return (current || 0) + 1;
        });

        console.log('[Analytics] Visit tracked:', visitData);
      } catch (error) {
        console.error('[Analytics] Error tracking visit:', error);
      }
    };

    trackVisit();

    const handleBeforeUnload = () => {
      const duration = Math.round((Date.now() - startTime.current) / 1000);
      if (duration > 5) {
        const { browser, os, device } = getDeviceInfo();
        const visitData: VisitData = {
          timestamp: Date.now(),
          page: window.location.pathname || '/',
          country: 'Unknown',
          city: 'Unknown',
          browser,
          os,
          device,
          referrer: document.referrer || 'direct',
          duration
        };

        const visitsRef = ref(db, 'analytics/visits');
        push(visitsRef, visitData).catch(() => {});
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
}

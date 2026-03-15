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
  // Parámetros técnicos (sin cookies)
  screenWidth?: number;
  screenHeight?: number;
  language?: string;
  timezone?: string;
  connection?: string;
  memory?: number;        // RAM aproximada
  cores?: number;         // Núcleos CPU
  colorDepth?: number;    // Bits de color
  touchPoints?: number;   // Soporte táctil
  orientation?: string;   // Portrait/Landscape
}

const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  const nav = navigator as any;

  // --- Browser ---
  let browser = 'Unknown';
  if (ua.includes('Edg/') || ua.includes('Edge/')) browser = 'Edge';
  else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera';
  else if (ua.includes('SamsungBrowser')) browser = 'Samsung Browser';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';

  // --- OS ---
  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Android')) os = 'Android';
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

  // --- Parámetros adicionales ---
  const screenWidth = window.screen?.width ?? undefined;
  const screenHeight = window.screen?.height ?? undefined;
  const language = navigator.language || undefined;
  const timezone = Intl?.DateTimeFormat?.()?.resolvedOptions?.()?.timeZone || undefined;
  const connection = nav.connection?.effectiveType || nav.mozConnection?.effectiveType || undefined;
  
  // Nuevos parámetros técnicos
  const memory = nav.deviceMemory || undefined; 
  const cores = nav.hardwareConcurrency || undefined;
  const colorDepth = window.screen?.colorDepth || undefined;
  const touchPoints = nav.maxTouchPoints || undefined;
  const orientation = window.screen?.orientation?.type || undefined;

  return { 
    browser, os, device, screenWidth, screenHeight, language, 
    timezone, connection, memory, cores, colorDepth, touchPoints, orientation 
  };
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
        const info = getDeviceInfo();
        const { country, city } = await getGeoInfo();

        const visitData: VisitData = {
          timestamp: Date.now(),
          page: window.location.pathname || '/',
          country,
          city,
          browser: info.browser,
          os: info.os,
          device: info.device,
          referrer: document.referrer || 'direct',
          ...(info.screenWidth && { screenWidth: info.screenWidth }),
          ...(info.screenHeight && { screenHeight: info.screenHeight }),
          ...(info.language && { language: info.language }),
          ...(info.timezone && { timezone: info.timezone }),
          ...(info.connection && { connection: info.connection }),
          ...(info.memory && { memory: info.memory }),
          ...(info.cores && { cores: info.cores }),
          ...(info.colorDepth && { colorDepth: info.colorDepth }),
          ...(info.touchPoints !== undefined && { touchPoints: info.touchPoints }),
          ...(info.orientation && { orientation: info.orientation }),
        };

        const visitsRef = ref(db, 'analytics/visits');
        await push(visitsRef, visitData);

        await runTransaction(visitCountRef, (current) => {
          return (current || 0) + 1;
        });

        console.log('[Analytics] Visit tracked (Deep Analysis):', visitData);
      } catch (error) {
        console.error('[Analytics] Error tracking visit:', error);
      }
    };

    trackVisit();

    const handleBeforeUnload = () => {
      const duration = Math.round((Date.now() - startTime.current) / 1000);
      if (duration > 5) {
        const info = getDeviceInfo();
        const visitData: VisitData = {
          timestamp: Date.now(),
          page: window.location.pathname || '/',
          country: 'Unknown',
          city: 'Unknown',
          browser: info.browser,
          os: info.os,
          device: info.device,
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

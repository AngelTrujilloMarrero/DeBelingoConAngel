import { useEffect, useRef } from 'react';
import { push, ref, runTransaction } from 'firebase/database';
import { db, visitCountRef } from '../utils/firebase';

interface VisitData {
  timestamp: number;
  page: string;
  country: string;
  countryCode?: string;
  city?: string;
  browser: string;
  os: string;
  device: string;
  referrer: string;
  duration?: number;
  // Pantalla
  screenWidth?: number;
  screenHeight?: number;
  viewportWidth?: number;
  viewportHeight?: number;
  pixelRatio?: number;
  colorDepth?: number;
  orientation?: string;
  // Localización
  language?: string;
  timezone?: string;
  // Conexión
  connection?: string;
  downlink?: number;
  saveData?: boolean;
  // Hardware
  memory?: number;
  cores?: number;
  touchPoints?: number;
  // Preferencias UX
  darkTheme?: boolean;
  reducedMotion?: boolean;
  cookiesEnabled?: boolean;
  doNotTrack?: boolean;
  // Detección
  isBot?: boolean;
  // Rendimiento
  loadTime?: number;
  // Marketing
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

const getGeoInfo = async (): Promise<{ country: string; city: string; countryCode: string }> => {
  // Intento 1: ipapi.co
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (response.ok) {
      const data = await response.json();
      if (data.country_name && data.country_name !== 'Unknown') {
        return {
          country: data.country_name,
          countryCode: data.country,
          city: data.city || 'Unknown'
        };
      }
    }
  } catch (e) { /* ignore */ }

  // Intento 2: Backup con freeipapi.com
  try {
    const response = await fetch('https://freeipapi.com/api/json');
    if (response.ok) {
      const data = await response.json();
      return {
        country: data.countryName,
        countryCode: data.countryCode,
        city: data.cityName || 'Unknown'
      };
    }
  } catch (e) { /* ignore */ }

  return { country: 'Unknown', city: 'Unknown', countryCode: 'UN' };
};

const getUtmParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get('utm_source') || undefined,
    utmMedium: params.get('utm_medium') || undefined,
    utmCampaign: params.get('utm_campaign') || undefined
  };
};

const getLoadTime = (): number | undefined => {
  try {
    const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (perf) {
      return Math.round(perf.loadEventEnd - perf.startTime);
    }
  } catch (e) { /* ignore */ }
  return undefined;
};

const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  const nav = navigator as any;

  let browser = 'Unknown';
  if (ua.includes('Edg/') || ua.includes('Edge/')) browser = 'Edge';
  else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera';
  else if (ua.includes('SamsungBrowser')) browser = 'Samsung Browser';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';

  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('CrOS')) os = 'Chrome OS';
  else if (ua.includes('Linux')) os = 'Linux';

  let device = 'desktop';
  if (ua.includes('iPad') || (ua.includes('Tablet') && !ua.includes('Mobile'))) {
    device = 'tablet';
  } else if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) {
    device = 'mobile';
  }

  const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
  const utm = getUtmParams();

  return { 
    browser, os, device,
    // Pantalla
    screenWidth: window.screen?.width,
    screenHeight: window.screen?.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    pixelRatio: window.devicePixelRatio ? Math.round(window.devicePixelRatio * 100) / 100 : undefined,
    colorDepth: window.screen?.colorDepth,
    orientation: window.screen?.orientation?.type,
    // Localización
    language: navigator.language,
    timezone: Intl?.DateTimeFormat?.()?.resolvedOptions?.()?.timeZone,
    // Conexión
    connection: conn?.effectiveType,
    downlink: conn?.downlink,
    saveData: conn?.saveData,
    // Hardware
    memory: nav.deviceMemory, 
    cores: nav.hardwareConcurrency,
    touchPoints: nav.maxTouchPoints,
    // Preferencias UX
    darkTheme: window.matchMedia?.('(prefers-color-scheme: dark)').matches,
    reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    cookiesEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack === '1',
    // Bot
    isBot: !!nav.webdriver,
    // UTM
    ...utm
  };
};

export function useAnalytics() {
  const hasTracked = useRef(false);

  useEffect(() => {
    const trackVisit = async () => {
      if (hasTracked.current) return;
      hasTracked.current = true;

      try {
        const { country, city, countryCode } = await getGeoInfo();
        const info = getDeviceInfo();

        // Esperar a que la página termine de cargar para capturar el loadTime
        const loadTime = getLoadTime();

        const visitData: VisitData = {
          timestamp: Date.now(),
          page: window.location.pathname || '/',
          country,
          countryCode,
          city,
          referrer: document.referrer || 'direct',
          ...(loadTime && loadTime > 0 && { loadTime }),
          ...info
        };

        // Limpiar campos undefined para no mandar basura a Firebase
        const cleanData = Object.fromEntries(
          Object.entries(visitData).filter(([, v]) => v !== undefined && v !== null)
        );

        const visitsRef = ref(db, 'analytics/visits');
        await push(visitsRef, cleanData);
        await runTransaction(visitCountRef, (c) => (c || 0) + 1);
      } catch (error) {
        console.error('[Analytics] Error:', error);
      }
    };

    // Esperar un momento breve para que loadTime esté disponible
    setTimeout(trackVisit, 1500);
  }, []);
}

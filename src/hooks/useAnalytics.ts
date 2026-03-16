import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { push, ref, runTransaction, update } from 'firebase/database';
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
  // Pantalla extra
  availWidth?: number;
  availHeight?: number;
  screenOrientation?: string;
  // Localización
  language?: string;
  languages?: string[];
  languageCount?: number;
  timezone?: string;
  // Conexión
  connection?: string;
  connectionType?: string;
  downlink?: number;
  downlinkMax?: number;
  rtt?: number;
  saveData?: boolean;
  // Hardware
  memory?: number;
  cores?: number;
  touchPoints?: number;
  touchSupport?: boolean;
  // Preferencias UX
  darkTheme?: boolean;
  reducedMotion?: boolean;
  reducedTransparency?: boolean;
  prefersContrast?: string;
  colorGamut?: string;
  monochrome?: boolean;
  invertedColors?: boolean;
  forcedColors?: boolean;
  // Privacidad y Entorno
  cookiesEnabled?: boolean;
  doNotTrack?: boolean;
  pdfViewerEnabled?: boolean;
  webdriver?: boolean;
  vendor?: string;
  platform?: string;
  isSecureContext?: boolean;
  online?: boolean;
  historyLength?: number;
  clipboardEnabled?: boolean;
  // Detección
  isBot?: boolean;
  // Rendimiento
  loadTime?: number;
  ttfb?: number;
  firstPaint?: number;
  domInteractive?: number;
  // Marketing
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

const getGeoInfo = async (): Promise<{ country: string; city: string; countryCode: string }> => {
  // Intentar caché
  try {
    const cached = sessionStorage.getItem('geoInfo');
    if (cached) return JSON.parse(cached);
  } catch (e) { /* ignore */ }

  const fallback = { country: 'Unknown', city: 'Unknown', countryCode: 'UN' };

  // Intento 1: ipapi.co
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch('https://ipapi.co/json/', { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      if (data.country_name && data.country_name !== 'Unknown') {
        const result = {
          country: data.country_name,
          countryCode: data.country,
          city: data.city || 'Unknown'
        };
        sessionStorage.setItem('geoInfo', JSON.stringify(result));
        return result;
      }
    }
  } catch (e) { /* ignore */ }

  // Intento 2: Backup con freeipapi.com
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const response = await fetch('https://freeipapi.com/api/json', { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      const result = {
        country: data.countryName,
        countryCode: data.countryCode,
        city: data.cityName || 'Unknown'
      };
      sessionStorage.setItem('geoInfo', JSON.stringify(result));
      return result;
    }
  } catch (e) { /* ignore */ }

  return fallback;
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

const getPerformanceData = () => {
  try {
    const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (perf) {
      return {
        ttfb: perf.responseStart && perf.requestStart ? Math.round(perf.responseStart - perf.requestStart) : 0,
        firstPaint: Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0),
        domInteractive: perf.domInteractive ? Math.round(perf.domInteractive) : 0,
      };
    }
  } catch (e) { /* ignore */ }
  return {};
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
  
  const getConnectionType = () => {
    if (!conn) return 'unknown';
    
    // Intentar primero type (wifi, cellular, ethernet)
    if (conn.type && conn.type !== 'unknown') return conn.type;
    
    // Si type no está disponible, usar effectiveType
    if (conn.effectiveType && conn.effectiveType !== 'unknown') {
      // effectiveType puede ser 'slow-2g', '2g', '3g', '4g'
      // Mapear a tipos más simples
      if (conn.effectiveType === '4g') return '4g';
      if (conn.effectiveType === '3g') return '3g';
      if (conn.effectiveType === '2g') return '2g';
      if (conn.effectiveType === 'slow-2g') return '2g';
    }
    
    // Si tenemos downlink, podemos inferir
    if (conn.downlink) {
      if (conn.downlink >= 10) return 'wifi'; // Alta velocidad típicamente WiFi o fibra
      if (conn.downlink >= 4) return '4g';
      if (conn.downlink >= 1) return '3g';
    }
    
    return 'unknown';
  };

  const connectionType = getConnectionType();
  const utm = getUtmParams();

  const getContrastPref = () => {
    if (window.matchMedia?.('(prefers-contrast: more)').matches) return 'more';
    if (window.matchMedia?.('(prefers-contrast: less)').matches) return 'less';
    if (window.matchMedia?.('(prefers-contrast: custom)').matches) return 'custom';
    return 'no-preference';
  };

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
    // Pantalla extra
    availWidth: window.screen?.availWidth,
    availHeight: window.screen?.availHeight,
    screenOrientation: window.screen?.orientation?.type,
    // Localización
    language: navigator.language,
    languages: navigator.languages?.length > 0 ? Array.from(navigator.languages) : undefined,
    languageCount: navigator.languages?.length,
    timezone: Intl?.DateTimeFormat?.()?.resolvedOptions?.()?.timeZone,
    // Conexión - usar función mejorada de detección
    connection: connectionType,
    connectionType: conn?.type || connectionType,
    downlink: conn?.downlink,
    downlinkMax: conn?.downlinkMax,
    rtt: conn?.rtt,
    saveData: conn?.saveData,
    // Hardware
    memory: nav.deviceMemory, 
    cores: nav.hardwareConcurrency,
    touchPoints: nav.maxTouchPoints,
    touchSupport: 'ontouchstart' in window,
    // Preferencias UX
    darkTheme: window.matchMedia?.('(prefers-color-scheme: dark)').matches,
    reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    reducedTransparency: window.matchMedia?.('(prefers-reduced-transparency: reduce)').matches,
    prefersContrast: getContrastPref(),
    colorGamut: window.matchMedia?.('(color-gamut: p3)').matches ? 'p3' : 
                 window.matchMedia?.('(color-gamut: rec2020)').matches ? 'rec2020' : 'srgb',
    monochrome: window.matchMedia?.('(monochrome)').matches,
    invertedColors: window.matchMedia?.('(inverted-colors: inverted)').matches,
    forcedColors: window.matchMedia?.('(forced-colors: active)').matches,
    // Privacidad y Entorno
    cookiesEnabled: navigator.cookieEnabled,
    doNotTrack: navigator.doNotTrack === '1',
    pdfViewerEnabled: nav.pdfViewerEnabled,
    webdriver: nav.webdriver,
    vendor: navigator.vendor,
    platform: navigator.platform,
    isSecureContext: window.isSecureContext,
    online: navigator.onLine,
    historyLength: window.history?.length,
    clipboardEnabled: !!navigator.clipboard,
    // Bot
    isBot: !!nav.webdriver,
    // UTM
    ...utm
  };
};

export function useAnalytics() {
  const location = useLocation();
  const currentPath = location.pathname;
  const lastTrackedPath = useRef<string | null>(null);
  const visitKeyRef = useRef<string | null>(null);
  const pageStartTimeRef = useRef<number>(0);

  const trackVisit = useCallback(async (page: string) => {
    console.log('[Analytics] Tracking visit for page:', page);

    try {
      console.log('[Analytics] Fetching geo info...');
      const geoInfo = await getGeoInfo();
      console.log('[Analytics] Geo info result:', geoInfo);
      
      const info = getDeviceInfo();
      const perfData = getPerformanceData();

      const loadTime = getLoadTime();

      const visitData: Record<string, any> = {
        timestamp: Date.now(),
        page: page,
        country: geoInfo.country || 'Unknown',
        countryCode: geoInfo.countryCode || 'UN',
        city: geoInfo.city || 'Unknown',
        referrer: document.referrer || 'direct',
        ...perfData,
        ...info
      };

      if (loadTime && loadTime > 0) {
        visitData.loadTime = loadTime;
      }

      const cleanData: Record<string, any> = {};
      for (const [k, v] of Object.entries(visitData)) {
        if (v === undefined || v === null) continue;
        if (typeof v === 'number' && !Number.isFinite(v)) continue;
        if (Array.isArray(v)) {
          cleanData[k] = v.join(', ');
        } else {
          cleanData[k] = v;
        }
      }

      console.log('[Analytics] Sending visit data:', cleanData);

      const visitsRef = ref(db, 'analytics/visits');
      
      try {
        const result = await push(visitsRef, cleanData);
        visitKeyRef.current = result.key;
        console.log('[Analytics] Visit pushed successfully:', result.key);
      } catch (pushError) {
        console.error('[Analytics] Error registering visit details:', pushError);
      }

      try {
        const visitKey = sessionStorage.getItem('hasCountedVisit');
        if (!visitKey) {
          await runTransaction(visitCountRef, (c) => (c || 0) + 1);
          sessionStorage.setItem('hasCountedVisit', 'true');
          console.log('[Analytics] Counter incremented successfully');
        } else {
          console.log('[Analytics] Session already counted, skipping counter increment');
        }
      } catch (txnError) {
        console.error('[Analytics] Error in counter transaction:', txnError);
      }
    } catch (error) {
      console.error('[Analytics] Error:', error);
    }
  }, []);

  const trackDuration = useCallback(async () => {
    if (!visitKeyRef.current || pageStartTimeRef.current === 0) return;
    
    const duration = Date.now() - pageStartTimeRef.current;
    
    try {
      const visitRef = ref(db, `analytics/visits/${visitKeyRef.current}`);
      await update(visitRef, { duration });
      console.log('[Analytics] Duration tracked:', duration);
    } catch (e) {
      console.error('[Analytics] Error updating duration:', e);
    }
  }, []);

  useEffect(() => {
    pageStartTimeRef.current = Date.now();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        trackDuration();
      }
    };

    const handleBeforeUnload = () => {
      trackDuration();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      trackDuration();
    };
  }, [trackDuration]);

  useEffect(() => {
    if (lastTrackedPath.current !== currentPath) {
      lastTrackedPath.current = currentPath;
      pageStartTimeRef.current = Date.now();
      visitKeyRef.current = null;
      trackVisit(currentPath);
    }
  }, [currentPath, trackVisit]);
}

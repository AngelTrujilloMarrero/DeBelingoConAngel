import { useEffect, useRef } from 'react';
import { push, ref, runTransaction } from 'firebase/database';
import { db, visitCountRef } from '../utils/firebase';

interface VisitData {
  timestamp: number;
  page: string;
  country: string;
  countryCode?: string; // Nuevo: Para banderas automáticas
  city?: string;
  browser: string;
  os: string;
  device: string;
  referrer: string;
  duration?: number;
  screenWidth?: number;
  screenHeight?: number;
  language?: string;
  timezone?: string;
  connection?: string;
  memory?: number;
  cores?: number;
  colorDepth?: number;
  touchPoints?: number;
  orientation?: string;
  darkTheme?: boolean;
  reducedMotion?: boolean;
  saveData?: boolean;
  downlink?: number;
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

  // Intento 2: Backup con freeipapi.com (muy fiable)
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

  return { 
    browser, os, device,
    screenWidth: window.screen?.width,
    screenHeight: window.screen?.height,
    language: navigator.language,
    timezone: Intl?.DateTimeFormat?.()?.resolvedOptions?.()?.timeZone,
    connection: conn?.effectiveType,
    downlink: conn?.downlink,
    saveData: conn?.saveData,
    memory: nav.deviceMemory, 
    cores: nav.hardwareConcurrency,
    darkTheme: window.matchMedia?.('(prefers-color-scheme: dark)').matches,
    reducedMotion: window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  };
};

export function useAnalytics() {
  const startTime = useRef<number>(Date.now());
  const hasTracked = useRef(false);

  useEffect(() => {
    const trackVisit = async () => {
      if (hasTracked.current) return;
      hasTracked.current = true;

      try {
        const { country, city, countryCode } = await getGeoInfo();
        const info = getDeviceInfo();

        const visitData: VisitData = {
          timestamp: Date.now(),
          page: window.location.pathname || '/',
          country,
          countryCode,
          city,
          browser: info.browser,
          os: info.os,
          device: info.device,
          referrer: document.referrer || 'direct',
          ...info
        };

        const visitsRef = ref(db, 'analytics/visits');
        await push(visitsRef, visitData);
        await runTransaction(visitCountRef, (c) => (c || 0) + 1);
      } catch (error) {
        console.error('[Analytics] Error:', error);
      }
    };

    trackVisit();
  }, []);
}

import { useEffect, useRef } from 'react';
import { push, ref } from 'firebase/database';
import { db } from '../utils/firebase';

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
}

const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  
  let browser = 'Unknown';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  else if (ua.includes('OPR') || ua.includes('Opera')) browser = 'Opera';
  
  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  
  let device = 'desktop';
  if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone') || ua.includes('iPad')) {
    device = 'mobile';
  } else if (ua.includes('Tablet') || ua.includes('iPad')) {
    device = 'tablet';
  }
  
  return { browser, os, device };
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
        const { browser, os, device } = getDeviceInfo();
        const { country, city } = await getGeoInfo();
        
        const visitData: VisitData = {
          timestamp: Date.now(),
          page: window.location.pathname || '/',
          country,
          city,
          browser,
          os,
          device,
          referrer: document.referrer || 'direct'
        };

        const visitsRef = ref(db, 'analytics/visits');
        await push(visitsRef, visitData);
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

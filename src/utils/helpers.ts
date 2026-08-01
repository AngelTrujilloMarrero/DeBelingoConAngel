import { Event, RecentActivityItem } from '../types';

export function getRandomColor(): string {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export function getLastUpdateDate(events: Event[], recentActivity: RecentActivityItem[] = []): string {
  let lastUpdateDate: Date | null = null;

  events.forEach(event => {
    const fechaEditado = new Date(event.FechaEditado || event.FechaAgregado || '');
    if (fechaEditado.toString() !== 'Invalid Date' && (!lastUpdateDate || fechaEditado > lastUpdateDate)) {
      lastUpdateDate = fechaEditado;
    }
  });

  recentActivity.forEach(item => {
    const fecha = new Date(item.event.FechaEditado || item.event.FechaAgregado || '');
    if (fecha.toString() !== 'Invalid Date' && (!lastUpdateDate || fecha > lastUpdateDate)) {
      lastUpdateDate = fecha;
    }
  });

  return lastUpdateDate 
    ? `${lastUpdateDate.toLocaleDateString('es-ES')} a las ${lastUpdateDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}H`
    : 'N/A';
}

export interface UpdateInfo {
  formatted: string;
  relativeLabel: string;
  textColor: string;
  badgeClasses: string;
}

export function getCanaryTime(): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Atlantic/Canary',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const getVal = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0', 10);
  return new Date(Date.UTC(getVal('year'), getVal('month') - 1, getVal('day'), getVal('hour'), getVal('minute'), getVal('second')));
}

export interface VisibleWindow {
  start: Date;
  end: Date;
}

export function getVisibleWindow(canaryNow: Date): VisibleWindow {
  const dayOfWeek = canaryNow.getUTCDay();
  const timeMinutes = canaryNow.getUTCHours() * 60 + canaryNow.getUTCMinutes();
  const NIGHT = 23 * 60 + 50;

  const todayStart = new Date(Date.UTC(
    canaryNow.getUTCFullYear(),
    canaryNow.getUTCMonth(),
    canaryNow.getUTCDate()
  ));
  const dayMs = 24 * 60 * 60 * 1000;

  const dayAt = (offset: number, endOfDay = false): Date => {
    const d = new Date(todayStart.getTime() + offset * dayMs);
    if (endOfDay) d.setUTCHours(23, 59, 59, 999);
    return d;
  };

  const mondayOffset = (dayOfWeek + 6) % 7;

  const isFridayNight = dayOfWeek === 5 && timeMinutes >= NIGHT;
  const isSaturdayNight = dayOfWeek === 6 && timeMinutes >= NIGHT;
  const isSundayNight = dayOfWeek === 0 && timeMinutes >= NIGHT;

  if (isFridayNight) {
    return { start: dayAt(1), end: dayAt(1, true) };
  }
  if (isSaturdayNight) {
    return { start: dayAt(1), end: dayAt(1, true) };
  }
  if (isSundayNight) {
    return { start: dayAt(1), end: dayAt(5, true) };
  }
  if (dayOfWeek === 6) {
    return { start: todayStart, end: dayAt(0, true) };
  }
  if (dayOfWeek === 0) {
    return { start: todayStart, end: dayAt(0, true) };
  }
  return { start: dayAt(-mondayOffset), end: dayAt(4 - mondayOffset, true) };
}

export function getLastUpdateInfo(events: Event[], recentActivity: RecentActivityItem[] = []): UpdateInfo {
  let lastUpdateDate: Date | null = null;

  events.forEach(event => {
    const fechaEditado = new Date(event.FechaEditado || event.FechaAgregado || '');
    if (fechaEditado.toString() !== 'Invalid Date' && (!lastUpdateDate || fechaEditado > lastUpdateDate)) {
      lastUpdateDate = fechaEditado;
    }
  });

  recentActivity.forEach(item => {
    const fecha = new Date(item.event.FechaEditado || item.event.FechaAgregado || '');
    if (fecha.toString() !== 'Invalid Date' && (!lastUpdateDate || fecha > lastUpdateDate)) {
      lastUpdateDate = fecha;
    }
  });

  const formatted = lastUpdateDate
    ? `${lastUpdateDate.toLocaleDateString('es-ES')} a las ${lastUpdateDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}H`
    : 'N/A';

  if (!lastUpdateDate) {
    return { formatted, relativeLabel: '', textColor: 'text-gray-400', badgeClasses: 'bg-gray-500/20 text-gray-300 border-gray-500/30' };
  }

  const now = getCanaryTime();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const updateDayStart = new Date(Date.UTC(lastUpdateDate.getFullYear(), lastUpdateDate.getMonth(), lastUpdateDate.getDate()));
  const diffDays = Math.floor((todayStart.getTime() - updateDayStart.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { formatted, relativeLabel: 'Hoy', textColor: 'text-emerald-300', badgeClasses: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
  } else if (diffDays === 1) {
    return { formatted, relativeLabel: 'Ayer', textColor: 'text-amber-300', badgeClasses: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
  } else if (diffDays <= 3) {
    return { formatted, relativeLabel: `Hace ${diffDays} días`, textColor: 'text-orange-300', badgeClasses: 'bg-orange-500/20 text-orange-300 border-orange-500/40' };
  } else if (diffDays <= 7) {
    return { formatted, relativeLabel: `Hace ${diffDays} días`, textColor: 'text-red-300', badgeClasses: 'bg-red-500/20 text-red-300 border-red-500/40' };
  } else {
    return { formatted, relativeLabel: `Hace ${diffDays} días`, textColor: 'text-red-400', badgeClasses: 'bg-red-600/20 text-red-400 border-red-600/40' };
  }
}

export function groupEventsByDay(events: Event[], canaryNow?: Date): { [key: string]: Event[] } {
  const eventsByDay: { [key: string]: Event[] } = {};

  if (!isFirebaseHosting()) {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    events.forEach(event => {
      const eventDate = new Date(event.day);
      if (eventDate >= twoDaysAgo) {
        const dayKey = eventDate.toISOString().split('T')[0];
        if (!eventsByDay[dayKey]) eventsByDay[dayKey] = [];
        eventsByDay[dayKey].push(event);
      }
    });
    return eventsByDay;
  }

  const now = canaryNow || getCanaryTime();

  const { start, end } = getVisibleWindow(now);

  events.forEach(event => {
    const eventDate = new Date(event.day + 'T00:00:00Z');
    if (eventDate >= start && eventDate <= end) {
      const dayKey = eventDate.toISOString().split('T')[0];
      if (!eventsByDay[dayKey]) {
        eventsByDay[dayKey] = [];
      }
      eventsByDay[dayKey].push(event);
    }
  });

  return eventsByDay;
}

export function sortEventsByDateTime(events: Event[]): Event[] {
  return events.sort((a, b) => {
    return new Date(`${a.day}T${a.hora}`).getTime() - new Date(`${b.day}T${b.hora}`).getTime();
  });
}

export function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatDayName(date: Date): string {
  const dayName = date.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
  return capitalizeFirstLetter(dayName);
}

export function getBrowserInfo() {
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
  const isInstagram = ua.indexOf("Instagram") > -1;
  const isFacebook = (ua.indexOf("FBAN") > -1) || (ua.indexOf("FBAV") > -1);
  const isAndroid = /Android/i.test(ua);
  const isiOS = /iPhone|iPad|iPod/i.test(ua);
  
  return {
    isEmbedded: isInstagram || isFacebook,
    isInstagram,
    isFacebook,
    isAndroid,
    isiOS
  };
}

export function isEmbeddedBrowser(): boolean {
  return getBrowserInfo().isEmbedded;
}

export function isFirebaseHosting(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname.endsWith('.web.app') || hostname.endsWith('.firebaseapp.com');
}

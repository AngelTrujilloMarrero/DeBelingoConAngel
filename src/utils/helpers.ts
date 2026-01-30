import { Event } from '../types';

export function getRandomColor(): string {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export function getLastUpdateDate(events: Event[]): string {
  let lastUpdateDate: Date | null = null;
  events.forEach(event => {
    const fechaEditado = new Date(event.FechaEditado || event.FechaAgregado || '');
    if (fechaEditado.toString() !== 'Invalid Date' && (!lastUpdateDate || fechaEditado > lastUpdateDate)) {
      lastUpdateDate = fechaEditado;
    }
  });
  return lastUpdateDate ? lastUpdateDate.toLocaleString('es-ES') : 'N/A';
}

export function groupEventsByDay(events: Event[]): { [key: string]: Event[] } {
  const eventsByDay: { [key: string]: Event[] } = {};
  
  events.forEach(event => {
    const eventDate = new Date(event.day);
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    if (eventDate >= twoDaysAgo) {
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
    month: 'long', 
    year: 'numeric' 
  });
  return capitalizeFirstLetter(dayName);
}

export function isEmbeddedBrowser(): boolean {
  const ua = navigator.userAgent || navigator.vendor || (window as any).opera;
  return (ua.indexOf("FBAN") > -1) || (ua.indexOf("FBAV") > -1) || (ua.indexOf("Instagram") > -1);
}



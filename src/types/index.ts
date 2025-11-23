export interface Event {
  id: string;
  day: string;
  hora: string;
  tipo: string;
  lugar?: string;
  municipio: string;
  orquesta: string;
  cancelado?: boolean;
  FechaEditado?: string;
  FechaAgregado?: string;
}

export interface OrquestaCount {
  [key: string]: number;
}

export interface MonthlyOrquestaCount {
  [month: string]: {
    [orquesta: string]: number;
  };
}

export interface MunicipioMapping {
  [key: string]: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RecentActivityItem {
  type: 'add' | 'edit' | 'delete';
  event: Event;
}

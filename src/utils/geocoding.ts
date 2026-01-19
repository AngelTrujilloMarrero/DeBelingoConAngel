import { Coordinates, MunicipioMapping } from '../types';

export const municipioMapping: MunicipioMapping = {
  "Adeje": "Adeje",
  "Arafo": "Arafo",
  "Arona": "Arona",
  "Buenavista": "Buenavista del Norte",
  "Candelaria": "Candelaria",
  "Rosario": "El Rosario",
  "Sauzal": "El Sauzal",
  "Tanque": "El Tanque",
  "Fasnia": "Fasnia",
  "Garachico": "Garachico",
  "Granadilla": "Granadilla de Abona",
  "Guancha": "La Guancha",
  "Guía": "Guía de Isora",
  "Güímar": "Güímar",
  "Icod": "Icod de los Vinos",
  "Matanza": "La Matanza de Acentejo",
  "Orotava": "La Orotava",
  "Puerto": "Puerto de la Cruz",
  "Realejos": "Los Realejos",
  "Laguna": "San Cristóbal de La Laguna",
  "San Juan Rambla": "San Juan de la Rambla",
  "San Miguel": "San Miguel de Abona",
  "Santa Cruz": "Santa Cruz de Tenerife",
  "Santa Úrsula": "Santa Úrsula",
  "Santiago Teide": "Santiago del Teide",
  "Tacoronte": "Tacoronte",
  "Tegueste": "Tegueste",
  "Victoria": "La Victoria de Acentejo",
  "Vilaflor": "Vilaflor de Chasna",
  "Silos": "Los Silos"
};

export const normalizarMunicipio = (municipio: string): string => {
  if (!municipio) return '';
  const search = municipio.trim();
  for (const [key, value] of Object.entries(municipioMapping)) {
    if (search.includes(key)) return value;
  }
  return search;
};


// Coordenadas estáticas para evitar llamadas a la API
export const municipioCoordinates: Record<string, Coordinates> = {
  "Adeje": { lat: 28.1263, lng: -16.7433 },
  "Arafo": { lat: 28.3463, lng: -16.3989 },
  "Arona": { lat: 28.0377, lng: -16.6904 },
  "Buenavista": { lat: 28.3424, lng: -16.8722 },
  "Candelaria": { lat: 28.3581, lng: -16.3843 },
  "Rosario": { lat: 28.4500, lng: -16.3667 },
  "Sauzal": { lat: 28.4735, lng: -16.4363 },
  "Tanque": { lat: 28.3333, lng: -16.7833 },
  "Fasnia": { lat: 28.2319, lng: -16.4421 },
  "Garachico": { lat: 28.3605, lng: -16.7612 },
  "Granadilla": { lat: 28.1021, lng: -16.5577 },
  "Guancha": { lat: 28.3789, lng: -16.6604 },
  "Guía": { lat: 28.1907, lng: -16.7965 },
  "Güímar": { lat: 28.2737, lng: -16.4083 },
  "Icod": { lat: 28.3670, lng: -16.6999 },
  "Matanza": { lat: 28.4500, lng: -16.4500 },
  "Orotava": { lat: 28.3833, lng: -16.5167 },
  "Puerto": { lat: 28.4167, lng: -16.5500 },
  "Realejos": { lat: 28.3667, lng: -16.6333 },
  "Laguna": { lat: 28.4667, lng: -16.3667 },
  "San Juan Rambla": { lat: 28.3833, lng: -16.6500 },
  "San Miguel": { lat: 28.0833, lng: -16.6333 },
  "Santa Cruz": { lat: 28.4682, lng: -16.2546 },
  "Santa Úrsula": { lat: 28.4333, lng: -16.5000 },
  "Santiago Teide": { lat: 28.2833, lng: -16.8333 },
  "Tacoronte": { lat: 28.4667, lng: -16.4167 },
  "Tegueste": { lat: 28.5167, lng: -16.3333 },
  "Victoria": { lat: 28.4328, lng: -16.4674 },
  "Vilaflor": { lat: 28.1000, lng: -16.6333 },
  "Silos": { lat: 28.3662, lng: -16.8164 }
};

export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  // Primero intentamos buscar en nuestro mapa estático si es un municipio directo
  for (const [key, coords] of Object.entries(municipioCoordinates)) {
    if (address.toLowerCase().includes(key.toLowerCase())) {
      return coords;
    }
  }

  if (!address || address.startsWith(",")) {
    console.warn("Dirección inválida:", address);
    return null;
  }

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'VerbenasTenerife/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    console.warn("No se encontraron coordenadas para:", address);
    return null;
  } catch (error) {
    console.error("Error en geocodificación:", error);
    return null;
  }
}

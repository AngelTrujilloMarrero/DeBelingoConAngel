import { Coordinates, MunicipioMapping } from '../types';
import { getSecurityHeaders } from './firebase';

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

export const lugarCoordinates: Record<string, Coordinates> = {
  // SAN CRISTÓBAL DE LA LAGUNA
  "Tejina": { lat: 28.4947, lng: -16.3486 },
  "San Matias": { lat: 28.4503, lng: -16.3222 },
  "Valle De Guerra": { lat: 28.4425, lng: -16.3297 },
  "La Cuesta": { lat: 28.4583, lng: -16.3167 },
  "El Coromoto": { lat: 28.4700, lng: -16.3350 },
  "Bajamar": { lat: 28.5333, lng: -16.3167 },
  "Taganana": { lat: 28.5333, lng: -16.2667 },
  "Punta Del Hidalgo": { lat: 28.5500, lng: -16.2833 },
  "Las Mercedes": { lat: 28.5000, lng: -16.2833 },
  "Plaza El Cristo": { lat: 28.4650, lng: -16.3150 },
  "Plaza Tranvia": { lat: 28.4580, lng: -16.3160 },
  "San Diego": { lat: 28.4700, lng: -16.3400 },
  "Geneto": { lat: 28.4550, lng: -16.3450 },
  "La Candelaria": { lat: 28.4600, lng: -16.3500 },
  "El Ortigal": { lat: 28.4750, lng: -16.3300 },
  "El Boquerón": { lat: 28.4800, lng: -16.3400 },
  "Guamasa": { lat: 28.4600, lng: -16.3400 },
  "La Verdellada": { lat: 28.4500, lng: -16.3500 },
  "Los Rodeos": { lat: 28.4800, lng: -16.3400 },
  "El Carrizal": { lat: 28.4750, lng: -16.3500 },

  // SANTA CRUZ DE TENERIFE
  "Plaza Principe": { lat: 28.4698, lng: -16.2530 },
  "Plaza De La Candelaria": { lat: 28.4685, lng: -16.2515 },
  "Plaza de España": { lat: 28.4682, lng: -16.2546 },
  "Avenida Francisco La Roche": { lat: 28.4700, lng: -16.2550 },
  "Igueste De San Andrés": { lat: 28.4833, lng: -16.1833 },
  "San Andrés": { lat: 28.4833, lng: -16.2000 },
  "Radazul": { lat: 28.4667, lng: -16.2167 },
  "Taco": { lat: 28.4667, lng: -16.2833 },
  "Ofra": { lat: 28.4500, lng: -16.2667 },
  "La Salud": { lat: 28.4600, lng: -16.2600 },
  "Salamana": { lat: 28.4650, lng: -16.2700 },
  "El Toscal": { lat: 28.4750, lng: -16.2500 },
  "La Salle": { lat: 28.4700, lng: -16.2500 },
  "Plaza Weyler": { lat: 28.4680, lng: -16.2520 },
  "Plaza del Príncipe": { lat: 28.4698, lng: -16.2530 },
  "Añaza": { lat: 28.4400, lng: -16.2300 },
  "Barranco Hondo": { lat: 28.4500, lng: -16.2800 },
  "Cueva De Las Palomas": { lat: 28.4600, lng: -16.2700 },
  "Santos": { lat: 28.4700, lng: -16.2600 },
  "Vistabella": { lat: 28.4600, lng: -16.2500 },
  "Chamberí": { lat: 28.4700, lng: -16.2550 },
  "Cabo Llanos": { lat: 28.4600, lng: -16.2400 },
  "La Glorieta": { lat: 28.4650, lng: -16.2450 },

  // ARONA
  "Cabo Blanco": { lat: 28.0500, lng: -16.6833 },
  "Cristianos": { lat: 28.0667, lng: -16.7167 },
  "Galletas": { lat: 28.0500, lng: -16.6667 },
  "Las Galletas": { lat: 28.0500, lng: -16.6667 },
  "Los Cristianos": { lat: 28.0500, lng: -16.7167 },
  "Playa De Las Americas": { lat: 28.0600, lng: -16.7300 },
  "Costa Adeje": { lat: 28.0700, lng: -16.7300 },
  "Valle San Lorenzo": { lat: 28.0833, lng: -16.6833 },
  "Buzanada": { lat: 28.0667, lng: -16.6667 },
  "El Fraile": { lat: 28.0600, lng: -16.6800 },
  "Polideportivo Las Chafiras": { lat: 28.0833, lng: -16.6500 },
  "Las Chafiras": { lat: 28.0833, lng: -16.6500 },

  // GRANADILLA DE ABONA
  "Abrigos": { lat: 28.0833, lng: -16.5500 },
  "Medano": { lat: 28.0667, lng: -16.5333 },
  "El Medano": { lat: 28.0667, lng: -16.5333 },
  "San Isidro": { lat: 28.0833, lng: -16.5500 },
  "Charco Del Pino": { lat: 28.1000, lng: -16.5333 },
  "Los Abrigos": { lat: 28.0833, lng: -16.5500 },

  // SANTIAGO DEL TEIDE
  "Puerto Santiago": { lat: 28.2667, lng: -16.8500 },
  "Masca": { lat: 28.3167, lng: -16.8333 },
  "Tamaimo": { lat: 28.2833, lng: -16.8167 },
  "Gigantes": { lat: 28.2667, lng: -16.8500 },
  "Los Gigantes": { lat: 28.2667, lng: -16.8500 },
  "Playa De La Arena": { lat: 28.2667, lng: -16.8333 },
  "Acamán": { lat: 28.2800, lng: -16.8200 },
  "El Molledo": { lat: 28.2700, lng: -16.8400 },

  // GUÍA DE ISORA
  "Alcalá": { lat: 28.2167, lng: -16.8167 },
  "Chío": { lat: 28.2000, lng: -16.7667 },
  "Playa San Juan": { lat: 28.2167, lng: -16.8000 },
  "Alcalá Playa": { lat: 28.2167, lng: -16.8167 },

  // CANDELARIA
  "Cuevecitas": { lat: 28.3500, lng: -16.3667 },
  "Igueste": { lat: 28.3833, lng: -16.3333 },
  "Barranco Hondo Candelaria": { lat: 28.3600, lng: -16.3700 },
  "Chacorche": { lat: 28.3833, lng: -16.3167 },
  "Punta Larga": { lat: 28.3667, lng: -16.3500 },
  "Las Caletas": { lat: 28.3500, lng: -16.3500 },

  // LA OROTAVA
  "Plaza De La Constitución": { lat: 28.3850, lng: -16.5200 },
  "Plaza Del Ayuntamiento": { lat: 28.3850, lng: -16.5200 },
  "La Florida": { lat: 28.3900, lng: -16.5300 },
  "El Pinillo": { lat: 28.4000, lng: -16.5400 },
  "Martín": { lat: 28.3900, lng: -16.5100 },
  "La Perdoma": { lat: 28.3900, lng: -16.5000 },
  "El Calvario": { lat: 28.3800, lng: -16.5200 },

  // LOS REALEJOS
  "Arguayo": { lat: 28.3500, lng: -16.6167 },
  "Realejo Alto": { lat: 28.3700, lng: -16.6400 },
  "Realejo Bajo": { lat: 28.3650, lng: -16.6300 },
  "San Agustín": { lat: 28.3600, lng: -16.6200 },
  "El Mocanal": { lat: 28.3700, lng: -16.6100 },

  // TACORONTE
  "Guayonje": { lat: 28.4600, lng: -16.4100 },
  "El Socorro": { lat: 28.4800, lng: -16.4300 },

  // GARACHICO
  "Caleta De Interian": { lat: 28.3667, lng: -16.7833 },
  "El Guincho": { lat: 28.3600, lng: -16.7600 },

  // ICOD DE LOS VINOS
  "Plaza Andrés": { lat: 28.3670, lng: -16.6999 },
  "Icod El Alto": { lat: 28.3500, lng: -16.6833 },
  "San Marcos": { lat: 28.3833, lng: -16.7167 },
  "El Amparo": { lat: 28.3600, lng: -16.6800 },

  // ADEJE
  "Armeñime": { lat: 28.1167, lng: -16.7667 },
  "La Caleta": { lat: 28.0700, lng: -16.7300 },
  "Tejina Adeje": { lat: 28.1300, lng: -16.7500 },
  "El Duque": { lat: 28.0700, lng: -16.7400 },
  "Torviscas": { lat: 28.0750, lng: -16.7350 },
  "Fañabé": { lat: 28.0650, lng: -16.7300 },

  // SAN MIGUEL DE ABONA
  "Guargacho": { lat: 28.0833, lng: -16.6167 },
  "Amarilla Golf": { lat: 28.0500, lng: -16.6000 },
  "El Roque": { lat: 28.0700, lng: -16.6200 },

  // TEGUESTE
  "Plaza San Marcos": { lat: 28.5167, lng: -16.3333 },
  "Tegueste Bajo": { lat: 28.5100, lng: -16.3300 },

  // EL TANQUE
  "Plaza Cristo Del Calvario": { lat: 28.3333, lng: -16.7833 },
  "Ruiz": { lat: 28.3300, lng: -16.7900 },

  // BUENAVISTA DEL NORTE
  "Campanario": { lat: 28.3400, lng: -16.8700 },

  // LOS SILOS
  "Los Silos": { lat: 28.3662, lng: -16.8164 },

  // GÜÍMAR
  "Chacona": { lat: 28.2667, lng: -16.3833 },
  "La Esperanza": { lat: 28.2800, lng: -16.4000 },

  // EL ROSARIO
  "Bailadores": { lat: 28.4550, lng: -16.2100 },

  // LA GUANCHA
  "Santa Catalina": { lat: 28.3800, lng: -16.6600 },

  // PLAZAS Y LUGARES ESPECÍFICOS
  "Plaza": { lat: 28.4682, lng: -16.2546 },
  "Casco": { lat: 28.4682, lng: -16.2546 },
  "Centro": { lat: 28.4682, lng: -16.2546 },
  "Mercado": { lat: 28.4167, lng: -16.5500 },
  "Sala Capri": { lat: 28.4833, lng: -16.1833 },
  "Pabellón": { lat: 28.4682, lng: -16.2546 },
  "Calle Frangollo": { lat: 28.4682, lng: -16.2546 },
  "Calle El Medio": { lat: 28.4682, lng: -16.2546 },
  "Calle Dr. González": { lat: 28.4682, lng: -16.2546 },
};

function normalizarTexto(texto: string): string {
  return texto.toLowerCase()
    .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
    .replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ü/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function buscarLugar(lugar: string): Coordinates | null {
  const norm = normalizarTexto(lugar);
  if (norm.length < 3) return null;

  for (const [key, coords] of Object.entries(lugarCoordinates)) {
    if (normalizarTexto(key) === norm) {
      return coords;
    }
  }

  return null;
}

export async function geocodeAddress(address: string, token?: string): Promise<Coordinates | null> {
  const parts = address.split(',').map(p => p.trim());
  let lugar = parts[0];
  let municipio = parts[1] || '';

  const esMunicipio = Object.keys(municipioCoordinates).some(key =>
    lugar.toLowerCase().includes(key.toLowerCase())
  );
  if (esMunicipio) {
    municipio = lugar;
    lugar = '';
  }

  if (lugar) {
    const lugarCoords = buscarLugar(lugar);
    if (lugarCoords) return lugarCoords;
  }

  if (lugar && municipio) {
    const API_BASE_URL = import.meta.env.VITE_VERCEL_API_URL || 'https://de-belingo-con-angel-debelingoconangels-projects.vercel.app';
    const query = `${lugar}, ${municipio}`;
    const proxyUrl = `${API_BASE_URL}/api/geocoding?q=${encodeURIComponent(query)}`;

    try {
      const headers = await getSecurityHeaders(token);
      const response = await fetch(proxyUrl, { headers });
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      const data = await response.json();
      if (data && data.length > 0) {
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch (error) {
      console.error("Error en geocodificación:", error);
    }
  }

  if (municipio) {
    for (const [key, coords] of Object.entries(municipioCoordinates)) {
      if (municipio.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(municipio.toLowerCase())) {
        return coords;
      }
    }
  }

  return null;
}


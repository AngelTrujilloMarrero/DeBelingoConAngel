import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
// CORRECCIÓN: Se renombra el icono 'Map' a 'MapIcon' para evitar conflictos con el objeto nativo Map de JS.
import { Map as MapIcon, Navigation, AlertCircle, MapPin, Calendar, Clock, Search, Sparkles, Wand2, Loader2, Brain, Cpu } from 'lucide-react';
import { Event } from '../types';
import { geocodeAddress, municipioMapping, normalizarMunicipio } from '../utils/geocoding';
import { checkLocalRateLimit, checkGlobalRateLimit } from '../utils/rateLimit';
import { useTurnstile } from './TurnstileProvider';
import 'leaflet/dist/leaflet.css';

interface MapComponentProps {
  events: Event[];
}

const MapComponent: React.FC<MapComponentProps> = ({ events }) => {
  const { token, resetToken } = useTurnstile();
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Estados para la IA de Belingo
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  // Filter events for map display
  // Modified logic: "con 3 horas máxima pasadas el evento"
  const mapEvents = React.useMemo(() => {
    const now = new Date();
    // 3 hours ago from now
    const cutOffTime = new Date(now.getTime() - 3 * 60 * 60 * 1000);

    return events.filter(event => {
      if (event.cancelado) return false;

      const eventDateTime = new Date(`${event.day}T${event.hora}`);
      // Valid if the event's start time is AFTER (now - 3 hours)
      // i.e. it hasn't "passed" by more than 3 hours (assuming start time is reference)
      return eventDateTime >= cutOffTime;
    });
  }, [events]);

  const handleUserLocationSearch = async () => {
    if (!userLocation.trim()) return;

    if (!token) {
      alert("Por favor, espera a que se valide el captcha de seguridad.");
      return;
    }

    // Límite local: 1 consulta por segundo
    if (!checkLocalRateLimit('map_query_local', 1, 1000)) {
      alert("Por favor, espera un segundo entre consultas.");
      return;
    }

    // Límite global: 39 consultas al día (86400000 ms)
    const isGlobalAllowed = await checkGlobalRateLimit('mapUsage', 39, 24 * 60 * 60 * 1000);
    if (!isGlobalAllowed) {
      alert("Se ha alcanzado el límite global de consultas del mapa por hoy (máximo 39). Inténtalo de nuevo mañana.");
      return;
    }

    setIsSearching(true);
    try {
      // Add Tenerife to context to prioritize local results
      const searchAddress = `${userLocation}, Tenerife, España`;
      const coords = await geocodeAddress(searchAddress, token);
      resetToken(); // Reset after use for security

      if (coords && mapInstanceRef.current) {
        mapInstanceRef.current.setView([coords.lat, coords.lng], 13);

        L.marker([coords.lat, coords.lng], {
          icon: new L.Icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          })
        })
          .bindPopup("📍 Ubicación seleccionada")
          .addTo(mapInstanceRef.current)
          .openPopup();
      }
    } catch (error) {
      console.error("Error finding user location:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAiAnalysis = async () => {
    if (!userLocation.trim()) return;

    if (!token) {
      alert("Por favor, espera a que se valide el captcha de seguridad.");
      return;
    }

    // Límite local: 1 consulta por segundo
    if (!checkLocalRateLimit('map_query_local', 1, 1000)) {
      alert("Por favor, espera un segundo entre consultas.");
      return;
    }

    // Límite global: 39 consultas al día (86400000 ms)
    const isGlobalAllowed = await checkGlobalRateLimit('mapUsage', 39, 24 * 60 * 60 * 1000);
    if (!isGlobalAllowed) {
      alert("Se ha alcanzado el límite global de consultas de Ángel IA por hoy (máximo 39). Inténtalo de nuevo mañana.");
      return;
    }

    setIsAiLoading(true);
    setAiMessage(null);

    try {
      const now = new Date();
      const cutOffTime = new Date(now.getTime() - 3 * 60 * 60 * 1000); // 3h margin

      const upcomingEvents = events
        .filter(e => {
          if (e.cancelado) return false;
          const eventDateTime = new Date(`${e.day}T${e.hora}`);
          return eventDateTime >= cutOffTime;
        })
        .sort((a, b) => new Date(`${a.day}T${a.hora}`).getTime() - new Date(`${b.day}T${b.hora}`).getTime())
        .slice(0, 8);

      // Usar URL absoluta de Vercel para evitar errores de JSON (SyntaxError <)
      const API_BASE_URL = import.meta.env.VITE_VERCEL_API_URL || 'https://de-belingo-con-angel.vercel.app';
      const prompt = `Usuario en: "${userLocation}".
      
      Listado de Verbenas:
      ${upcomingEvents.length > 0
          ? upcomingEvents.map(e => `- ${e.day} a las ${e.hora}: ${e.orquesta} en ${e.municipio} (${e.lugar})`).join('\n')
          : "No hay verbenas próximas."}
      
      Instrucción: Basándote SOLO en este listado, indica al usuario cuáles son las más próximas en tiempo y cuáles le quedan más cerca de "${userLocation}". Sé breve, concreto y ve al grano.`;

      const { getSecurityHeaders } = await import('../utils/firebase');
      const headers = await getSecurityHeaders(token);

      const response = await fetch(`${API_BASE_URL}/api/ai`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ prompt })
      });

      const finalData = await response.json();
      resetToken(); // Reset after use

      if (response.ok && finalData.response) {
        setAiMessage(finalData.response);
      } else {
        const errorMsg = finalData.error || "Se me trabó el magua";
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      console.error("Error calling AI API detailed:", err);
      const errorMessage = err?.message || "Error desconocido";
      setAiMessage(`¡Ñoos! ${errorMessage}. ¡Inténtalo de nuevo, puntal!`);
    } finally {
      setIsAiLoading(false);
    }
  };

  useEffect(() => {
    if (mapRef.current && !mapInstanceRef.current) {
      // Initialize map
      const tenerifeCenter: [number, number] = [28.291563, -16.629126];
      const tenerifeBounds: L.LatLngBoundsExpression = [
        [28.025, -16.925], // Southwest
        [28.625, -16.075]  // Northeast
      ];

      const map = L.map(mapRef.current, {
        center: tenerifeCenter,
        zoom: window.innerWidth < 768 ? 9.2 : 9.7,
        minZoom: window.innerWidth < 768 ? 9.2 : 9.7,
        maxZoom: 18,
        maxBounds: tenerifeBounds,
        maxBoundsViscosity: 1.0,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);

      mapInstanceRef.current = map;

      // Función para obtener icono según zona del evento
      const getMarkerIcon = (municipio: string) => {
        const colorMap: Record<string, string> = {
          'Santa Cruz de Tenerife': 'red',
          'San Cristóbal de La Laguna': 'blue',
          'Adeje': 'green',
          'Arona': 'yellow',
          'Granadilla de Abona': 'violet',
          'Puerto de la Cruz': 'orange',
          'La Orotava': 'grey',
          'Los Realejos': 'black',
          'Candelaria': 'gold',
          'Güímar': 'red'
        };

        const municipioNorm = normalizarMunicipio(municipio);
        const color = colorMap[municipioNorm] || 'red';

        return new L.Icon({
          iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [40, 66],
          iconAnchor: [20, 66],
          popupAnchor: [1, -34],
          shadowSize: [66, 66]
        });
      };

      // Función para obtener emoji según tipo de evento
      const getEventEmoji = (event: Event) => {
        if (event.tipo === 'Baile Infantil') return '👶';
        if (event.tipo === 'Orquesta') return '🎵';
        if (event.tipo === 'DJ') return '🎧';
        return '🎉';
      };

      // Load markers
      // Load markers
      // Load markers
      const loadMarkers = async () => {
        // CORRECCIÓN: Geocoding ya no requiere token de Turnstile para evitar race conditions
        // if (!token) return;

        setIsLoading(true);

        // CORRECCIÓN: Al renombrar el icono, 'new Map()' ahora se refiere correctamente al objeto nativo de JS.
        const eventsByAddress = new Map<string, Event[]>();
        for (const event of mapEvents) {
          const fullMunicipioName = municipioMapping[event.municipio] || event.municipio;
          const address = event.lugar
            ? `${event.lugar}, ${fullMunicipioName}, Tenerife, España`
            : `${fullMunicipioName}, Tenerife, España`;

          if (!eventsByAddress.has(address)) {
            eventsByAddress.set(address, []);
          }
          eventsByAddress.get(address)!.push(event);
        }

        const addresses = Array.from(eventsByAddress.keys());
        for (let i = 0; i < addresses.length; i++) {
          const address = addresses[i]; // Esto ahora se inferirá correctamente como 'string'
          const eventsAtLocation = eventsByAddress.get(address)!;

          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          try {
            // Pass token to geocodeAddress
            const coordinates = await geocodeAddress(address);

            if (coordinates && mapInstanceRef.current) {
              eventsAtLocation.sort((a, b) => {
                const dateA = new Date(`${a.day}T${a.hora}`);
                const dateB = new Date(`${b.day}T${b.hora}`);
                return dateA.getTime() - dateB.getTime();
              });

              const locationName = eventsAtLocation[0].lugar || municipioMapping[eventsAtLocation[0].municipio] || eventsAtLocation[0].municipio;
              const googleMapsLink = `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`;
              const transitLink = `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}&travelmode=transit`;

              let popupContent = `
                <div style="padding: 8px; min-width: 280px; max-height: 350px; overflow-y: auto;">
                  <div style="font-weight: bold; font-size: 18px; color: #1e40af; text-align: center; border-bottom: 2px solid #ccc; padding-bottom: 8px; margin-bottom: 8px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 4px;">
                    📍 ${locationName}
                  </div>`;

              eventsAtLocation.forEach(event => {
                const eventDay = new Date(event.day).toLocaleDateString('es-ES', { weekday: 'long' });
                const eventEmoji = getEventEmoji(event);
                const tipoColor = event.tipo === 'Baile Infantil' ? '#10b981' :
                  event.tipo === 'DJ' ? '#8b5cf6' : '#3b82f6';

                popupContent += `
                  <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 8px; background: #f9fafb; border-radius: 4px; padding: 8px;">
                    <div style="font-weight: bold; font-size: 1.1em; color: ${tipoColor}; margin-bottom: 4px;">${eventEmoji} ${event.orquesta}</div>
                    <div><strong>📅 Fecha:</strong> ${event.day} (${eventDay})</div>
                    <div><strong>🕐 Hora:</strong> ${event.hora}</div>
                    ${event.tipo !== 'Baile Normal' ? `<div style="background: ${tipoColor}20; color: ${tipoColor}; padding: 2px 6px; border-radius: 4px; display: inline-block; font-size: 0.85em; margin-top: 4px;">${event.tipo}</div>` : ''}
                  </div>
                `;
              });

              popupContent += `
                  <div style="text-align: center; margin-top: 8px; display: flex; flex-direction: column; gap: 8px; justify-content: center;">
                    <a href="${googleMapsLink}" target="_blank" rel="noopener noreferrer" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 10px 16px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: flex; items-center; justify-content: center; gap: 8px;">
                      🧭 Cómo llegar
                    </a>
                    <a href="${transitLink}" target="_blank" rel="noopener noreferrer" style="background: linear-gradient(135deg, #00a54e 0%, #00823d 100%); color: white; padding: 8px 16px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 40px;">
                      <img src="https://movil.titsa.com/images/logo-titsa.png" alt="TITSA" style="height: 18px; width: auto; brightness: 1.5; filter: contrast(1.2);">
                    </a>
                  </div>
                </div>
              `;

              const markerIcon = getMarkerIcon(eventsAtLocation[0].municipio);
              const marker = L.marker([coordinates.lat, coordinates.lng], { icon: markerIcon })
                .bindPopup(popupContent);

              marker.addTo(mapInstanceRef.current);
            }
          } catch (error) {
            console.error('Error geocoding address:', address, error);
          }

          setLoadingProgress(((i + 1) / addresses.length) * 100);
        }

        setIsLoading(false);
        // Burn the token after use in batch geocoding to prevent reuse errors
        // resetToken(); // Ya no es necesario resetear porque no consumimos el token
      };

      if (mapEvents.length > 0) {
        loadMarkers();
      } else {
        setIsLoading(false);
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [events, token]);

  return (
    <div className="space-y-4">
      {/* Search & AI Block */}
      <div className="bg-gray-900 border-4 border-black p-6 rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <label className="text-white font-black flex items-center gap-2 text-xl uppercase tracking-tighter">
            <MapPin className="w-6 h-6 text-yellow-400" />
            ¿Donde te encuentras?
          </label>
          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
            <input
              type="text"
              placeholder="Tu municipio (ej: Arafo)..."
              value={userLocation}
              onChange={(e) => {
                setUserLocation(e.target.value);
                if (!e.target.value) setAiMessage(null);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleUserLocationSearch()}
              className="w-full md:w-64 px-4 py-3 rounded-xl bg-gray-800 text-white border-2 border-yellow-400/50 focus:outline-none focus:border-yellow-400 font-bold placeholder-gray-500 transition-all"
            />
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleUserLocationSearch}
                disabled={isSearching}
                className="flex-1 sm:flex-initial justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-black transition-all transform active:scale-95 flex items-center gap-2 disabled:opacity-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                BUSCAR
              </button>
              <button
                onClick={handleAiAnalysis}
                disabled={isAiLoading || !userLocation.trim()}
                className="flex-1 sm:flex-initial justify-center bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-3 rounded-xl font-black transition-all transform active:scale-95 flex items-center gap-2 disabled:opacity-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                {isAiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
                ÁNGEL IA
              </button>
            </div>
          </div>
        </div>

        {/* AI Response Integrated */}
        {aiMessage && (
          <div className="animate-fadeInUp bg-yellow-400 border-4 border-black p-5 rounded-xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative group">
            <div className="flex items-start gap-4">
              <div className="bg-black p-3 rounded-lg flex-shrink-0 rotate-2 group-hover:rotate-0 transition-transform">
                <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-black font-black text-lg uppercase tracking-tighter flex items-center gap-2">
                    <Wand2 className="w-4 h-4" />
                    CONSEJO DE ÁNGEL (IA)
                  </h4>
                  <button
                    onClick={() => setAiMessage(null)}
                    className="bg-black text-white w-6 h-6 rounded-full flex items-center justify-center font-bold hover:scale-110 transition-transform"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-black text-lg font-black leading-snug italic whitespace-pre-wrap overflow-y-auto max-h-[500px] pr-2 scrollbar-thin scrollbar-thumb-black/20">
                  "{aiMessage}"
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg text-center font-bold shadow-lg">
        <div className="flex items-center justify-center gap-2">
          {/* CORRECCIÓN: Usar el componente renombrado 'MapIcon' */}
          <MapIcon className="w-6 h-6" />
          <span className="text-lg">UBICACIÓN APROXIMADA DE LAS VERBENAS</span>
          <Navigation className="w-6 h-6" />
        </div>
      </div>

      {isLoading && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-lg">
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 font-bold">
              <AlertCircle className="w-5 h-5 animate-spin" />
              <span>Cargando verbenas en el mapa...</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${loadingProgress}%` }}
              >
                <div className="h-full bg-gradient-to-r from-white/30 to-transparent animate-pulse"></div>
              </div>
            </div>
            <div className="text-center text-sm">
              {Math.round(loadingProgress)}% - {isLoading ? 'Cargando verbenas...' : 'VERBENAS CARGADAS EN EL MAPA'}
            </div>
          </div>
        </div>
      )}

      <div className="relative z-0 rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10">
        <div
          ref={mapRef}
          style={{ height: '500px', width: '100%' }}
          className="leaflet-container"
        />
      </div>
    </div>
  );
};

export default MapComponent;

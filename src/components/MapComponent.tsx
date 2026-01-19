import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
// CORRECCIÓN: Se renombra el icono 'Map' a 'MapIcon' para evitar conflictos con el objeto nativo Map de JS.
import { Map as MapIcon, Navigation, AlertCircle, MapPin, Calendar, Clock, Search } from 'lucide-react';
import { Event } from '../types';
import { geocodeAddress, municipioMapping, normalizarMunicipio } from '../utils/geocoding';
import 'leaflet/dist/leaflet.css';

interface MapComponentProps {
  events: Event[];
}

const MapComponent: React.FC<MapComponentProps> = ({ events }) => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [userLocation, setUserLocation] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

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
    setIsSearching(true);
    try {
      // Add Tenerife to context to prioritize local results
      const searchAddress = `${userLocation}, Tenerife, España`;
      const coords = await geocodeAddress(searchAddress);

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
      const loadMarkers = async () => {
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
            // CORRECCIÓN: 'address' ya es de tipo 'string', por lo que no hay error de tipado.
            const coordinates = await geocodeAddress(address);

            if (coordinates && mapInstanceRef.current) {
              eventsAtLocation.sort((a, b) => {
                const dateA = new Date(`${a.day}T${a.hora}`);
                const dateB = new Date(`${b.day}T${b.hora}`);
                return dateA.getTime() - dateB.getTime();
              });

              const locationName = eventsAtLocation[0].lugar || municipioMapping[eventsAtLocation[0].municipio] || eventsAtLocation[0].municipio;
              const googleMapsLink = `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`;

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
                  <div style="text-align: center; margin-top: 8px; display: flex; gap: 8px; justify-content: center;">
                    <a href="${googleMapsLink}" target="_blank" rel="noopener noreferrer" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                      🧭 Cómo llegar
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
  }, [events]);

  return (
    <div className="space-y-4">
      {/* Search Block */}
      <div className="bg-gray-900/80 p-4 rounded-lg flex flex-col md:flex-row gap-4 items-center justify-between border border-white/10 backdrop-blur-sm shadow-md">
        <label className="text-white font-bold flex items-center gap-2 text-lg">
          <MapPin className="w-5 h-5 text-yellow-400" />
          ¿Donde te encuentras?
        </label>
        <div className="flex w-full md:w-auto gap-2">
          <input
            type="text"
            placeholder="Tu ubicación (ej: Santa Cruz)..."
            value={userLocation}
            onChange={(e) => setUserLocation(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUserLocationSearch()}
            className="w-full md:w-64 px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:border-blue-500 placeholder-gray-500"
          />
          <button
            onClick={handleUserLocationSearch}
            disabled={isSearching}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isSearching ? <AlertCircle className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Buscar
          </button>
        </div>
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

import React, { useState, useEffect, useMemo } from 'react';
import { Navigation, Clock, MapPin, Bus, ExternalLink, Phone, Star } from 'lucide-react';
import { geocodeAddress, normalizarMunicipio } from '../utils/geocoding';
import { Event } from '../types';
import TITSALogo from './TITSALogo';

interface NearbyEventsProps {
  events: Event[];
  userLocation: string;
}

interface TaxiData {
  municipios: Record<string, {
    empresas: Array<{
      nombre: string;
      telefono: string;
      web?: string;
      centralita?: string;
    }>;
    alternativas: Array<{
      nombre: string;
      disponible: boolean;
      web?: string;
      app?: string;
    }>;
  }>;
}

const NearbyEvents: React.FC<NearbyEventsProps> = ({ events, userLocation }) => {
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [taxiData, setTaxiData] = useState<TaxiData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Calcular eventos próximos (dentro de las próximas 24 horas)
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return events
      .filter(event => {
        if (event.cancelado) return false;
        const eventDateTime = new Date(`${event.day}T${event.hora}`);
        return eventDateTime >= now && eventDateTime <= tomorrow;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.day}T${a.hora}`);
        const dateB = new Date(`${b.day}T${b.hora}`);
        return dateA.getTime() - dateB.getTime();
      });
  }, [events]);

  // Geocodificar ubicación del usuario
  useEffect(() => {
    const geocodeUserLocation = async () => {
      if (!userLocation.trim()) return;

      setLoading(true);
      setError(null);

      try {
        const searchAddress = `${userLocation}, Tenerife, España`;
        const coords = await geocodeAddress(searchAddress);
        if (coords) {
          setUserCoords(coords);
        } else {
          setError('No se pudo encontrar tu ubicación. Intenta con otro término de búsqueda.');
        }
      } catch (err) {
        setError('Error al buscar tu ubicación. Por favor, inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    geocodeUserLocation();
  }, [userLocation]);

  // Cargar datos de taxis
  useEffect(() => {
    const loadTaxiData = async () => {
      try {
        const response = await fetch('/data/taxis-tenerife.json');
        const data = await response.json();
        setTaxiData(data);
      } catch (err) {
        console.error('Error loading taxi data:', err);
      }
    };

    loadTaxiData();
  }, []);

  // Calcular distancia y ordenar eventos por proximidad
  const nearbyEventsSorted = useMemo(() => {
    if (!userCoords) return upcomingEvents;

    return upcomingEvents
      .map(event => {
        // Usar coordenadas aproximadas por municipio
        const municipalityCoords: Record<string, { lat: number; lng: number }> = {
          'Santa Cruz de Tenerife': { lat: 28.2916, lng: -16.6291 },
          'San Cristóbal de La Laguna': { lat: 28.4887, lng: -16.3159 },
          'Adeje': { lat: 28.1208, lng: -16.7328 },
          'Arona': { lat: 28.1045, lng: -16.6897 },
          'Granadilla de Abona': { lat: 28.0814, lng: -16.5678 },
          'Puerto de la Cruz': { lat: 28.4149, lng: -16.5534 },
          'La Orotava': { lat: 28.3902, lng: -16.5215 },
          'Los Realejos': { lat: 28.4012, lng: -16.5678 },
          'Candelaria': { lat: 28.3516, lng: -16.3637 },
          'Güímar': { lat: 28.3181, lng: -16.4163 },
        };

        const municipioNorm = normalizarMunicipio(event.municipio);
        const eventCoords = municipalityCoords[municipioNorm] || userCoords;

        // Calcular distancia simple (aproximada)
        const distance = Math.sqrt(
          Math.pow(eventCoords.lat - userCoords.lat, 2) +
          Math.pow(eventCoords.lng - userCoords.lng, 2)
        );

        return { ...event, distance };
      })
      .sort((a, b) => (a as any).distance - (b as any).distance)
      .slice(0, 5); // Solo los 5 más cercanos
  }, [upcomingEvents, userCoords]);

  // Generar enlace de transporte público
  const generateTransportRoute = (event: Event) => {
    if (!userCoords) return null;

    const destination = encodeURIComponent(`${event.lugar || event.municipio}, ${event.municipio}`);
    return `https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${destination}&travelmode=transit`;
  };

  const generateDirectionsLink = (event: Event) => {
    if (!userCoords) return null;

    const destination = encodeURIComponent(`${event.lugar || event.municipio}, ${event.municipio}`);
    return `https://www.google.com/maps/dir/?api=1&origin=${userCoords.lat},${userCoords.lng}&destination=${destination}&travelmode=driving`;
  };

  const getTaxiInfo = (municipio: string) => {
    if (!taxiData) return null;
    return taxiData.municipios[municipio] || null;
  };

  if (loading) {
    return (
      <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-lg">
        <div className="flex items-center justify-center gap-3 text-blue-300">
          <Navigation className="w-5 h-5 animate-spin" />
          <span className="text-sm">Buscando verbenas cercanas...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-lg">
        <div className="flex items-center gap-3 text-red-300">
          <MapPin className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  if (!userLocation.trim()) {
    return (
      <div className="bg-gray-500/10 border border-gray-500/20 p-6 rounded-lg">
        <div className="flex items-center gap-3 text-gray-300">
          <MapPin className="w-5 h-5" />
          <span className="text-sm">Introduce tu ubicación para ver verbenas cercanas</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 p-4 rounded-lg">
        <div className="flex items-center gap-2 text-green-300 font-semibold text-sm uppercase tracking-wide mb-4">
          <Navigation className="w-4 h-4" />
          Verbenas cercanas a tu ubicación
        </div>

        {nearbyEventsSorted.length === 0 ? (
          <div className="text-gray-300 text-sm text-center py-4">
            No hay verbenas programadas en las próximas 24 horas cerca de tu ubicación.
          </div>
        ) : (
          <div className="space-y-3">
            {nearbyEventsSorted.map((event: any, index: number) => {
              const taxiInfo = getTaxiInfo(event.municipio);
              const transportRoute = generateTransportRoute(event);
              const directionsLink = generateDirectionsLink(event);

              return (
                <div key={event.id} className="bg-gray-800/80 p-3 rounded border border-gray-700/70 shadow-lg">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span className="font-medium text-white">{event.orquesta}</span>
                        <span className="text-xs text-gray-400">#{index + 1}</span>
                      </div>
                      <div className="text-sm text-gray-300">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {event.lugar || event.municipio}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(`${event.day}T${event.hora}`).toLocaleDateString('es-ES', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short'
                          })} - {event.hora}H
                        </div>
                        {event.distance !== undefined && (
                          <div className="text-xs text-gray-400">
                            Distancia aproximada: {(event.distance * 111).toFixed(1)} km
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {/* Transporte público */}
                    {transportRoute && (
                      <a
                        href={transportRoute}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-1 bg-green-600/30 hover:bg-green-600/40 text-green-200 rounded text-xs border border-green-600/50 hover:border-green-500/60 transition-all duration-300"
                        title="Cómo llegar en transporte público"
                      >
                        <TITSALogo />
                      </a>
                    )}

                    {/* Coche */}
                    {directionsLink && (
                      <a
                        href={directionsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2 py-1 bg-blue-600/30 hover:bg-blue-600/40 text-blue-200 rounded text-xs border border-blue-600/50 hover:border-blue-500/60 transition-all duration-300"
                        title="Cómo llegar en coche"
                      >
                        <Navigation className="w-3 h-3" />
                        Coche
                      </a>
                    )}

                    {/* Taxis */}
                    {taxiInfo && (
                      <button
                        onClick={() => setSelectedEvent(event)}
                        className="flex items-center gap-1 px-2 py-1 bg-yellow-600/30 hover:bg-yellow-600/40 text-yellow-200 rounded text-xs border border-yellow-600/50 hover:border-yellow-500/60 transition-all duration-300"
                        title="Ver opciones de taxi"
                      >
                        <Phone className="w-3 h-3" />
                        Taxi
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de información de taxi */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Phone className="w-5 h-5 text-yellow-400" />
                  Taxis en {selectedEvent.municipio}
                </h3>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              {(() => {
                const taxiInfo = getTaxiInfo(selectedEvent.municipio);
                if (!taxiInfo) return <div className="text-gray-300">No hay información de taxis disponible.</div>;

                return (
                  <div className="space-y-4">
                    {/* Empresas de taxi */}
                    <div>
                      <h4 className="font-semibold text-white mb-2">Empresas de Taxi:</h4>
                      <div className="space-y-2">
                        {taxiInfo.empresas.map((empresa, idx) => (
                          <div key={idx} className="bg-gray-700/50 p-3 rounded">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-white">{empresa.nombre}</span>
                              <a
                                href={`tel:${empresa.telefono}`}
                                className="text-green-400 hover:text-green-300"
                              >
                                {empresa.telefono}
                              </a>
                            </div>
                            {empresa.centralita && (
                              <div className="text-xs text-gray-400">
                                Centralita: {empresa.centralita}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Alternativas */}
                    <div>
                      <h4 className="font-semibold text-white mb-2">Alternativas:</h4>
                      <div className="space-y-2">
                        {taxiInfo.alternativas.filter(alt => alt.disponible).map((alt, idx) => (
                          <div key={idx} className="bg-gray-700/50 p-3 rounded flex items-center justify-between">
                            <span className="font-medium text-white">{alt.nombre}</span>
                            <div className="flex gap-2">
                              {alt.app && (
                                <span className="text-xs text-gray-400">{alt.app}</span>
                              )}
                              {alt.web && (
                                <a
                                  href={alt.web}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NearbyEvents;
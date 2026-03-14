import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, Clock, MapPin, Music2, Download, Navigation, Plus, Edit, Trash2, Info, ExternalLink, ChevronDown, Facebook, Instagram, Globe, Phone, Bus, RotateCcw } from 'lucide-react';
import { onValue, orchestrasRef } from '../utils/firebase';
import { orchestraDetails } from '../data/orchestras';
import { getCachedOrchestraArchive } from '../utils/dataLoaders';
import { Event, RecentActivityItem } from '../types';

let orchestraArchive: any[] = [];
let archiveMap: Record<string, any> = {};
import { groupEventsByDay, sortEventsByDateTime, formatDayName, getLastUpdateDate } from '../utils/helpers';
import WeatherIcon from './WeatherIcon';
import TITSALogo from './TITSALogo';
import { useAemetAlerts, AemetAlert } from '../hooks/useAemetAlerts';

interface EventsListProps {
  events: Event[];
  recentActivity?: RecentActivityItem[];
  onExportWeek: (startDate?: string, endDate?: string) => void;
  onExportFestival: () => void;
}

const EventsList: React.FC<EventsListProps> = ({ events, recentActivity, onExportWeek, onExportFestival }) => {
  const [showDatePickers, setShowDatePickers] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedEventIds, setExpandedEventIds] = useState<string[]>([]);
  const [dbOrchestras, setDbOrchestras] = useState<Record<string, any>>({});
  const [visibleMovimientos, setVisibleMovimientos] = useState(5);
  const { alerts: aemetAlerts, getAlertForEvent } = useAemetAlerts();

  // Log para confirmar que EventsList detecta cuando las alertas cambian
  useEffect(() => {
    if (aemetAlerts.length > 0) {
      console.log(`[EventsList] ✅ AEMET alerts received in component: ${aemetAlerts.length} alerts. Component will re-render.`);
    }
  }, [aemetAlerts]);

  // Memoizar las alertas por evento para que se recalculen cuando cambian las alertas
  const alertsByEvent = useMemo(() => {
    if (aemetAlerts.length === 0) return {};
    const map: Record<string, AemetAlert[]> = {};
    events.forEach(event => {
      const alerts = getAlertForEvent(event.municipio, event.day, event.hora);
      if (alerts.length > 0) {
        map[event.id] = alerts;
      }
    });
    console.log(`[EventsList] 🔄 Recalculated alerts map: ${Object.keys(map).length} events with alerts`);
    return map;
  }, [aemetAlerts, events, getAlertForEvent]);

  useEffect(() => {
    // Load orchestra archive lazily
    const loadArchive = async () => {
      if (!orchestraArchive.length) {
        const archive = await getCachedOrchestraArchive();
        orchestraArchive = (archive as any).orchestras || [];
        orchestraArchive.forEach((o: any) => archiveMap[o.name] = o);
      }
    };

    loadArchive();

    const unsubscribe = onValue(orchestrasRef, (snapshot) => {
      const data = snapshot.val() || {};

      // Merge Archive (Base) + Firebase (Overrides)
      const merged = { ...archiveMap };
      Object.values(data).forEach((info: any) => {
        if (info && info.name) {
          merged[info.name] = info;
        }
      });

      setDbOrchestras(merged);
    });
    return () => unsubscribe();
  }, []);

  const { eventsByDay, sortedEvents, lastUpdate } = useMemo(() => {
    const grouped = groupEventsByDay(events);
    const sorted = sortEventsByDateTime(events);
    const update = getLastUpdateDate(sorted, recentActivity);
    return { eventsByDay: grouped, sortedEvents: sorted, lastUpdate: update };
  }, [events, recentActivity]);

  const toggleEvent = (id: string) => {
    setExpandedEventIds(prev =>
      prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]
    );
  };


  const getOrchestraInfo = useMemo(() => (name: string) => {
    const cleanName = name.trim();
    const dbInfo = dbOrchestras[cleanName] || {};
    const fileInfo = orchestraDetails[cleanName] || {};
    return { ...fileInfo, ...dbInfo };
  }, [dbOrchestras]);

  const handleExportClick = () => {
    if (showDatePickers && startDate && endDate) {
      onExportWeek(startDate, endDate);
    } else {
      setShowDatePickers(!showDatePickers);
    }
  };

  const generateDirectionsLink = (event: Event) => {
    const address = event.lugar ? `${event.lugar}, ${event.municipio}, Tenerife` : `${event.municipio}, Tenerife`;
    const encodedAddress = encodeURIComponent(address);
    return `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=driving`;
  };

  const generateTransitLink = (event: Event) => {
    const address = event.lugar ? `${event.lugar}, ${event.municipio}, Tenerife` : `${event.municipio}, Tenerife`;
    const encodedAddress = encodeURIComponent(address);
    return `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}&travelmode=transit`;
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 md:py-3 md:px-6">
        <h2 className="text-xl md:text-3xl font-bold text-center flex items-center justify-center gap-2 md:gap-3">
          <Calendar className="w-5 h-5 md:w-8 md:h-8" />
          Próximas Verbenas
          <Music2 className="w-5 h-5 md:w-8 md:h-8" />
        </h2>
      </div>

      {/* Events List */}
      <div className="p-6 space-y-6">
        {Object.entries(eventsByDay)
          .sort(([dayKeyA], [dayKeyB]) => new Date(dayKeyA).getTime() - new Date(dayKeyB).getTime())
          .map(([dayKey, dayEvents]) => {
            const dayDate = new Date(dayKey);
            const dayName = formatDayName(dayDate);

            const sortedDayEvents = sortEventsByDateTime(dayEvents);

            return (
              <div key={dayKey} className={`space-y-4 ${dayKey !== Object.keys(eventsByDay).sort()[0] ? 'mt-8 pt-4 border-t border-gray-700/30' : ''}`}>
                <div className="py-3 bg-gradient-to-r from-transparent via-yellow-400/15 to-transparent border-y border-yellow-400/20">
                  <h3 className="text-xl md:text-2xl font-bold text-yellow-400 flex items-center justify-center gap-3 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
                    <Calendar className="w-6 h-6 text-yellow-500" />
                    <span className="tracking-wide uppercase">{dayName}</span>
                    <Calendar className="w-6 h-6 text-yellow-500" />
                  </h3>
                </div>

                <div className="space-y-3">
                  {sortedDayEvents.map((event) => (
                    <div
                      key={event.id}
                      onDoubleClick={() => toggleEvent(event.id)}
                      className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-lg p-4 border border-gray-600/30 hover:border-blue-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 cursor-pointer select-none group"
                    >
                      <div className="flex flex-wrap items-center gap-4 text-center md:text-left min-w-0 overflow-hidden">
                        <div className="flex items-center gap-2 text-blue-300 font-bold">
                          <Clock className="w-5 h-5" />
                          <span className="text-lg">{event.hora}H</span>
                        </div>

                        {event.tipo !== 'Baile Normal' && (
                          <div className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-sm font-medium border border-cyan-500/30">
                            {event.tipo}
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-gray-300">
                          <MapPin className="w-5 h-5" />
                          <span>
                            {event.lugar ? `${event.lugar}, ` : ''}{event.municipio}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <WeatherIcon
                            date={event.day}
                            municipio={event.municipio}
                            time={event.hora}
                            alert={alertsByEvent[event.id]}
                          />
                          <a
                            href={generateTransitLink(event)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center px-3 py-1.5 bg-gradient-to-r from-green-500/20 to-green-600/20 text-green-300 rounded-lg text-sm font-medium border border-green-500/30 hover:from-green-500/30 hover:to-green-600/30 hover:border-green-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20"
                            title={`Cómo llegar en guagua a ${event.municipio}`}
                          >
                            <TITSALogo />
                          </a>
                          <button
                            onClick={() => toggleEvent(event.id)}
                            className="p-1.5 text-gray-400 hover:text-white transition-colors"
                            title="Ver detalles de la formación"
                          >
                            <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${expandedEventIds.includes(event.id) ? 'rotate-180' : ''}`} />
                          </button>

                          <a
                            href={generateDirectionsLink(event)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 rounded-lg text-sm font-medium border border-emerald-500/30 hover:from-emerald-500/30 hover:to-teal-500/30 hover:border-emerald-400/50 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/20"
                            title={`Cómo llegar a ${event.lugar ? event.lugar + ', ' : ''}${event.municipio}`}
                          >
                            <Navigation className="w-4 h-4" />
                            <span className="hidden sm:inline">Cómo llegar</span>
                          </a>
                        </div>

                        <div className="flex items-center gap-2 text-green-400 font-semibold min-w-0 max-w-full overflow-hidden">
                          <Music2 className="w-5 h-5 flex-shrink-0" />
                          <span className="text-sm leading-relaxed min-w-0 orchestra-names-container">
                            {event.orquesta.split(',').map((orquesta, i, arr) => (
                              <span key={`${event.id}-${i}`} className="orchestra-name-unit">
                                {orquesta.trim()}
                                {i < arr.length - 1 && <span className="orchestra-separator">,</span>}
                              </span>
                            ))}
                          </span>
                        </div>
                      </div>


                      {/* Dropdown Details */}
                      {
                        expandedEventIds.includes(event.id) && (
                          <div className="mt-4 pt-4 border-t border-gray-600/50 animate-fadeIn">
                            <div className="bg-black/20 p-4 rounded-lg space-y-4">
                              <h4 className="text-blue-300 font-semibold flex items-center gap-2 text-sm uppercase tracking-wide">
                                <Info className="w-4 h-4" />
                                Información de las formaciones
                              </h4>
                              <div className="grid gap-3">
                                {event.orquesta.split(',').map((orqName, i) => {
                                  const cleanName = orqName.trim();
                                  if (!cleanName || cleanName === 'DJ') return null;
                                  const info = getOrchestraInfo(cleanName);

                                  return (
                                    <div key={`${event.id}-${i}`} className="bg-gray-800/50 p-3 rounded border border-gray-700/50">
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <span className="font-bold text-white">{cleanName}</span>
                                        <div className="flex gap-2">
                                          {info.facebook && (
                                            <a href={info.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">
                                              <Facebook className="w-4 h-4" />
                                            </a>
                                          )}
                                          {info.instagram && (
                                            <a href={info.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300 transition-colors">
                                              <Instagram className="w-4 h-4" />
                                            </a>
                                          )}
                                          {info.phone && (
                                            <a href={`tel:${info.phone}`} className="text-green-400 hover:text-green-300 transition-colors">
                                              <Phone className="w-4 h-4" />
                                            </a>
                                          )}
                                          {(info.website || info.Otros) && (
                                            <a href={info.website || info.Otros} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 transition-colors">
                                              <Globe className="w-4 h-4" />
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded text-yellow-200/80 text-xs italic flex items-start gap-2">
                                <ExternalLink className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <div>
                                  <p>
                                    Recomendamos visitar las redes sociales oficiales de las orquestas para confirmar horarios y posibles cambios de última hora.
                                  </p>
                                  {event.programa && (
                                    <p className="mt-2">
                                      También puedes consultar el{' '}
                                      <a
                                        href={event.programa}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline text-yellow-100 hover:text-yellow-50 transition-colors"
                                      >
                                        programa oficial del evento
                                      </a>{' '}
                                      para obtener información detallada.
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      }
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
      </div >

      {/* Footer / Últimos Movimientos */}
      <div
        className="bg-gradient-to-r from-gray-800 to-gray-700 p-6 space-y-4 relative group/footer overflow-hidden"
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
          e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
        }}
      >
        {/* Spotlight effect for footer area too - Optimized */}
        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover/footer:opacity-100 transition-opacity duration-300 overflow-hidden">
          <div
            className="absolute w-[600px] h-[600px] -left-[300px] -top-[300px]"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
              transform: 'translate3d(var(--mouse-x), var(--mouse-y), 0)',
              willChange: 'transform'
            }}
          />
        </div>

        <div className="relative z-10 text-center font-bold text-sm">
          <div className="flex items-center justify-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-amber-500">
              Última actualización: {lastUpdate}
            </span>
          </div>
        </div>

        {/* Recent Activity — Timeline */}
        {
          recentActivity && recentActivity.length > 0 && (
            <>
              <div className="flex items-center gap-3 pt-2">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gray-600/60" />
                <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-widest whitespace-nowrap">
                  Últimos movimientos
                </h4>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gray-600/60" />
              </div>

              <div className="activity-timeline mt-2">
                {recentActivity.slice(0, visibleMovimientos).map((item, index) => (
                  <div key={item.event.id} className="activity-timeline-item">
                    {/* Node */}
                    <div className={`activity-timeline-node ${index === 0 ? 'latest' : ''} ${
                      item.type === 'add' ? 'bg-green-500/30 text-green-400' :
                      item.type === 'edit' ? 'bg-blue-500/30 text-blue-400' :
                      item.type === 'reagregado' ? 'bg-purple-500/30 text-purple-400' :
                      'bg-red-500/30 text-red-400'
                    }`}>
                      {item.type === 'add' ? <Plus /> :
                        item.type === 'edit' ? <Edit /> :
                          item.type === 'reagregado' ? <RotateCcw /> :
                            <Trash2 />}
                    </div>

                    {/* Content */}
                    <div className="text-sm">
                      <div className="flex items-center justify-start gap-2 flex-wrap mb-1">
                        {index === 0 && (
                          <span className="bg-blue-500/20 text-blue-400 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-blue-500/30 mr-1 animate-pulse">
                            MÁS RECIENTE
                          </span>
                        )}
                        <span className={`font-semibold text-xs uppercase tracking-wide ${
                          item.type === 'add' ? 'text-green-400' :
                          item.type === 'edit' ? 'text-blue-400' :
                          item.type === 'reagregado' ? 'text-purple-400' :
                          'text-red-400'
                        }`}>
                          {item.type === 'add' ? 'Nuevo' :
                            item.type === 'edit' ? 'Modificado' :
                              item.type === 'reagregado' ? 'Re-agregado' :
                                'Eliminado'}
                        </span>
                        <span className="text-gray-200">
                          {item.event.lugar ? `${item.event.lugar}, ` : ''}{item.event.municipio}
                        </span>
                      </div>
                      
                      <div className="text-gray-500 text-xs flex items-center justify-start gap-1.5 flex-wrap">
                        <span>{item.event.orquesta}</span>
                        <span className="text-gray-700">·</span>
                        <span>{new Date(item.event.day).toLocaleDateString('es-ES')}</span>
                        <span className="text-gray-700">·</span>
                        <span className="text-gray-400 italic">{item.event.tipo}</span>
                      </div>

                      {item.type === 'edit' && item.event.cambios && item.event.cambios.length > 0 && (
                        <div className="flex flex-wrap items-center justify-start gap-1 mt-2">
                          <span className="text-blue-400/80 text-[10px] font-bold uppercase tracking-tight mr-1">Cambios:</span>
                          {item.event.cambios.map((cambio) => {
                            const labels: Record<string, { label: string; color: string; icon: string }> = {
                              hora: { label: 'Hora', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: '🕐' },
                              dia: { label: 'Día', color: 'bg-orange-500/20 text-orange-300 border-orange-500/30', icon: '📅' },
                              orquestas: { label: 'Formación', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30', icon: '🎵' },
                              orquesta_add: { label: 'Nueva orquesta', color: 'bg-green-500/20 text-green-300 border-green-500/30', icon: '➕' },
                              orquesta_rem: { label: 'Orquesta quitada', color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: '➖' },
                              grupo_add: { label: 'Nuevo grupo', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', icon: '➕' },
                              grupo_rem: { label: 'Grupo quitado', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30', icon: '➖' },
                              solista_add: { label: 'Nuevo artista', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: '➕' },
                              solista_rem: { label: 'Artista quitado', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', icon: '➖' },
                              dj_add: { label: 'Nuevo DJ', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: '🎧' },
                              dj_rem: { label: 'DJ quitado', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30', icon: '➖' },
                              lugar: { label: 'Lugar', color: 'bg-teal-500/20 text-teal-300 border-teal-500/30', icon: '📍' },
                              municipio: { label: 'Municipio', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', icon: '🏘️' },
                              tipo: { label: 'Tipo', color: 'bg-violet-500/20 text-violet-300 border-violet-500/30', icon: '🏷️' },
                              add: { label: 'Añadido', color: 'bg-green-500/20 text-green-300 border-green-500/30', icon: '➕' },
                              remove: { label: 'Eliminado', color: 'bg-red-500/20 text-red-300 border-red-500/30', icon: '➖' },
                              artist_add: { label: 'Nuevo artista', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: '➕' },
                              artist_rem: { label: 'Artista quitado', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', icon: '➖' },
                              artista: { label: 'Artista', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: '🎤' },
                              dj: { label: 'DJ', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: '🎧' },
                            };
                            const info = labels[cambio] || { label: 'Cambio', color: 'bg-gray-500/20 text-gray-300 border-gray-500/30', icon: '✏️' };
                            return (
                              <span
                                key={cambio}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium border ${info.color}`}
                              >
                                <span>{info.icon}</span>
                                {info.label}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      
                      {index === recentActivity.slice(0, visibleMovimientos).length - 1 && recentActivity.length > 1 && (
                        <div className="mt-4 text-[9px] text-gray-600 font-bold tracking-widest uppercase">
                          Inicio del bloque
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Ver más / Comprimir — Lógica mejorada */}
              <div className="flex items-center justify-center gap-4 mt-4 mb-2">
                {visibleMovimientos < recentActivity.length && (
                  <button
                    onClick={() => setVisibleMovimientos(prev => Math.min(prev + 5, recentActivity.length))}
                    className="flex items-center gap-1.5 py-1 px-3 text-xs text-gray-500 hover:text-gray-300 hover:bg-gray-800/30 rounded-full border border-gray-700/50 transition-all"
                    title={`Ver ${Math.min(5, recentActivity.length - visibleMovimientos)} movimientos más`}
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                    Ver más ({recentActivity.length - visibleMovimientos})
                  </button>
                )}
                
                {visibleMovimientos > 5 && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setVisibleMovimientos(5);
                    }}
                    className="flex items-center gap-1.5 py-1 px-3 text-xs text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-full border border-gray-700/50 hover:border-blue-500/30 transition-all"
                  >
                    <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                    {visibleMovimientos === recentActivity.length ? 'Cerrar lista' : 'Comprimir'}
                  </button>
                )}
              </div>
            </>
          )
        }

        {/* Export Section */}
        <div className="flex flex-col items-center gap-4">
          {showDatePickers && (
            <div className="flex flex-col sm:flex-row gap-4 items-center bg-gray-700/50 p-4 rounded-lg">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-1">Fecha de inicio</label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-gray-800 border border-gray-600 rounded-lg p-2 text-white"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-1">Fecha de fin</label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-gray-800 border border-gray-600 rounded-lg p-2 text-white"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleExportClick}
              disabled={showDatePickers && (!startDate || !endDate)}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-1 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              {showDatePickers ? 'Generar Imagen' : 'Exportar por fechas'}
            </button>

            <button
              onClick={() => onExportFestival()}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 hover:-translate-y-1"
            >
              <Download className="w-5 h-5" />
              Exportar fiesta específica
            </button>
          </div>
        </div>
      </div >
    </div >
  );
};

export default React.memo(EventsList);

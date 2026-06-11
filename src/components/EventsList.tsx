import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Calendar, Clock, MapPin, Music2, Download, Navigation, Plus, Edit, Trash2, Info, ExternalLink, ChevronDown, Globe, Phone, Bus, RotateCcw, Loader2, Mail, Search } from 'lucide-react';
import { FaFacebook, FaInstagram } from 'react-icons/fa';
import { onValue, orchestrasRef, messagesRef, query, limitToLast } from '../utils/firebase';
import { orchestraDetails } from '../data/orchestras';
import { getCachedOrchestraArchive } from '../utils/dataLoaders';
import { Event, RecentActivityItem } from '../types';
import { groupEventsByDay, sortEventsByDateTime, formatDayName, getLastUpdateDate, getLastUpdateInfo } from '../utils/helpers';
import WeatherIcon from './WeatherIcon';
import TITSALogo from './TITSALogo';
import { useAemetAlerts, AemetAlert } from '../hooks/useAemetAlerts';

interface EventsListProps {
  events: Event[];
  recentActivity?: RecentActivityItem[];
  onExportWeek: (startDate?: string, endDate?: string) => void;
  onExportFestival: () => void;
  searchTerm?: string;
}

const renderMotiveText = (text: string) => {
  if (!text) return 'Sin especificar';
  
  // Matches URLs starting with http://, https://, or www.
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const parts = text.split(urlRegex);
  const matches = text.match(urlRegex) || [];
  
  let matchIndex = 0;
  return parts.map((part, index) => {
    if (matches[matchIndex] && part === matches[matchIndex]) {
      const url = matches[matchIndex];
      matchIndex++;
      const href = url.match(/^https?:\/\//i) ? url : `https://${url}`;
      return (
        <a
          key={index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-0.5 break-all font-medium transition-colors"
        >
          {url}
          <ExternalLink className="w-3 h-3 inline-block shrink-0" />
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

const EventsList: React.FC<EventsListProps> = ({ events, recentActivity, onExportWeek, onExportFestival, searchTerm }) => {
  const [showDatePickers, setShowDatePickers] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedEventIds, setExpandedEventIds] = useState<string[]>([]);
  const [dbOrchestras, setDbOrchestras] = useState<Record<string, any>>({});
  const [orchestraArchive, setOrchestraArchive] = useState<any[]>([]);
  const [archiveMap, setArchiveMap] = useState<Record<string, any>>({});
  const [isLoadingOrchestras, setIsLoadingOrchestras] = useState(true);
  const [visibleMovimientos, setVisibleMovimientos] = useState(5);
  const [lastMessageDays, setLastMessageDays] = useState<number | null>(null);
  const { alerts: aemetAlerts, getAlertForEvent } = useAemetAlerts();

  useEffect(() => {
    const q = query(messagesRef, limitToLast(1));
    const unsubscribe = onValue(q, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const lastMsg: any = Object.values(data)[0];
        if (lastMsg && lastMsg.timestamp) {
          const now = Date.now();
          const diffMs = now - lastMsg.timestamp;
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          setLastMessageDays(diffDays);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const alertsByEvent = useMemo(() => {
    if (aemetAlerts.length === 0) return {};
    const map: Record<string, AemetAlert[]> = {};
    events.forEach(event => {
      const alerts = getAlertForEvent(event.municipio, event.day, event.hora);
      if (alerts.length > 0) {
        map[event.id] = alerts;
      }
    });
    return map;
  }, [aemetAlerts, events, getAlertForEvent]);

  useEffect(() => {
    const loadAndSubscribe = async () => {
      if (!orchestraArchive.length) {
        const archive = await getCachedOrchestraArchive();
        const archiveData = (archive as any).orchestras || [];
        const newMap: Record<string, any> = {};
        archiveData.forEach((o: any) => newMap[o.name] = o);
        setOrchestraArchive(archiveData);
        setArchiveMap(newMap);
      }

      const unsubscribe = onValue(orchestrasRef, (snapshot) => {
        const data = snapshot.val() || {};
        const merged = { ...archiveMap };
        Object.values(data).forEach((info: any) => {
          if (info && info.name) {
            merged[info.name] = info;
          }
        });
        setDbOrchestras(merged);
      });

      setIsLoadingOrchestras(false);
      return unsubscribe;
    };

    let unsubscribe: (() => void) | undefined;
    loadAndSubscribe().then(unsub => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const { eventsByDay, sortedEvents, lastUpdate, updateInfo } = useMemo(() => {
    const grouped = groupEventsByDay(events);
    const sorted = sortEventsByDateTime(events);
    const update = getLastUpdateDate(sorted, recentActivity);
    const info = getLastUpdateInfo(sorted, recentActivity);
    return { eventsByDay: grouped, sortedEvents: sorted, lastUpdate: update, updateInfo: info };
  }, [events, recentActivity]);

  const fixedTypeSet = useMemo(() => new Set([
    'Baile Normal', 'Romería', 'Baile Magos', 'Tapas y Vinos', 'Paseo Romero',
    'Tapas', 'Romería Chica', 'Carnaval', 'Taifa', 'Infantil', 'Inclusiva',
    'Vinos', 'Aniversario', 'Solidario', 'Romería Barquera', 'Pamela',
    'Blanco', 'Sombrero', 'Sardinada', 'FIN DE AÑO', 'Cerveza', 'Otro'
  ]), []);

  const activeEventTypes = useMemo(() => {
    const displayedEvents = Object.values(eventsByDay).flat();
    const uniqueTypes = [...new Set(displayedEvents.map(e => e.tipo))];
    // hex palette different from fixed ones (not blue/amber/purple/rose/orange/red/yellow/fuchsia/emerald/teal/pink/indigo/cyan/lime/sky/gray)
    const palette = ['#c084fc','#f97316','#84cc16','#06b6d4','#d946ef','#10b981','#f43f5e','#8b5cf6','#eab308','#14b8a6'];
    let pi = 0;
    return uniqueTypes.map(t => {
      const isFixed = fixedTypeSet.has(t);
      const hex = isFixed ? null : palette[pi++ % palette.length];
      return { tipo: t, isFixed, hex };
    });
  }, [eventsByDay, fixedTypeSet]);

  const toggleEvent = (id: string) => {
    setExpandedEventIds(prev =>
      prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]
    );
  };


  const getOrchestraInfo = useMemo(() => (name: string) => {
    const cleanName = name.trim();
    const archiveInfo = archiveMap[cleanName] || {};
    const dbInfo = dbOrchestras[cleanName] || {};
    const fileInfo = orchestraDetails[cleanName] || {};
    return { ...fileInfo, ...archiveInfo, ...dbInfo };
  }, [archiveMap, dbOrchestras]);

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
    <div className="bg-gray-900 md:bg-gradient-to-br md:from-gray-900 md:via-gray-800 md:to-gray-900 text-white">
      {/* Header */}
      <div className="relative bg-blue-600 md:bg-gradient-to-r md:from-blue-600 md:to-purple-600 pt-3 pb-2 md:py-2">
        <div className="absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-gray-900 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-gray-900 to-transparent pointer-events-none z-10" />
        <h2 className="text-xl md:text-3xl font-bold text-center flex items-center justify-center gap-2 md:gap-3">
                        <Music2 className="w-5 h-5 md:w-8 md:h-8" aria-hidden="true" />
                          Próximas Verbenas
                          <Music2 className="w-5 h-5 md:w-8 md:h-8" aria-hidden="true" />
        </h2>
        <div className="flex items-center justify-center mt-0.5 px-2 gap-3 flex-nowrap">
          {/* Bloque de Actualización - Centrado */}
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-blue-900/40 to-blue-800/20 px-2.5 py-1 rounded">
            <div className="flex items-center gap-1 text-blue-100/90 text-[8.5px] md:text-xs font-bold whitespace-nowrap">
              <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-400" />
              <span>ACTUALIZADO: {lastUpdate}</span>
            </div>
            
            {updateInfo.relativeLabel && (
              <>
                <div className="w-px h-3 bg-white/20" />
                <div className={`flex items-center px-1.5 py-0.5 rounded-md text-[8.5px] md:text-xs font-black uppercase tracking-wider md:animate-pulse ${updateInfo.badgeClasses}`}>
                  {updateInfo.relativeLabel}
                </div>
              </>
            )}
          </div>

          {/* Bloque del Muro */}
          {lastMessageDays !== null && (
            <div className={`flex items-center gap-1 shrink-0 bg-gradient-to-r from-gray-800/40 to-gray-700/20 px-2.5 py-1 rounded ${
              lastMessageDays === 0 ? 'text-emerald-400' :
              lastMessageDays === 1 ? 'text-amber-400' :
              lastMessageDays <= 3 ? 'text-orange-400' :
              'text-red-400'
            }`} title={`Último mensaje en el muro: ${lastMessageDays === 0 ? 'hoy' : (lastMessageDays === 1 ? 'ayer' : `hace ${lastMessageDays} días`)}`}>
              <Mail className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-400" />
              <span className="text-[8.5px] md:text-xs font-black uppercase tracking-tighter whitespace-nowrap">
                <span className="text-white">Muro: </span>{lastMessageDays === 0 ? <span className="text-emerald-400">Hoy</span> : <span className="text-emerald-400">{lastMessageDays}d</span>}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Events List */}
      <div className="px-6 pb-6 -mt-1">
        {events.length === 0 && searchTerm ? (
          <div className="py-20 text-center space-y-4 md:animate-in md:fade-in md:zoom-in md:duration-500">
            <div className="bg-gray-800/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 border border-gray-700">
              <Search className="w-10 h-10 text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-white">No se encontraron verbenas</h3>
            <p className="text-gray-400 max-w-xs mx-auto">
              No hay resultados para "<span className="text-blue-400 font-semibold">{searchTerm}</span>". 
              Prueba con otro municipio u orquesta.
            </p>
          </div>
        ) : Object.entries(eventsByDay).length === 0 ? (
           <div className="py-20 text-center space-y-4">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
            <p className="text-gray-400">Cargando eventos...</p>
          </div>
        ) : (
          Object.entries(eventsByDay)
          .sort(([dayKeyA], [dayKeyB]) => new Date(dayKeyA).getTime() - new Date(dayKeyB).getTime())
          .map(([dayKey, dayEvents]) => {
            const dayDate = new Date(dayKey);
            const dayName = formatDayName(dayDate);

            const sortedDayEvents = sortEventsByDateTime(dayEvents);

            return (
              <div key={dayKey} className={`transform-gpu ${dayKey !== Object.keys(eventsByDay).sort()[0] ? 'border-t border-gray-700/30' : ''}`}>
                <div className="mt-3 mb-3 py-3 bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent">
                  <h3 className="text-xl md:text-2xl font-bold text-yellow-400 flex items-center justify-center gap-3">
                    <Calendar className="w-6 h-6 text-yellow-400/70" aria-hidden="true" />
                    <span className="tracking-wide uppercase">{dayName}</span>
                    <Calendar className="w-6 h-6 text-yellow-400/70" aria-hidden="true" />
                  </h3>
                </div>

                <div className="space-y-2">
                  {sortedDayEvents.map((event) => {
                    const tipoColor = event.tipo === 'Baile Normal' ? 'border-l-blue-400 border-r-blue-400' :
                      event.tipo === 'Romería' ? 'border-l-amber-500 border-r-amber-500' :
                      event.tipo === 'Baile Magos' ? 'border-l-purple-500 border-r-purple-500' :
                      event.tipo === 'Tapas y Vinos' ? 'border-l-rose-400 border-r-rose-400' :
                      event.tipo === 'Paseo Romero' ? 'border-l-orange-400 border-r-orange-400' :
                      event.tipo === 'Tapas' ? 'border-l-red-400 border-r-red-400' :
                      event.tipo === 'Romería Chica' ? 'border-l-amber-400 border-r-amber-400' :
                      event.tipo === 'Carnaval' ? 'border-l-fuchsia-400 border-r-fuchsia-400' :
                      event.tipo === 'Taifa' ? 'border-l-yellow-400 border-r-yellow-400' :
                      event.tipo === 'Infantil' ? 'border-l-emerald-400 border-r-emerald-400' :
                      event.tipo === 'Inclusiva' ? 'border-l-teal-400 border-r-teal-400' :
                      event.tipo === 'Vinos' ? 'border-l-pink-500 border-r-pink-500' :
                      event.tipo === 'Aniversario' ? 'border-l-indigo-400 border-r-indigo-400' :
                      event.tipo === 'Solidario' ? 'border-l-cyan-400 border-r-cyan-400' :
                      event.tipo === 'Romería Barquera' ? 'border-l-orange-500 border-r-orange-500' :
                      event.tipo === 'Pamela' ? 'border-l-pink-300 border-r-pink-300' :
                      event.tipo === 'Blanco' ? 'border-l-gray-300 border-r-gray-300' :
                      event.tipo === 'Sombrero' ? 'border-l-amber-300 border-r-amber-300' :
                      event.tipo === 'Sardinada' ? 'border-l-sky-400 border-r-sky-400' :
                      event.tipo === 'FIN DE AÑO' ? 'border-l-red-500 border-r-red-500' :
                      event.tipo === 'Cerveza' ? 'border-l-lime-400 border-r-lime-400' :
                      event.tipo === 'Otro' ? 'border-l-gray-400 border-r-gray-400' :
                      'border-l-gray-400 border-r-gray-400';

                    const tipoGradient = event.tipo === 'Baile Normal' ? 'linear-gradient(to right, rgba(96,165,250,0.15), transparent 50%, rgba(96,165,250,0.15))' :
                      event.tipo === 'Romería' ? 'linear-gradient(to right, rgba(245,158,11,0.15), transparent 50%, rgba(245,158,11,0.15))' :
                      event.tipo === 'Baile Magos' ? 'linear-gradient(to right, rgba(168,85,247,0.15), transparent 50%, rgba(168,85,247,0.15))' :
                      event.tipo === 'Tapas y Vinos' ? 'linear-gradient(to right, rgba(251,113,133,0.15), transparent 50%, rgba(251,113,133,0.15))' :
                      event.tipo === 'Paseo Romero' ? 'linear-gradient(to right, rgba(249,115,22,0.15), transparent 50%, rgba(249,115,22,0.15))' :
                      event.tipo === 'Tapas' ? 'linear-gradient(to right, rgba(248,113,113,0.15), transparent 50%, rgba(248,113,113,0.15))' :
                      event.tipo === 'Romería Chica' ? 'linear-gradient(to right, rgba(251,191,36,0.15), transparent 50%, rgba(251,191,36,0.15))' :
                      event.tipo === 'Carnaval' ? 'linear-gradient(to right, rgba(232,121,249,0.15), transparent 50%, rgba(232,121,249,0.15))' :
                      event.tipo === 'Taifa' ? 'linear-gradient(to right, rgba(250,204,21,0.15), transparent 50%, rgba(250,204,21,0.15))' :
                      event.tipo === 'Infantil' ? 'linear-gradient(to right, rgba(52,211,153,0.15), transparent 50%, rgba(52,211,153,0.15))' :
                      event.tipo === 'Inclusiva' ? 'linear-gradient(to right, rgba(45,212,191,0.15), transparent 50%, rgba(45,212,191,0.15))' :
                      event.tipo === 'Vinos' ? 'linear-gradient(to right, rgba(236,72,153,0.15), transparent 50%, rgba(236,72,153,0.15))' :
                      event.tipo === 'Aniversario' ? 'linear-gradient(to right, rgba(129,140,248,0.15), transparent 50%, rgba(129,140,248,0.15))' :
                      event.tipo === 'Solidario' ? 'linear-gradient(to right, rgba(34,211,238,0.15), transparent 50%, rgba(34,211,238,0.15))' :
                      event.tipo === 'Romería Barquera' ? 'linear-gradient(to right, rgba(249,115,22,0.15), transparent 50%, rgba(249,115,22,0.15))' :
                      event.tipo === 'Pamela' ? 'linear-gradient(to right, rgba(249,168,212,0.15), transparent 50%, rgba(249,168,212,0.15))' :
                      event.tipo === 'Blanco' ? 'linear-gradient(to right, rgba(209,213,219,0.15), transparent 50%, rgba(209,213,219,0.15))' :
                      event.tipo === 'Sombrero' ? 'linear-gradient(to right, rgba(252,211,77,0.15), transparent 50%, rgba(252,211,77,0.15))' :
                      event.tipo === 'Sardinada' ? 'linear-gradient(to right, rgba(56,189,248,0.15), transparent 50%, rgba(56,189,248,0.15))' :
                      event.tipo === 'FIN DE AÑO' ? 'linear-gradient(to right, rgba(239,68,68,0.15), transparent 50%, rgba(239,68,68,0.15))' :
                      event.tipo === 'Cerveza' ? 'linear-gradient(to right, rgba(163,230,53,0.15), transparent 50%, rgba(163,230,53,0.15))' :
                      event.tipo === 'Otro' ? 'linear-gradient(to right, rgba(156,163,175,0.15), transparent 50%, rgba(156,163,175,0.15))' :
                      'linear-gradient(to right, rgba(156,163,175,0.15), transparent 50%, rgba(156,163,175,0.15))';
                    
                    return (
                    (() => {
                      const isFixedType = fixedTypeSet.has(event.tipo);
                      const info = !isFixedType ? activeEventTypes.find(t => t.tipo === event.tipo) : null;
                      const hexC = info?.hex;
                      const cardBg = isFixedType ? tipoGradient : `linear-gradient(to right, ${hexC}26, transparent 50%, ${hexC}26)`;
                      const borderCls = isFixedType ? `border-l-4 border-r-4 ${tipoColor}` : 'border-l-4 border-r-4';
                      const borderSty = isFixedType ? {} : { borderLeftColor: hexC, borderRightColor: hexC };
                      return (
                    <div
                      key={event.id}
                      onDoubleClick={() => toggleEvent(event.id)}
                      style={{ background: cardBg, ...borderSty }}
                      className={`p-3 md:p-4 ${borderCls} border border-gray-700/50 hover:brightness-110 cursor-pointer select-none group transition-all duration-200`}
                    >
                      <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 text-center min-w-0">
                        <div className="flex items-center gap-1.5 text-white font-mono font-bold">
                          <span className="text-lg md:text-lg lg:text-2xl">{event.hora}</span>
                          <span className="text-xs text-gray-400">H</span>
                        </div>

                        {event.tipo !== 'Baile Normal' && (
                          <div className="px-2 py-0.5 bg-cyan-500/15 text-cyan-300 rounded text-sm lg:text-base font-medium border border-cyan-500/20">
                            {event.tipo}
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 text-gray-300">
                          <MapPin className="w-4 h-4 text-gray-500" aria-hidden="true" />
                          <span className="text-base lg:text-lg">
                            {event.lugar ? `${event.lugar}, ` : ''}{event.municipio}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <WeatherIcon
                            date={event.day}
                            municipio={event.municipio}
                            time={event.hora}
                            alert={alertsByEvent[event.id]}
                          />
                          <button
                            onClick={() => toggleEvent(event.id)}
                            aria-label={expandedEventIds.includes(event.id) ? "Ocultar detalles de la formación" : "Ver detalles de la formación"}
                            className="p-1 text-gray-500 hover:text-white transition-colors"
                          >
                            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${expandedEventIds.includes(event.id) ? 'rotate-180' : ''}`} />
                          </button>
                        </div>

                        <div className="flex items-center gap-2 text-green-400 font-semibold min-w-0 max-w-full">
                          <Music2 className="w-4 h-4 flex-shrink-0 opacity-60" />
                          <span className="text-base lg:text-lg leading-relaxed min-w-0 orchestra-names-container">
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
                              <h4 className="text-blue-300 font-semibold flex items-center gap-2 text-sm lg:text-lg uppercase tracking-wide">
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
                                        <span className="font-bold text-white text-base lg:text-xl">{cleanName}</span>
                                        <div className="flex gap-2">
                                          {info.facebook && (
                                            <a href={info.facebook} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors" aria-label={`Facebook de ${cleanName}`}>
                                              <FaFacebook className="w-4 h-4" />
                                            </a>
                                          )}
                                          {info.instagram && (
                                            <a href={info.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-400 hover:text-pink-300 transition-colors" aria-label={`Instagram de ${cleanName}`}>
                                              <FaInstagram className="w-4 h-4" />
                                            </a>
                                          )}
                                          {info.phone && (
                                            <a href={`tel:${info.phone}`} className="text-green-400 hover:text-green-300 transition-colors" aria-label={`Teléfono de ${cleanName}`}>
                                              <Phone className="w-4 h-4" />
                                            </a>
                                          )}
                                          {(info.website || info.Otros) && (
                                            <a href={info.website || info.Otros} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 transition-colors" aria-label={`Sitio web de ${cleanName}`}>
                                              <Globe className="w-4 h-4" />
                                            </a>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                              <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-700/50">
                                <a
                                  href={generateTransitLink(event)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-4 py-2 bg-green-900/50 text-green-300 rounded-lg text-sm font-medium border border-green-500/30 hover:bg-green-500/30 hover:border-green-400/50 transition-all"
                                  title={`Cómo llegar en guagua a ${event.municipio}`}
                                >
                                  <TITSALogo />
                                  <span>TITSA</span>
                                </a>
                                <a
                                  href={generateDirectionsLink(event)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 px-4 py-2 bg-emerald-900/50 text-emerald-300 rounded-lg text-sm font-medium border border-emerald-500/30 hover:bg-emerald-500/30 hover:border-emerald-400/50 transition-all"
                                  title={`Cómo llegar a ${event.lugar ? event.lugar + ', ' : ''}${event.municipio}`}
                                >
                                  <Navigation className="w-4 h-4" />
                                  <span>Cómo llegar</span>
                                </a>
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
                    );
                    })()
                    );
                  })}
                </div>
              </div>
            );
          }))}
      </div >

      {/* Leyenda de colores — solo tipos activos */}
      {activeEventTypes.length > 0 && (() => {
        const bgClass: Record<string, string> = {
          'Baile Normal': 'bg-blue-400', 'Romería': 'bg-amber-500', 'Baile Magos': 'bg-purple-500',
          'Tapas y Vinos': 'bg-rose-400', 'Paseo Romero': 'bg-orange-400', 'Tapas': 'bg-red-400',
          'Romería Chica': 'bg-amber-400', 'Carnaval': 'bg-fuchsia-400', 'Taifa': 'bg-yellow-400',
          'Infantil': 'bg-emerald-400', 'Inclusiva': 'bg-teal-400', 'Vinos': 'bg-pink-500',
          'Aniversario': 'bg-indigo-400', 'Solidario': 'bg-cyan-400', 'Romería Barquera': 'bg-orange-500',
          'Pamela': 'bg-pink-300', 'Blanco': 'bg-gray-300', 'Sombrero': 'bg-amber-300',
          'Sardinada': 'bg-sky-400', 'FIN DE AÑO': 'bg-red-500', 'Cerveza': 'bg-lime-400', 'Otro': 'bg-gray-400'
        };
        return (
          <div className="px-6 pb-4">
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-[10px] text-gray-500">
              {activeEventTypes.map(({ tipo, isFixed, hex }) => (
                <span key={tipo} className="flex items-center gap-1">
                  <span
                    className={`w-3 h-0.5 rounded-full inline-block ${isFixed ? bgClass[tipo] || '' : ''}`}
                    style={isFixed ? {} : { backgroundColor: hex! }}
                  ></span>
                  {tipo}
                </span>
              ))}
            </div>
          </div>
        );
      })()}

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
        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover/footer:opacity-100 transition-opacity duration-300 overflow-hidden hidden md:block">
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
                          <span className="bg-cyan-500/20 text-cyan-300 text-[9px] font-black px-1.5 py-0.5 rounded-full border border-cyan-500/30 mr-1 md:animate-pulse">
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

                      {item.type === 'delete' && (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-tight text-red-400/80">Motivo:</span>
                          <span className="text-xs text-gray-400 italic">
                            {renderMotiveText(item.event.motivoEliminacion || '')}
                          </span>
                        </div>
                      )}

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
                              programa: { label: 'Programa', color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30', icon: '📋' },
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

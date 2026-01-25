import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Clock, MapPin, Music2, Download, Navigation, Plus, Edit, Trash2, Info, ExternalLink, ChevronDown, Facebook, Instagram, Globe, Phone, Bus } from 'lucide-react';
import { onValue, orchestrasRef } from '../utils/firebase';
import { orchestraDetails } from '../data/orchestras';
import orchestraArchiveRaw from '../data/orchestraArchive.json';
import { Event, RecentActivityItem } from '../types';

const orchestraArchive = (orchestraArchiveRaw as any).orchestras || [];
const archiveMap: Record<string, any> = {};
orchestraArchive.forEach((o: any) => archiveMap[o.name] = o);
import { groupEventsByDay, sortEventsByDateTime, formatDayName, getLastUpdateDate } from '../utils/helpers';
import WeatherIcon from './WeatherIcon';
import TITSALogo from './TITSALogo';
import { useAemetAlerts } from '../hooks/useAemetAlerts';

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
  const { getAlertForEvent } = useAemetAlerts();

  useEffect(() => {
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
    const update = getLastUpdateDate(sorted);
    return { eventsByDay: grouped, sortedEvents: sorted, lastUpdate: update };
  }, [events]);

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
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
        <h2 className="text-2xl md:text-3xl font-bold text-center flex items-center justify-center gap-3">
          <Calendar className="w-8 h-8" />
          Próximas Verbenas
          <Music2 className="w-8 h-8" />
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
                            alert={getAlertForEvent(event.municipio, event.day)}
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
                            {event.orquesta.split(',').map((orquesta, index, arr) => (
                              <span key={index} className="orchestra-name-unit">
                                {orquesta.trim()}
                                {index < arr.length - 1 && <span className="orchestra-separator">,</span>}
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
                                {event.orquesta.split(',').map((orqName, idx) => {
                                  const cleanName = orqName.trim();
                                  if (!cleanName || cleanName === 'DJ') return null;
                                  const info = getOrchestraInfo(cleanName);

                                  return (
                                    <div key={idx} className="bg-gray-800/50 p-3 rounded border border-gray-700/50">
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
                                <p>
                                  Recomendamos visitar las redes sociales oficiales de las orquestas para confirmar horarios y posibles cambios de última hora.
                                </p>
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

        <div className="relative z-10 text-center text-green-400 font-bold text-sm">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
            Última actualización: {lastUpdate}
          </div>
        </div>

        {/* Recent Activity Block */}
        {
          recentActivity && recentActivity.length > 0 && (
            <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 w-full">
              <h4 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3 text-center">
                Últimos movimientos
              </h4>
              <div className="space-y-2">
                {recentActivity.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm bg-gray-800/50 p-2 rounded border border-gray-700/50">
                    <div className={`p-1.5 rounded-full ${item.type === 'add' ? 'bg-green-500/20 text-green-400' :
                      item.type === 'edit' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                      {item.type === 'add' ? <Plus className="w-3 h-3" /> :
                        item.type === 'edit' ? <Edit className="w-3 h-3" /> :
                          <Trash2 className="w-3 h-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${item.type === 'add' ? 'text-green-300' :
                          item.type === 'edit' ? 'text-blue-300' :
                            'text-red-300'
                          }`}>
                          {item.type === 'add' ? 'Nuevo:' :
                            item.type === 'edit' ? 'Modificado:' :
                              'Eliminado:'}
                        </span>
                        <span className="text-gray-300 truncate">
                          {item.event.lugar ? `${item.event.lugar}, ` : ''}{item.event.municipio}
                        </span>
                      </div>
                      <div className="text-gray-500 text-xs truncate">
                        {item.event.orquesta} - {new Date(item.event.day).toLocaleDateString('es-ES')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
              onClick={onExportFestival}
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

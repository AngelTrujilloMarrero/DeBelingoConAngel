import React, { useMemo } from 'react';
import {
    TrendingUp, TrendingDown, Minus, MapPin, Calendar,
    BarChart3, Star, Target, Activity, Award, ChevronUp, ChevronDown,
    Compass, Sun, Moon, Users, Zap, X
} from 'lucide-react';
import { Event } from '../types';

interface OrquestaAnalysisProps {
    orquesta: string;
    events: Event[];
    position: number;
    totalOrquestas: { name: string; count: number }[];
    onClose: () => void;
}

// Zonas de la isla de Tenerife
const zonasIsla: { [key: string]: string } = {
    // Norte
    'Santa Cruz de Tenerife': 'Metropolitana',
    'La Laguna': 'Metropolitana',
    'Tegueste': 'Norte',
    'Tacoronte': 'Norte',
    'El Sauzal': 'Norte',
    'La Matanza': 'Norte',
    'La Victoria': 'Norte',
    'Santa Úrsula': 'Norte',
    'Puerto de la Cruz': 'Norte',
    'La Orotava': 'Norte',
    'Los Realejos': 'Norte',
    'San Juan de la Rambla': 'Norte',
    'La Guancha': 'Norte',
    'Icod de los Vinos': 'Norte',
    'Garachico': 'Norte',
    'El Tanque': 'Norte',
    'Los Silos': 'Norte',
    'Buenavista del Norte': 'Norte',
    // Sur
    'Arona': 'Sur',
    'Adeje': 'Sur',
    'Granadilla': 'Sur',
    'San Miguel': 'Sur',
    'Vilaflor': 'Sur',
    'Arico': 'Sur',
    'Fasnia': 'Sur',
    'Güímar': 'Sur-Este',
    'Candelaria': 'Sur-Este',
    'Arafo': 'Sur-Este',
    // Oeste
    'Santiago del Teide': 'Oeste',
    'Guía de Isora': 'Oeste'
};

const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const OrquestaAnalysis: React.FC<OrquestaAnalysisProps> = ({
    orquesta,
    events,
    position,
    totalOrquestas,
    onClose
}) => {
    const analysis = useMemo(() => {
        const now = new Date();
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        const sixMonthsAgo = new Date(now);
        sixMonthsAgo.setMonth(now.getMonth() - 6);

        // Filtrar eventos de esta orquesta
        const orquestaEvents = events.filter(e =>
            !e.cancelado && e.orquesta.split(',').map(o => o.trim()).includes(orquesta)
        );

        // Eventos de los últimos 3 meses vs 3 meses anteriores
        const last3Months = orquestaEvents.filter(e => {
            const eventDate = new Date(e.day);
            return eventDate >= threeMonthsAgo && eventDate <= now;
        });

        const prev3Months = orquestaEvents.filter(e => {
            const eventDate = new Date(e.day);
            return eventDate >= sixMonthsAgo && eventDate < threeMonthsAgo;
        });

        // Tendencia
        const tendencia = last3Months.length - prev3Months.length;
        const porcentajeCambio = prev3Months.length > 0
            ? ((last3Months.length - prev3Months.length) / prev3Months.length * 100).toFixed(1)
            : last3Months.length > 0 ? '+100' : '0';

        // Municipio donde más tocan
        const municipioCounts: { [key: string]: number } = {};
        orquestaEvents.forEach(e => {
            municipioCounts[e.municipio] = (municipioCounts[e.municipio] || 0) + 1;
        });
        const municipiosMasActuan = Object.entries(municipioCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);

        // Zona de la isla donde más tocan
        const zonaCounts: { [key: string]: number } = {};
        orquestaEvents.forEach(e => {
            const zona = zonasIsla[e.municipio] || 'Otra';
            zonaCounts[zona] = (zonaCounts[zona] || 0) + 1;
        });
        const zonasMasActuan = Object.entries(zonaCounts)
            .sort(([, a], [, b]) => b - a);

        // Día de la semana que más actúan
        const diaCounts: { [key: string]: number } = {};
        orquestaEvents.forEach(e => {
            const dayOfWeek = diasSemana[new Date(e.day).getDay()];
            diaCounts[dayOfWeek] = (diaCounts[dayOfWeek] || 0) + 1;
        });
        const diaMasActua = Object.entries(diaCounts)
            .sort(([, a], [, b]) => b - a)[0];

        // Tipo de eventos donde destacan
        const tipoCounts: { [key: string]: number } = {};
        orquestaEvents.forEach(e => {
            if (e.tipo) {
                tipoCounts[e.tipo] = (tipoCounts[e.tipo] || 0) + 1;
            }
        });
        const tiposMasActuan = Object.entries(tipoCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);

        // Estacionalidad (meses con más actuaciones)
        const mesCounts: { [key: string]: number } = {};
        const mesesNombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        orquestaEvents.forEach(e => {
            const mes = mesesNombres[new Date(e.day).getMonth()];
            mesCounts[mes] = (mesCounts[mes] || 0) + 1;
        });
        const mesesMasActuan = Object.entries(mesCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);

        // Versatilidad (número de municipios diferentes)
        const numMunicipios = Object.keys(municipioCounts).length;
        const versatilidad = numMunicipios >= 15 ? 'Muy Alta'
            : numMunicipios >= 10 ? 'Alta'
                : numMunicipios >= 5 ? 'Media'
                    : 'Baja';

        // Comparativa con antecesor y predecesor
        const antecesor = position > 0 ? totalOrquestas[position - 1] : null;
        const predecesor = position < totalOrquestas.length - 1 ? totalOrquestas[position + 1] : null;
        const actual = totalOrquestas[position];

        // Puntos fuertes y débiles
        const puntosFuertes: string[] = [];
        const puntosDebiles: string[] = [];

        // Analizar fortalezas
        if (tendencia > 0) puntosFuertes.push('Tendencia al alza en los últimos meses');
        if (numMunicipios >= 10) puntosFuertes.push(`Gran versatilidad geográfica (${numMunicipios} municipios)`);
        if (zonasMasActuan.length > 2) puntosFuertes.push('Presencia en múltiples zonas de la isla');
        if (diaMasActua && (diaMasActua[0] === 'viernes' || diaMasActua[0] === 'sábado')) {
            puntosFuertes.push('Preferidos para fines de semana');
        }
        if (tiposMasActuan.length > 2) puntosFuertes.push('Versatilidad en tipos de eventos');
        if (last3Months.length >= 5) puntosFuertes.push('Alta actividad reciente');

        // Analizar debilidades
        if (tendencia < 0) puntosDebiles.push('Tendencia a la baja en los últimos meses');
        if (numMunicipios < 5) puntosDebiles.push('Poca diversificación geográfica');
        if (zonasMasActuan.length === 1) puntosDebiles.push('Concentrados en una sola zona de la isla');
        if (last3Months.length < 2) puntosDebiles.push('Baja actividad reciente');
        if (prev3Months.length > 0 && last3Months.length === 0) {
            puntosDebiles.push('Sin actuaciones en los últimos 3 meses');
        }

        return {
            totalEventos: orquestaEvents.length,
            last3Months: last3Months.length,
            prev3Months: prev3Months.length,
            tendencia,
            porcentajeCambio,
            municipiosMasActuan,
            zonasMasActuan,
            diaMasActua,
            tiposMasActuan,
            mesesMasActuan,
            numMunicipios,
            versatilidad,
            antecesor,
            predecesor,
            actual,
            puntosFuertes,
            puntosDebiles
        };
    }, [orquesta, events, position, totalOrquestas]);

    return (
        <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-xl p-4 md:p-6 mt-4 border-2 border-purple-500/30 relative animate-fadeIn">
            {/* Botón cerrar */}
            <button
                onClick={onClose}
                className="absolute top-3 right-3 p-2 rounded-full bg-gray-700 hover:bg-red-600 transition-colors duration-300"
            >
                <X className="w-5 h-5 text-white" />
            </button>

            {/* Título */}
            <div className="text-center mb-6">
                <h3 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500">
                    📊 Análisis de {orquesta}
                </h3>
                <p className="text-gray-400 text-sm mt-1">Posición #{position + 1} en el ranking</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Tendencia */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                    <h4 className="text-purple-300 font-semibold flex items-center gap-2 mb-3">
                        <Activity className="w-5 h-5" /> Tendencia
                    </h4>
                    <div className="flex items-center gap-3">
                        {analysis.tendencia > 0 ? (
                            <TrendingUp className="w-8 h-8 text-green-400" />
                        ) : analysis.tendencia < 0 ? (
                            <TrendingDown className="w-8 h-8 text-red-400" />
                        ) : (
                            <Minus className="w-8 h-8 text-yellow-400" />
                        )}
                        <div>
                            <p className={`text-lg font-bold ${analysis.tendencia > 0 ? 'text-green-400' :
                                    analysis.tendencia < 0 ? 'text-red-400' : 'text-yellow-400'
                                }`}>
                                {analysis.tendencia > 0 ? '📈 Al Alza' : analysis.tendencia < 0 ? '📉 A la Baja' : '➡️ Estable'}
                            </p>
                            <p className="text-gray-400 text-sm">
                                Últimos 3 meses: {analysis.last3Months} | Anteriores: {analysis.prev3Months}
                            </p>
                            <p className="text-gray-300 text-xs">
                                Cambio: {analysis.porcentajeCambio}%
                            </p>
                        </div>
                    </div>
                </div>

                {/* Zona de la isla */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                    <h4 className="text-blue-300 font-semibold flex items-center gap-2 mb-3">
                        <Compass className="w-5 h-5" /> Zona Preferente
                    </h4>
                    {analysis.zonasMasActuan.map(([zona, count], idx) => (
                        <div key={zona} className="flex justify-between items-center mb-1">
                            <span className={`${idx === 0 ? 'text-white font-semibold' : 'text-gray-400'}`}>
                                {idx === 0 && '🏆 '}{zona}
                            </span>
                            <span className="text-blue-400">{count} eventos</span>
                        </div>
                    ))}
                </div>

                {/* Día preferente */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                    <h4 className="text-green-300 font-semibold flex items-center gap-2 mb-3">
                        <Calendar className="w-5 h-5" /> Día Preferente
                    </h4>
                    {analysis.diaMasActua && (
                        <div className="text-center">
                            <p className="text-2xl font-bold text-white capitalize">
                                {analysis.diaMasActua[0] === 'sábado' || analysis.diaMasActua[0] === 'viernes' ? '🎉 ' : '📅 '}
                                {analysis.diaMasActua[0]}
                            </p>
                            <p className="text-gray-400 text-sm">{analysis.diaMasActua[1]} actuaciones</p>
                        </div>
                    )}
                </div>

                {/* Municipio estrella */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                    <h4 className="text-yellow-300 font-semibold flex items-center gap-2 mb-3">
                        <MapPin className="w-5 h-5" /> Municipios Estrella
                    </h4>
                    {analysis.municipiosMasActuan.map(([muni, count], idx) => (
                        <div key={muni} className="flex justify-between items-center mb-1">
                            <span className={`${idx === 0 ? 'text-white font-semibold' : 'text-gray-400'} text-sm`}>
                                {idx === 0 && '⭐ '}{muni}
                            </span>
                            <span className="text-yellow-400">{count}</span>
                        </div>
                    ))}
                </div>

                {/* Estacionalidad */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                    <h4 className="text-orange-300 font-semibold flex items-center gap-2 mb-3">
                        <Sun className="w-5 h-5" /> Estacionalidad
                    </h4>
                    {analysis.mesesMasActuan.map(([mes, count], idx) => (
                        <div key={mes} className="flex justify-between items-center mb-1">
                            <span className={`${idx === 0 ? 'text-white font-semibold' : 'text-gray-400'}`}>
                                {idx === 0 && '☀️ '}{mes}
                            </span>
                            <span className="text-orange-400">{count}</span>
                        </div>
                    ))}
                </div>

                {/* Tipos de eventos */}
                <div className="bg-gray-700/50 rounded-lg p-4">
                    <h4 className="text-pink-300 font-semibold flex items-center gap-2 mb-3">
                        <Star className="w-5 h-5" /> Tipos de Eventos
                    </h4>
                    {analysis.tiposMasActuan.length > 0 ? (
                        analysis.tiposMasActuan.map(([tipo, count], idx) => (
                            <div key={tipo} className="flex justify-between items-center mb-1">
                                <span className={`${idx === 0 ? 'text-white font-semibold' : 'text-gray-400'} text-sm`}>
                                    {tipo}
                                </span>
                                <span className="text-pink-400">{count}</span>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-400 text-sm">Sin clasificar</p>
                    )}
                </div>
            </div>

            {/* Versatilidad */}
            <div className="mt-4 bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-lg p-4 border border-purple-500/20">
                <h4 className="text-purple-300 font-semibold flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5" /> Versatilidad Geográfica
                </h4>
                <div className="flex items-center gap-4">
                    <div className="flex-1">
                        <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, (analysis.numMunicipios / 20) * 100)}%` }}
                            />
                        </div>
                    </div>
                    <span className={`font-bold px-3 py-1 rounded-full text-sm ${analysis.versatilidad === 'Muy Alta' ? 'bg-green-600/50 text-green-300' :
                            analysis.versatilidad === 'Alta' ? 'bg-blue-600/50 text-blue-300' :
                                analysis.versatilidad === 'Media' ? 'bg-yellow-600/50 text-yellow-300' :
                                    'bg-red-600/50 text-red-300'
                        }`}>
                        {analysis.versatilidad} ({analysis.numMunicipios} municipios)
                    </span>
                </div>
            </div>

            {/* Puntos Fuertes y Débiles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                {/* Puntos Fuertes */}
                <div className="bg-green-900/30 rounded-lg p-4 border border-green-500/30">
                    <h4 className="text-green-400 font-semibold flex items-center gap-2 mb-3">
                        <Zap className="w-5 h-5" /> Puntos Fuertes
                    </h4>
                    {analysis.puntosFuertes.length > 0 ? (
                        <ul className="space-y-2">
                            {analysis.puntosFuertes.map((punto, idx) => (
                                <li key={idx} className="text-gray-300 text-sm flex items-start gap-2">
                                    <span className="text-green-400">✓</span> {punto}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-400 text-sm">Analizando fortalezas...</p>
                    )}
                </div>

                {/* Puntos Débiles */}
                <div className="bg-red-900/30 rounded-lg p-4 border border-red-500/30">
                    <h4 className="text-red-400 font-semibold flex items-center gap-2 mb-3">
                        <Target className="w-5 h-5" /> Áreas de Mejora
                    </h4>
                    {analysis.puntosDebiles.length > 0 ? (
                        <ul className="space-y-2">
                            {analysis.puntosDebiles.map((punto, idx) => (
                                <li key={idx} className="text-gray-300 text-sm flex items-start gap-2">
                                    <span className="text-red-400">!</span> {punto}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-green-400 text-sm">¡Sin áreas de mejora detectadas!</p>
                    )}
                </div>
            </div>

            {/* Comparativa con vecinos */}
            <div className="mt-4 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-lg p-4 border border-indigo-500/20">
                <h4 className="text-indigo-300 font-semibold flex items-center gap-2 mb-3">
                    <Award className="w-5 h-5" /> Comparativa en el Ranking
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Antecesor */}
                    {analysis.antecesor && (
                        <div className="bg-gray-800/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-green-400 mb-2">
                                <ChevronUp className="w-4 h-4" />
                                <span className="text-sm">#{position} - Por encima</span>
                            </div>
                            <p className="text-white font-semibold text-sm truncate">{analysis.antecesor.name}</p>
                            <p className="text-gray-400 text-xs">{analysis.antecesor.count} actuaciones</p>
                            <p className="text-red-400 text-xs mt-1">
                                Te supera en {analysis.antecesor.count - analysis.actual.count} actuaciones
                            </p>
                        </div>
                    )}

                    {/* Actual */}
                    <div className="bg-gradient-to-r from-yellow-600/30 to-orange-600/30 rounded-lg p-3 border-2 border-yellow-500/50">
                        <div className="flex items-center gap-2 text-yellow-400 mb-2">
                            <Star className="w-4 h-4" />
                            <span className="text-sm">#{position + 1} - Posición actual</span>
                        </div>
                        <p className="text-white font-bold text-sm truncate">{analysis.actual.name}</p>
                        <p className="text-yellow-300 text-xs">{analysis.actual.count} actuaciones</p>
                    </div>

                    {/* Predecesor */}
                    {analysis.predecesor && (
                        <div className="bg-gray-800/50 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-blue-400 mb-2">
                                <ChevronDown className="w-4 h-4" />
                                <span className="text-sm">#{position + 2} - Por debajo</span>
                            </div>
                            <p className="text-white font-semibold text-sm truncate">{analysis.predecesor.name}</p>
                            <p className="text-gray-400 text-xs">{analysis.predecesor.count} actuaciones</p>
                            <p className="text-green-400 text-xs mt-1">
                                Le superas en {analysis.actual.count - analysis.predecesor.count} actuaciones
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Estadísticas adicionales */}
            <div className="mt-4 text-center">
                <p className="text-gray-400 text-sm">
                    📊 Total de actuaciones registradas: <span className="text-white font-bold">{analysis.totalEventos}</span>
                </p>
            </div>
        </div>
    );
};

export default OrquestaAnalysis;

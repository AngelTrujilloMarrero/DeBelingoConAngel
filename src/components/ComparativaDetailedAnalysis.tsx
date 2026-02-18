import React, { useMemo, lazy, Suspense } from 'react';
import { X, TrendingUp, TrendingDown, Calendar, MapPin, Star } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Event } from '../types';
import { zonasIsla, diasSemana } from '../utils/zones';

const Doughnut = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Doughnut })));

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

interface ComparativaDetailedAnalysisProps {
    orquesta: string;
    month: string;
    events: Event[];
    selectedYear: number;
    onClose: () => void;
}

const ComparativaDetailedAnalysis: React.FC<ComparativaDetailedAnalysisProps> = ({
    orquesta,
    month,
    events,
    selectedYear,
    onClose
}) => {
    const analysis = useMemo(() => {
        const monthsOrder = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
        const monthIndex = monthsOrder.indexOf(month.toLowerCase());

        // Filtrar eventos de esta orquesta para el mes seleccionado en ambos años
        const currentYearEvents = events.filter(e => {
            const d = new Date(e.day);
            return !e.cancelado &&
                d.getFullYear() === selectedYear &&
                d.getMonth() === monthIndex &&
                e.orquesta.split(',').map(o => o.trim()).includes(orquesta);
        });

        const prevYearEvents = events.filter(e => {
            const d = new Date(e.day);
            return !e.cancelado &&
                d.getFullYear() === selectedYear - 1 &&
                d.getMonth() === monthIndex &&
                e.orquesta.split(',').map(o => o.trim()).includes(orquesta);
        });

        // Función para obtener estadísticas
        const getStats = (yearEvents: Event[]) => {
            // Zonas
            const zoneCounts: { [key: string]: number } = {};
            yearEvents.forEach(e => {
                const zona = zonasIsla[e.municipio] || 'Otra';
                zoneCounts[zona] = (zoneCounts[zona] || 0) + 1;
            });

            // Días
            const dayCounts: { [key: string]: number } = {};
            yearEvents.forEach(e => {
                const day = diasSemana[new Date(e.day).getDay()];
                dayCounts[day] = (dayCounts[day] || 0) + 1;
            });

            // Tipos
            const typeCounts: { [key: string]: number } = {};
            yearEvents.forEach(e => {
                if (e.tipo) {
                    typeCounts[e.tipo] = (typeCounts[e.tipo] || 0) + 1;
                }
            });

            return { zoneCounts, dayCounts, typeCounts };
        };

        const currentStats = getStats(currentYearEvents);
        const prevStats = getStats(prevYearEvents);

        const currentCount = currentYearEvents.length;
        const prevCount = prevYearEvents.length;

        let variation = 0;
        if (prevCount === 0 && currentCount > 0) {
            variation = 100;
        } else if (prevCount > 0) {
            variation = ((currentCount - prevCount) / prevCount) * 100;
        }

        return {
            currentCount,
            prevCount,
            variation,
            currentStats,
            prevStats
        };
    }, [orquesta, month, events, selectedYear]);

    // Crear datos para gráficas de "Donut" minimalista
    const createDoughnutData = (counts: { [key: string]: number }, title: string) => {
        const labels = Object.keys(counts);
        const data = Object.values(counts);

        // Paleta de colores minimalista y vibrante "Neon Pastel"
        const colors = [
            'rgb(99, 102, 241)',   // Indigo
            'rgb(168, 85, 247)',   // Purple
            'rgb(236, 72, 153)',   // Pink
            'rgb(244, 63, 94)',    // Rose
            'rgb(249, 115, 22)',   // Orange
            'rgb(234, 179, 8)',    // Yellow
            'rgb(34, 197, 94)',    // Green
            'rgb(6, 182, 212)',    // Cyan
        ];

        return {
            labels,
            datasets: [{
                label: title,
                data,
                backgroundColor: colors.slice(0, labels.length),
                borderColor: 'transparent',
                borderWidth: 0,
                hoverOffset: 15,
                borderRadius: 4, // Bordes redondeados sutiles en los segmentos
                spacing: 2,      // Pequeño espacio entre segmentos para look limpio
            }]
        };
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '65%', // Hace que sea un Donut en lugar de Pie (más minimalista)
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    color: '#94a3b8', // Slate-400 para texto suave
                    padding: 15,
                    usePointStyle: true, // Puntos en lugar de cajas
                    pointStyle: 'circle',
                    font: {
                        size: 11,
                        family: 'Inter, sans-serif'
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)', // Slate-900 muy oscuro
                titleColor: '#e2e8f0',
                bodyColor: '#e2e8f0',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                cornerRadius: 12,
                padding: 12,
                boxPadding: 4
            },
            datalabels: {
                color: 'white',
                font: {
                    weight: 'bold' as const,
                    size: 12
                },
                formatter: (value: number, context: any) => {
                    const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                    const percentage = ((value / total) * 100).toFixed(0);
                    // Solo mostrar si es significativo para evitar ruido visual
                    return percentage > '5' ? `${percentage}%` : '';
                },
                // Eliminar sombras pesadas para look "flat" minimalista
                textShadowBlur: 0,
            }
        },
        layout: {
            padding: 20
        },
        elements: {
            arc: {
                borderWidth: 0
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
            <div className="bg-[#0f172a] rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-gray-800 animate-in fade-in zoom-in duration-300">
                {/* Header Minimalista */}
                <div className="sticky top-0 bg-[#0f172a]/95 backdrop-blur-md p-6 border-b border-gray-800 flex justify-between items-center z-10">
                    <div>
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                            {orquesta}
                        </h2>
                        <p className="text-gray-400 text-sm capitalize mt-1 flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> {month} • {selectedYear - 1} vs {selectedYear}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-all duration-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* KPI Cards Minimalistas */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-800/30 rounded-2xl p-4 text-center border border-gray-700/50">
                            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{selectedYear - 1}</p>
                            <p className="text-3xl font-bold text-gray-200">{analysis.prevCount}</p>
                        </div>

                        <div className={`rounded-2xl p-4 text-center border ${analysis.variation > 0
                            ? 'bg-green-500/10 border-green-500/20'
                            : analysis.variation < 0
                                ? 'bg-red-500/10 border-red-500/20'
                                : 'bg-gray-800/30 border-gray-700/50'}`}>
                            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Variación</p>
                            <div className="flex items-center justify-center gap-1">
                                {analysis.variation > 0 ? (
                                    <TrendingUp className="w-4 h-4 text-green-400" />
                                ) : analysis.variation < 0 ? (
                                    <TrendingDown className="w-4 h-4 text-red-400" />
                                ) : null}
                                <span className={`text-2xl font-bold ${analysis.variation > 0 ? 'text-green-400' :
                                    analysis.variation < 0 ? 'text-red-400' : 'text-gray-400'}`}>
                                    {analysis.variation > 0 ? '+' : ''}{analysis.variation.toFixed(0)}%
                                </span>
                            </div>
                        </div>

                        <div className="bg-gray-800/30 rounded-2xl p-4 text-center border border-gray-700/50">
                            <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{selectedYear}</p>
                            <p className="text-3xl font-bold text-blue-400">{analysis.currentCount}</p>
                        </div>
                    </div>

                    {/* Gráficas Doughnut */}
                    <div className="space-y-6">
                        {/* Zonas */}
                        <div className="bg-gray-800/20 rounded-3xl p-6 border border-gray-800">
                            <h3 className="text-lg font-medium text-gray-200 mb-6 flex items-center gap-2">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <MapPin className="w-5 h-5 text-blue-400" />
                                </div>
                                Por Zonas
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {[
                                    { stats: analysis.prevStats.zoneCounts, year: selectedYear - 1 },
                                    { stats: analysis.currentStats.zoneCounts, year: selectedYear }
                                ].map((item) => (
                                    Object.keys(item.stats).length > 0 && (
                                        <div key={item.year} className="flex flex-col items-center">
                                            <h4 className="text-sm font-medium text-gray-500 mb-4">{item.year}</h4>
                                            <div className="relative w-full max-w-[280px] aspect-square">
                                                <Suspense fallback={<div className="flex items-center justify-center h-full">Cargando...</div>}>
                                                    <Doughnut data={createDoughnutData(item.stats, 'Zonas')} options={chartOptions as any} />
                                                </Suspense>
                                                {/* Center Text for Doughnut feel */}
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    <span className="text-2xl font-bold text-gray-700/50">
                                                        {Object.values(item.stats).reduce((a, b) => a + b, 0)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>

                        {/* Días */}
                        <div className="bg-gray-800/20 rounded-3xl p-6 border border-gray-800">
                            <h3 className="text-lg font-medium text-gray-200 mb-6 flex items-center gap-2">
                                <div className="p-2 bg-purple-500/10 rounded-lg">
                                    <Calendar className="w-5 h-5 text-purple-400" />
                                </div>
                                Por Días
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {[
                                    { stats: analysis.prevStats.dayCounts, year: selectedYear - 1 },
                                    { stats: analysis.currentStats.dayCounts, year: selectedYear }
                                ].map((item) => (
                                    Object.keys(item.stats).length > 0 && (
                                        <div key={item.year} className="flex flex-col items-center">
                                            <h4 className="text-sm font-medium text-gray-500 mb-4">{item.year}</h4>
                                            <div className="relative w-full max-w-[280px] aspect-square">
                                                <Suspense fallback={<div className="flex items-center justify-center h-full">Cargando...</div>}>
                                                    <Doughnut data={createDoughnutData(item.stats, 'Días')} options={chartOptions as any} />
                                                </Suspense>
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    <span className="text-2xl font-bold text-gray-700/50">
                                                        {Object.values(item.stats).reduce((a, b) => a + b, 0)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>

                        {/* Tipos */}
                        {(Object.keys(analysis.prevStats.typeCounts).length > 0 || Object.keys(analysis.currentStats.typeCounts).length > 0) && (
                            <div className="bg-gray-800/20 rounded-3xl p-6 border border-gray-800">
                                <h3 className="text-lg font-medium text-gray-200 mb-6 flex items-center gap-2">
                                    <div className="p-2 bg-pink-500/10 rounded-lg">
                                        <Star className="w-5 h-5 text-pink-400" />
                                    </div>
                                    Por Tipo
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {[
                                        { stats: analysis.prevStats.typeCounts, year: selectedYear - 1 },
                                        { stats: analysis.currentStats.typeCounts, year: selectedYear }
                                ].map((item) => (
                                    Object.keys(item.stats).length > 0 && (
                                        <div key={item.year} className="flex flex-col items-center">
                                                <h4 className="text-sm font-medium text-gray-500 mb-4">{item.year}</h4>
                                                <div className="relative w-full max-w-[280px] aspect-square">
                                                    <Suspense fallback={<div className="flex items-center justify-center h-full">Cargando...</div>}>
                                                        <Doughnut data={createDoughnutData(item.stats, 'Tipos')} options={chartOptions as any} />
                                                    </Suspense>
                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                        <span className="text-2xl font-bold text-gray-700/50">
                                                            {Object.values(item.stats).reduce((a, b) => a + b, 0)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComparativaDetailedAnalysis;

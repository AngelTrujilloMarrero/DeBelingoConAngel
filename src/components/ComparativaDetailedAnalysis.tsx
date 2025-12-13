import React, { useMemo } from 'react';
import { X, TrendingUp, TrendingDown, Calendar, MapPin, Star } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Event } from '../types';
import { zonasIsla, diasSemana } from '../utils/zones';

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

    // Crear datos para gráficas de quesito 3D
    const createPieData = (counts: { [key: string]: number }, title: string) => {
        const labels = Object.keys(counts);
        const data = Object.values(counts);

        const colors = [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 206, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)',
            'rgba(199, 199, 199, 0.8)',
        ];

        return {
            labels,
            datasets: [{
                label: title,
                data,
                backgroundColor: colors.slice(0, labels.length),
                borderColor: colors.slice(0, labels.length).map(c => c.replace('0.8', '1')),
                borderWidth: 2,
                hoverOffset: 20,
            }]
        };
    };

    const pieOptions = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    color: 'white',
                    padding: 10,
                    font: { size: 11 }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                titleColor: 'white',
                bodyColor: 'white',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                borderWidth: 1,
                cornerRadius: 8,
            },
            datalabels: {
                color: 'white',
                font: {
                    weight: 'bold' as const,
                    size: 14
                },
                formatter: (value: number, context: any) => {
                    const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                    const percentage = ((value / total) * 100).toFixed(0);
                    return `${percentage}%`;
                },
                // Crear efecto 3D con sombras
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.8)',
                shadowOffsetX: 2,
                shadowOffsetY: 2,
            }
        },
        layout: {
            padding: 20
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto border-2 border-purple-500/30">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-pink-600 to-rose-600 p-6 rounded-t-2xl">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-gray-700 hover:bg-red-600 transition-colors duration-300"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                    <h2 className="text-2xl md:text-3xl font-bold text-white text-center">
                        📊 Análisis Detallado: {orquesta}
                    </h2>
                    <p className="text-center text-pink-100 mt-2 capitalize">
                        {month} - Comparativa {selectedYear - 1} vs {selectedYear}
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Resumen de actuaciones */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                            <p className="text-gray-400 text-sm mb-2">{selectedYear - 1}</p>
                            <p className="text-4xl font-bold text-blue-400">{analysis.prevCount}</p>
                            <p className="text-gray-300 text-xs mt-1">actuaciones</p>
                        </div>
                        <div className="bg-gradient-to-r from-yellow-600/30 to-orange-600/30 rounded-lg p-4 text-center border-2 border-yellow-500/50">
                            <p className="text-gray-400 text-sm mb-2">Variación</p>
                            <div className="flex items-center justify-center gap-2">
                                {analysis.variation > 0 ? (
                                    <TrendingUp className="w-8 h-8 text-green-400" />
                                ) : analysis.variation < 0 ? (
                                    <TrendingDown className="w-8 h-8 text-red-400" />
                                ) : null}
                                <p className={`text-4xl font-bold ${analysis.variation > 0 ? 'text-green-400' :
                                    analysis.variation < 0 ? 'text-red-400' : 'text-yellow-400'}`}>
                                    {analysis.variation > 0 ? '+' : ''}{analysis.variation.toFixed(0)}%
                                </p>
                            </div>
                        </div>
                        <div className="bg-gray-700/50 rounded-lg p-4 text-center">
                            <p className="text-gray-400 text-sm mb-2">{selectedYear}</p>
                            <p className="text-4xl font-bold text-purple-400">{analysis.currentCount}</p>
                            <p className="text-gray-300 text-xs mt-1">actuaciones</p>
                        </div>
                    </div>

                    {/* Gráficas 3D */}
                    <div className="space-y-8 mt-8">
                        {/* Comparativa de Zonas */}
                        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <MapPin className="w-6 h-6 text-yellow-400" />
                                Distribución por Zonas
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {Object.keys(analysis.prevStats.zoneCounts).length > 0 && (
                                    <div>
                                        <h4 className="text-center text-gray-300 mb-4 font-semibold">{selectedYear - 1}</h4>
                                        <div className="bg-gray-900/50 rounded-lg p-4" style={{ maxHeight: '300px' }}>
                                            <Pie data={createPieData(analysis.prevStats.zoneCounts, 'Zonas')} options={pieOptions} />
                                        </div>
                                    </div>
                                )}
                                {Object.keys(analysis.currentStats.zoneCounts).length > 0 && (
                                    <div>
                                        <h4 className="text-center text-gray-300 mb-4 font-semibold">{selectedYear}</h4>
                                        <div className="bg-gray-900/50 rounded-lg p-4" style={{ maxHeight: '300px' }}>
                                            <Pie data={createPieData(analysis.currentStats.zoneCounts, 'Zonas')} options={pieOptions} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Comparativa de Días */}
                        <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Calendar className="w-6 h-6 text-green-400" />
                                Distribución por Días
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {Object.keys(analysis.prevStats.dayCounts).length > 0 && (
                                    <div>
                                        <h4 className="text-center text-gray-300 mb-4 font-semibold">{selectedYear - 1}</h4>
                                        <div className="bg-gray-900/50 rounded-lg p-4" style={{ maxHeight: '300px' }}>
                                            <Pie data={createPieData(analysis.prevStats.dayCounts, 'Días')} options={pieOptions} />
                                        </div>
                                    </div>
                                )}
                                {Object.keys(analysis.currentStats.dayCounts).length > 0 && (
                                    <div>
                                        <h4 className="text-center text-gray-300 mb-4 font-semibold">{selectedYear}</h4>
                                        <div className="bg-gray-900/50 rounded-lg p-4" style={{ maxHeight: '300px' }}>
                                            <Pie data={createPieData(analysis.currentStats.dayCounts, 'Días')} options={pieOptions} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Comparativa de Tipos */}
                        {(Object.keys(analysis.prevStats.typeCounts).length > 0 || Object.keys(analysis.currentStats.typeCounts).length > 0) && (
                            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <Star className="w-6 h-6 text-pink-400" />
                                    Distribución por Tipos de Evento
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {Object.keys(analysis.prevStats.typeCounts).length > 0 && (
                                        <div>
                                            <h4 className="text-center text-gray-300 mb-4 font-semibold">{selectedYear - 1}</h4>
                                            <div className="bg-gray-900/50 rounded-lg p-4" style={{ maxHeight: '300px' }}>
                                                <Pie data={createPieData(analysis.prevStats.typeCounts, 'Tipos')} options={pieOptions} />
                                            </div>
                                        </div>
                                    )}
                                    {Object.keys(analysis.currentStats.typeCounts).length > 0 && (
                                        <div>
                                            <h4 className="text-center text-gray-300 mb-4 font-semibold">{selectedYear}</h4>
                                            <div className="bg-gray-900/50 rounded-lg p-4" style={{ maxHeight: '300px' }}>
                                                <Pie data={createPieData(analysis.currentStats.typeCounts, 'Tipos')} options={pieOptions} />
                                            </div>
                                        </div>
                                    )}
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

import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { BarChart3, Calendar, Trophy, TrendingUp, TrendingDown, ChevronDown, ChevronUp, MousePointerClick, MapPin } from 'lucide-react';
import { Event, OrquestaCount, MonthlyOrquestaCount } from '../types';
import { getRandomColor } from '../utils/helpers';
import { zonasIsla, diasSemana } from '../utils/zones';
import OrquestaAnalysis from './OrquestaAnalysis';
import ComparativaDetailedAnalysis from './ComparativaDetailedAnalysis';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface StatisticsProps {
  events: Event[];
}

const Statistics: React.FC<StatisticsProps> = ({ events }) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentYearData, setCurrentYearData] = useState<OrquestaCount>({});
  const [nextYearData, setNextYearData] = useState<OrquestaCount>({});
  const [monthlyData, setMonthlyData] = useState<MonthlyOrquestaCount>({});
  const [monthlyEventCount, setMonthlyEventCount] = useState<{ [month: string]: number }>({});
  const [expandedMonths, setExpandedMonths] = useState<{ [month: string]: boolean }>({});
  const [selectedOrquesta, setSelectedOrquesta] = useState<string | null>(null);
  const [prevYearMonthlyData, setPrevYearMonthlyData] = useState<MonthlyOrquestaCount>({});
  const [prevYearMonthlyEventCount, setPrevYearMonthlyEventCount] = useState<{ [month: string]: number }>({});
  const [selectedComparativaOrquesta, setSelectedComparativaOrquesta] = useState<{ name: string; month: string } | null>(null);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const showAnalysis = selectedYear < currentYear || (selectedYear === currentYear && currentMonth >= 5);

  const toggleMonth = (month: string) => {
    setExpandedMonths(prev => ({
      ...prev,
      [month]: !prev[month]
    }));
  };

  const availableYears = [...new Set(events.map(event => new Date(event.day).getFullYear()))].sort((a, b) => b - a);

  useEffect(() => {
    calculateStatistics();
  }, [events, selectedYear]);

  const calculateStatistics = () => {
    const currentOrquestaCount: OrquestaCount = {};
    const nextOrquestaCount: OrquestaCount = {};
    const monthlyOrquestaCount: MonthlyOrquestaCount = {};
    const monthlyEvents: { [month: string]: number } = {};

    const prevMonthlyOrquestaCount: MonthlyOrquestaCount = {};
    const prevMonthlyEvents: { [month: string]: number } = {};

    events.forEach(event => {
      if (event.cancelado) return;

      const eventDate = new Date(event.day);
      const eventYear = eventDate.getFullYear();
      const month = eventDate.toLocaleDateString('es-ES', { month: 'long' });
      const orquestas = event.orquesta.split(',').map(orq => orq.trim()).filter(orq => orq !== 'DJ');

      if (eventYear === selectedYear) {
        monthlyEvents[month] = (monthlyEvents[month] || 0) + 1;
        orquestas.forEach(orq => {
          currentOrquestaCount[orq] = (currentOrquestaCount[orq] || 0) + 1;
          if (!monthlyOrquestaCount[month]) {
            monthlyOrquestaCount[month] = {};
          }
          monthlyOrquestaCount[month][orq] = (monthlyOrquestaCount[month][orq] || 0) + 1;
        });
      }

      if (eventYear === selectedYear + 1) {
        orquestas.forEach(orq => {
          nextOrquestaCount[orq] = (nextOrquestaCount[orq] || 0) + 1;
        });
      }

      if (eventYear === selectedYear - 1) {
        prevMonthlyEvents[month] = (prevMonthlyEvents[month] || 0) + 1;
        orquestas.forEach(orq => {
          if (!prevMonthlyOrquestaCount[month]) {
            prevMonthlyOrquestaCount[month] = {};
          }
          prevMonthlyOrquestaCount[month][orq] = (prevMonthlyOrquestaCount[month][orq] || 0) + 1;
        });
      }
    });

    setCurrentYearData(currentOrquestaCount);
    setNextYearData(nextOrquestaCount);
    setMonthlyData(monthlyOrquestaCount);
    setMonthlyEventCount(monthlyEvents);
    setPrevYearMonthlyData(prevMonthlyOrquestaCount);
    setPrevYearMonthlyEventCount(prevMonthlyEvents);
  };

  const sortedOrquestasList = useMemo(() => {
    return Object.entries(currentYearData)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([name, count]) => ({ name, count }));
  }, [currentYearData]);

  const createChartData = (data: OrquestaCount) => {
    const sortedData = Object.entries(data)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15);

    return {
      labels: sortedData.map(([name]) => name),
      datasets: [
        {
          label: 'Número de actuaciones',
          data: sortedData.map(([, count]) => count),
          backgroundColor: sortedData.map(() => getRandomColor()),
          borderColor: 'rgba(0, 0, 0, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    onClick: (_event: any, elements: any[]) => {
      if (showAnalysis && elements.length > 0) {
        const index = elements[0].index;
        const orquestaName = sortedOrquestasList[index]?.name;
        if (orquestaName) {
          setSelectedOrquesta(prev => prev === orquestaName ? null : orquestaName);
        }
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: 'white',
          padding: 20,
          usePointStyle: true,
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          afterBody: () => showAnalysis ? ['', '👆 Haz clic para ver análisis detallado'] : []
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: 'white', padding: 8, font: { size: 11 } },
        grid: { color: 'rgba(255, 255, 255, 0.1)', drawBorder: false },
      },
      x: {
        ticks: {
          color: 'white',
          maxRotation: window.innerWidth < 768 ? 90 : 45,
          minRotation: window.innerWidth < 768 ? 45 : 0,
          padding: 8,
          font: { size: window.innerWidth < 768 ? 9 : 11 },
        },
        grid: { color: 'rgba(255, 255, 255, 0.1)', drawBorder: false },
      },
    },
    layout: { padding: { top: 10, bottom: 10, left: 10, right: 10 } },
  };

  const currentYearChartData = createChartData(currentYearData);
  const selectedOrquestaPosition = selectedOrquesta
    ? sortedOrquestasList.findIndex(o => o.name === selectedOrquesta)
    : -1;

  return (
    <div className="space-y-8">
      {/* Year Selection */}
      <div className="flex justify-center">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-1">
          <div className="flex gap-2 bg-gray-900 rounded-lg p-2">
            {availableYears.map(year => (
              <button
                key={year}
                onClick={() => { setSelectedYear(year); setSelectedOrquesta(null); }}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${selectedYear === year
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
                  }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Current Year Statistics */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center flex items-center justify-center gap-3">
            <BarChart3 className="w-8 h-8" />
            Los 15 Primeros De {selectedYear}
            <TrendingUp className="w-8 h-8" />
          </h2>
          {showAnalysis ? (
            <p className="text-center text-blue-100 mt-2 text-sm flex items-center justify-center gap-2">
              <MousePointerClick className="w-4 h-4" />
              Haz clic en cualquier barra para ver el análisis detallado
            </p>
          ) : (
            <p className="text-center text-yellow-200 mt-2 text-sm">
              📊 El análisis detallado estará disponible a partir de junio
            </p>
          )}
        </div>

        <div className="p-3 md:p-6">
          {Object.keys(currentYearData).length > 0 ? (
            <>
              <div className="w-full cursor-pointer" style={{ height: 'calc(100vh - 400px)', minHeight: '400px', maxHeight: '600px' }}>
                <Bar data={currentYearChartData} options={chartOptions} />
              </div>

              {showAnalysis && (
                <>
                  <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                    {sortedOrquestasList.map((orq, idx) => (
                      <button
                        key={orq.name}
                        onClick={() => setSelectedOrquesta(prev => prev === orq.name ? null : orq.name)}
                        className={`p-2 rounded-lg text-xs font-medium transition-all duration-300 ${selectedOrquesta === orq.name
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg scale-105'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-white'
                          }`}
                      >
                        <span className="font-bold text-yellow-400">#{idx + 1}</span> {orq.name.length > 15 ? orq.name.substring(0, 15) + '...' : orq.name}
                      </button>
                    ))}
                  </div>

                  {selectedOrquesta && selectedOrquestaPosition >= 0 && (
                    <OrquestaAnalysis
                      orquesta={selectedOrquesta}
                      events={events}
                      position={selectedOrquestaPosition}
                      totalOrquestas={sortedOrquestasList}
                      selectedYear={selectedYear}
                      onClose={() => setSelectedOrquesta(null)}
                    />
                  )}
                </>
              )}
            </>
          ) : (
            <div className="text-center text-gray-400 py-12">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No hay datos disponibles para {selectedYear}</p>
            </div>
          )}
        </div>
      </div>

      {/* Monthly Tables */}
      <div className="space-y-8">
        {Object.entries(monthlyData)
          .sort(([monthA], [monthB]) => {
            const monthsOrder = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
            return monthsOrder.indexOf(monthA.toLowerCase()) - monthsOrder.indexOf(monthB.toLowerCase());
          })
          .map(([month, orquestas]) => {
            const sortedOrquestas = Object.entries(orquestas).sort(([, a], [, b]) => b - a);
            const isExpanded = expandedMonths[month];
            return (
              <div key={month} className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-600 to-blue-600 p-6 cursor-pointer hover:from-green-700 hover:to-blue-700 transition-all duration-300"
                  onClick={() => toggleMonth(month)}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl md:text-2xl font-bold text-white capitalize flex items-center gap-3">
                      <Calendar className="w-7 h-7" />
                      {month}
                    </h3>
                    {isExpanded ? <ChevronUp className="w-6 h-6 text-white" /> : <ChevronDown className="w-6 h-6 text-white" />}
                  </div>
                  <p className="text-center text-white mt-2">
                    Eventos de este mes: {monthlyEventCount[month] || 0}
                  </p>
                </div>

                {isExpanded && (
                  <div className="p-6 overflow-x-auto">
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                            <th className="px-6 py-4 text-left font-bold">FORMACIÓN/SOLISTA</th>
                            <th className="px-6 py-4 text-center font-bold">TOTAL</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedOrquestas.map(([orquesta, count], index) => (
                            <tr key={orquesta} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-blue-50 transition-colors duration-200`}>
                              <td className="px-6 py-4 text-gray-800 font-medium">{orquesta}</td>
                              <td className="px-6 py-4 text-center">
                                <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full font-bold">{count}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* Comparativa Interanual */}
      {(() => {
        const monthsOrder = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
        const monthsToRender = monthsOrder.filter(month => {
          const hasCurrentData = monthlyData[month] && Object.keys(monthlyData[month]).length > 0;
          const hasPrevData = prevYearMonthlyData[month] && Object.keys(prevYearMonthlyData[month]).length > 0;
          return hasCurrentData && hasPrevData;
        });

        if (monthsToRender.length === 0) return null;

        return (
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl overflow-hidden mt-12">
            <div className="bg-gradient-to-r from-pink-600 to-rose-600 p-6">
              <h2 className="text-2xl md:text-3xl font-bold text-white text-center flex items-center justify-center gap-3">
                <TrendingUp className="w-8 h-8" />
                Comparativa {selectedYear} vs {selectedYear - 1}
                <Calendar className="w-8 h-8" />
              </h2>
              <p className="text-center text-pink-100 mt-2 text-sm">
                Análisis comparativo de orquestas mes a mes
              </p>
            </div>

            <div className="p-4 space-y-6">
              {monthsToRender.map(month => {
                const currentData = monthlyData[month] || {};
                const prevData = prevYearMonthlyData[month] || {};
                const monthIndex = monthsOrder.indexOf(month);

                const allOrquestas = new Set([...Object.keys(currentData), ...Object.keys(prevData)]);

                const comparativaVia = Array.from(allOrquestas).map(orq => {
                  const currentCount = currentData[orq] || 0;
                  const prevCount = prevData[orq] || 0;

                  const getTopStat = (year: number, extractor: (e: Event) => string) => {
                    const yearEvents = events.filter(e => {
                      const d = new Date(e.day);
                      return !e.cancelado &&
                        d.getFullYear() === year &&
                        d.getMonth() === monthIndex &&
                        e.orquesta.split(',').map(o => o.trim()).includes(orq);
                    });

                    if (yearEvents.length === 0) return null;

                    const counts: { [key: string]: number } = {};
                    yearEvents.forEach(e => {
                      const val = extractor(e);
                      if (val) counts[val] = (counts[val] || 0) + 1;
                    });

                    if (Object.keys(counts).length === 0) return null;
                    return Object.entries(counts).sort(([, a], [, b]) => b - a)[0][0];
                  };

                  const prevZone = getTopStat(selectedYear - 1, (e) => zonasIsla[e.municipio] || 'Otra');
                  const currentZone = getTopStat(selectedYear, (e) => zonasIsla[e.municipio] || 'Otra');
                  const prevDay = getTopStat(selectedYear - 1, (e) => diasSemana[new Date(e.day).getDay()]);
                  const currentDay = getTopStat(selectedYear, (e) => diasSemana[new Date(e.day).getDay()]);
                  const prevType = getTopStat(selectedYear - 1, (e) => e.tipo || 'Desconocido');
                  const currentType = getTopStat(selectedYear, (e) => e.tipo || 'Desconocido');

                  let variation = 0;
                  let isNew = false;
                  if (prevCount === 0 && currentCount > 0) {
                    isNew = true;
                    variation = 100;
                  } else if (prevCount > 0) {
                    variation = ((currentCount - prevCount) / prevCount) * 100;
                  }

                  return {
                    name: orq, current: currentCount, prev: prevCount,
                    prevZone, currentZone, prevDay, currentDay, prevType, currentType,
                    variation, isNew
                  };
                }).sort((a, b) => b.current - a.current);

                const visibleRows = comparativaVia.filter(item => item.prev > 0);
                const lostAll = comparativaVia.filter(item => item.prev > 0 && item.current === 0);
                const significantDrop = comparativaVia.filter(item => item.prev > 0 && item.current > 0 && item.variation <= -50);

                return (
                  <div key={month} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                    <h3 className="text-xl font-bold text-white capitalize mb-4 flex items-center gap-2 border-b border-gray-700 pb-2">
                      <Calendar className="w-5 h-5 text-pink-500" />
                      {month}
                    </h3>

                    {visibleRows.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-gray-400 border-b border-gray-700">
                              <th className="text-left py-2 px-4">Orquesta</th>
                              <th className="text-right py-2 px-4">Var.</th>
                              <th className="text-center py-2 px-2 text-xs">Detalles</th>
                            </tr>
                          </thead>
                          <tbody>
                            {visibleRows.map((item, idx) => (
                              <tr
                                key={idx}
                                className="border-b border-gray-700/50 hover:bg-gray-700/30 cursor-pointer transition-colors"
                                onClick={() => setSelectedComparativaOrquesta({ name: item.name, month })}
                              >
                                <td className="py-3 px-4 font-medium text-gray-200">{item.name}</td>
                                <td className="py-3 px-4 text-right">
                                  <span className={`font-bold ${item.variation > 0 ? 'text-green-400' :
                                    item.variation < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                                    {item.variation > 0 ? '+' : ''}{item.variation.toFixed(0)}%
                                  </span>
                                </td>
                                <td className="py-3 px-2 text-center">
                                  <span className="text-xs text-blue-400 hover:text-blue-300">
                                    👆 Click
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-4 italic text-sm">
                        No hay orquestas comparables con el año anterior en este mes.
                      </p>
                    )}

                    {(lostAll.length > 0 || significantDrop.length > 0) && (
                      <div className="mt-4 bg-gray-900/80 rounded-lg p-3 border-l-4 border-red-500">
                        <h4 className="text-red-400 font-bold text-xs uppercase mb-2 flex items-center gap-2">
                          <TrendingDown className="w-4 h-4" /> Análisis de Pérdidas
                        </h4>
                        <div className="space-y-2 text-sm">
                          {lostAll.map(item => (
                            <p key={item.name} className="text-gray-300">
                              <span className="font-bold text-white">{item.name}</span> tuvo <span className="text-yellow-400">{item.prev}</span> actuaciones el año pasado pero este mes <span className="text-red-400 font-bold">las ha perdido todas</span>.
                            </p>
                          ))}
                          {significantDrop.map(item => (
                            <p key={item.name} className="text-gray-300">
                              <span className="font-bold text-white">{item.name}</span> ha reducido drásticamente su presencia (de <span className="text-yellow-400">{item.prev}</span> a <span className="text-red-400 font-bold">{item.current}</span>).
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Análisis detallado de comparativa */}
      {selectedComparativaOrquesta && (
        <ComparativaDetailedAnalysis
          orquesta={selectedComparativaOrquesta.name}
          month={selectedComparativaOrquesta.month}
          events={events}
          selectedYear={selectedYear}
          onClose={() => setSelectedComparativaOrquesta(null)}
        />
      )}
    </div>
  );
};

export default Statistics;

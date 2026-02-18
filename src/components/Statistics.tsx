import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { BarChart3, Calendar, Trophy, TrendingUp, TrendingDown, ChevronDown, MousePointerClick, MapPin } from 'lucide-react';
import { Event, OrquestaCount, MonthlyOrquestaCount } from '../types';
import { getRandomColor } from '../utils/helpers';
import { zonasIsla, diasSemana } from '../utils/zones';
import OrquestaAnalysis from './OrquestaAnalysis';
import ComparativaDetailedAnalysis from './ComparativaDetailedAnalysis';
import LoadingSpinner from './LoadingSpinner';
import { getCachedHistoricalStats } from '../utils/dataLoaders';

const Bar = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Bar })));

let historicalData: {
  years: Record<string, {
    orquestaCount: OrquestaCount;
    monthlyOrquestaCount: MonthlyOrquestaCount;
    monthlyEventCount: Record<string, number>;
  }>;
  events: Event[];
} | null = null;

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

interface StatisticsProps {
  events: Event[];
}

const Statistics: React.FC<StatisticsProps> = ({ events }) => {
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [currentYearData, setCurrentYearData] = useState<OrquestaCount>({});
  const [nextYearData, setNextYearData] = useState<OrquestaCount>({});
  const [monthlyData, setMonthlyData] = useState<MonthlyOrquestaCount>({});
  const [monthlyEventCount, setMonthlyEventCount] = useState<{ [month: string]: number }>({});
  const [expandedMonths, setExpandedMonths] = useState<{ [month: string]: boolean }>({});
  const [selectedOrquesta, setSelectedOrquesta] = useState<string | null>(null);
  const [prevYearMonthlyData, setPrevYearMonthlyData] = useState<MonthlyOrquestaCount>({});
  const [prevYearMonthlyEventCount, setPrevYearMonthlyEventCount] = useState<{ [month: string]: number }>({});
  const [selectedComparativaOrquesta, setSelectedComparativaOrquesta] = useState<{ name: string; month: string } | null>(null);
  const [showTotal, setShowTotal] = useState(false);
  const [visibleItems, setVisibleItems] = useState(20);
  const [expandedCompMonth, setExpandedCompMonth] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const showAnalysis = selectedYear < currentYear || (selectedYear === currentYear && currentMonth >= 3);

  const toggleMonth = (month: string) => {
    setExpandedMonths(prev => ({
      ...prev,
      [month]: !prev[month]
    }));
  };

  const availableYears = useMemo(() => {
    if (!dataLoaded) return [new Date().getFullYear()];
    const liveYears = events.map(event => new Date(event.day).getFullYear());
    const staticYears = historicalData ? Object.keys(historicalData.years).map(Number) : [];
    return [...new Set([...liveYears, ...staticYears])].sort((a, b) => b - a);
  }, [events, historicalData, dataLoaded]);

  useEffect(() => {
    const loadAndCalculate = async () => {
      try {
        if (!historicalData) {
          const stats = await getCachedHistoricalStats();
          historicalData = stats as {
            years: Record<string, {
              orquestaCount: OrquestaCount;
              monthlyOrquestaCount: MonthlyOrquestaCount;
              monthlyEventCount: Record<string, number>;
            }>;
            events: Event[];
          };
        }
        setDataLoaded(true);
        calculateStatistics();
      } catch (error) {
        console.error('Error loading statistics data:', error);
        setDataLoaded(true); // Still show UI even if data fails to load
      }
    };

    loadAndCalculate();
  }, [events, selectedYear]);

  const calculateStatistics = () => {
    let currentOrquestaCount: OrquestaCount = {};
    let monthlyOrquestaCount: MonthlyOrquestaCount = {};
    let monthlyEvents: { [month: string]: number } = {};

    let prevMonthlyOrquestaCount: MonthlyOrquestaCount = {};
    let prevMonthlyEvents: { [month: string]: number } = {};

    // 1. Try to load from historical stats first
    const yearStr = selectedYear.toString();
    const prevYearStr = (selectedYear - 1).toString();

    if (historicalData?.years[yearStr]) {
      currentOrquestaCount = historicalData.years[yearStr].orquestaCount;
      monthlyOrquestaCount = historicalData.years[yearStr].monthlyOrquestaCount;
      monthlyEvents = historicalData.years[yearStr].monthlyEventCount;
    }

    if (historicalData?.years[prevYearStr]) {
      prevMonthlyOrquestaCount = historicalData.years[prevYearStr].monthlyOrquestaCount;
      prevMonthlyEvents = historicalData.years[prevYearStr].monthlyEventCount;
    }

    // 2. Process live events if they belong to selected or prev year
    // and are not already fully covered by static data (though we prefer live if available for current/future)
    const nextOrquestaCount: OrquestaCount = {};

    events.forEach(event => {
      if (event.cancelado) return;

      const eventDate = new Date(event.day);
      const eventYear = eventDate.getFullYear();
      const month = eventDate.toLocaleDateString('es-ES', { month: 'long' });
      const orquestas = event.orquesta.split(',').map(orq => orq.trim()).filter(orq => orq !== 'DJ');

      // Only process live events for years NOT in historical stats OR if it's current year+
      if (eventYear === selectedYear && !historicalData?.years[yearStr]) {
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

      if (eventYear === selectedYear - 1 && !historicalData?.years[prevYearStr]) {
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

  const fullSortedOrquestasList = useMemo(() => {
    return Object.entries(currentYearData)
      .sort(([, a], [, b]) => b - a)
      .map(([name, count]) => ({ name, count }));
  }, [currentYearData]);

  const sortedOrquestasList = useMemo(() => {
    return fullSortedOrquestasList.slice(0, 15);
  }, [fullSortedOrquestasList]);

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
      datalabels: {
        color: 'white',
        font: {
          weight: 'bold' as const,
          size: 14
        },
        anchor: 'end' as const,
        align: 'start' as const,
        offset: -4,
        formatter: (value: number) => value,
        textStrokeColor: 'rgba(0,0,0,0.8)',
        textStrokeWidth: 3,
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
  const prevYearForAnalysis = new Date().getFullYear() - 1;

  const selectedOrquestaPosition = selectedOrquesta
    ? fullSortedOrquestasList.findIndex(o => o.name === selectedOrquesta)
    : -1;

  if (!dataLoaded) {
    return <LoadingSpinner size="lg" text="Cargando estadísticas históricas..." />;
  }

  return (
    <div className="space-y-8">
      {/* Year Selection */}
      <div className="flex justify-center">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-1">
          <div className="flex gap-2 bg-gray-900 rounded-lg p-2">
            {availableYears.map(year => (
              <button
                key={year}
                onClick={() => { setSelectedYear(year); setSelectedOrquesta(null); setVisibleItems(20); }}
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
              📊 El análisis detallado estará disponible a partir de abril
            </p>
          )}
        </div>

        <div className="p-3 md:p-6">
          {Object.keys(currentYearData).length > 0 ? (
            <>
              <div className="w-full cursor-pointer" style={{ height: 'calc(100vh - 400px)', minHeight: '400px', maxHeight: '600px' }}>
                <Suspense fallback={<div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}>
                  <Bar data={currentYearChartData} options={chartOptions} />
                </Suspense>
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
                      totalOrquestas={fullSortedOrquestasList}
                      selectedYear={showAnalysis && selectedYear === currentYear ? currentYear : prevYearForAnalysis}
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

      {/* Monthly Selection - Modern Circular Pills */}
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Object.entries(monthlyData)
            .sort(([monthA], [monthB]) => {
              const monthsOrder = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
              return monthsOrder.indexOf(monthA.toLowerCase()) - monthsOrder.indexOf(monthB.toLowerCase());
            })
            .map(([month, orquestas]) => {
              const isSelected = expandedMonths[month];
              const count = monthlyEventCount[month] || 0;

              return (
                <button
                  key={month}
                  onClick={() => {
                    // Toggle: if clicking already selected, close it. If clicking new, open new and close others (Accordion style but single select for cleanliness)
                    setExpandedMonths(prev => {
                      // Exclusive selection for better mobile UX
                      return isSelected ? {} : { [month]: true };
                    });
                  }}
                  className={`
                    relative group flex flex-col items-center justify-center p-4 rounded-3xl transition-all duration-300 border
                    ${isSelected
                      ? 'bg-blue-600 border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.5)] scale-105 z-10'
                      : 'bg-gradient-to-br from-gray-800 to-gray-900 border-white/20 shadow-lg hover:border-blue-400/50 hover:from-gray-700 hover:to-gray-800 hover:scale-110 hover:shadow-blue-500/20'
                    }
                  `}
                >
                  <span className={`text-lg font-bold capitalize mb-1 transition-colors ${isSelected ? 'text-white' : 'text-gray-200 group-hover:text-white'}`}>
                    {month}
                  </span>

                  <div className={`
                    flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors
                    ${isSelected ? 'bg-white/20 text-white' : 'bg-black/40 text-gray-300 group-hover:text-white'}
                  `}>
                    <Calendar className="w-3 h-3" />
                    {count}
                  </div>

                  {/* Active Indicator Dot */}
                  {isSelected && (
                    <span className="absolute -bottom-2 w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                  )}
                </button>
              );
            })}
        </div>

        {/* Active Month Detail View - Animate in */}
        {Object.entries(expandedMonths).map(([month, isExpanded]) => {
          if (!isExpanded) return null;

          const orquestas = monthlyData[month];
          const sortedOrquestas = Object.entries(orquestas).sort(([, a], [, b]) => b - a);

          return (
            <div key={month} className="animate-fadeInUp">
              <div className="bg-gray-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
                {/* Header of Detail Card */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white capitalize flex items-center gap-3">
                    <span className="text-4xl">{month.substring(0, 1).toUpperCase()}</span>
                    <span className="text-gray-400">{month.substring(1)}</span>
                  </h3>
                  <button
                    onClick={() => setExpandedMonths({})}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                  >
                    <ChevronDown className="w-6 h-6 rotate-180" />
                  </button>
                </div>

                {/* Content Grid */}
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {sortedOrquestas.map(([orquesta, count], index) => (
                      <div
                        key={orquesta}
                        className="flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group/item"
                      >
                        <div className="flex items-center gap-4 overflow-hidden">
                          <div className={`
                             w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full text-sm font-bold shadow-lg
                             ${index < 3
                              ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-black'
                              : 'bg-gray-800 text-gray-500 border border-white/5'
                            }
                           `}>
                            {index + 1}
                          </div>
                          <span className="text-gray-300 font-medium truncate group-hover/item:text-white transition-colors">
                            {orquesta}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ranking Total (Collapsible) */}
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl overflow-hidden mt-12 border border-white/5">
        <button
          onClick={() => { setShowTotal(!showTotal); setVisibleItems(20); }}
          className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 transition-all duration-300 group"
        >
          <div className="flex items-center gap-3 flex-wrap">
            <Trophy className="w-8 h-8 text-yellow-500 group-hover:scale-110 transition-transform" />
            <h2 className="text-2xl font-bold text-white">Ranking Completo {selectedYear}</h2>
            <div className="flex items-center gap-2">
              <span className="text-sm font-normal text-gray-400 bg-black/40 px-3 py-1 rounded-full border border-white/10">
                {fullSortedOrquestasList.length} formaciones
              </span>
              <span className="text-sm font-normal text-gray-400 bg-black/40 px-3 py-1 rounded-full border border-white/10">
                {Object.values(monthlyEventCount).reduce((a, b) => a + b, 0)} eventos
              </span>
            </div>
          </div>
          <ChevronDown className={`w-6 h-6 text-gray-400 transition-transform duration-500 ${showTotal ? 'rotate-180' : ''}`} />
        </button>

        {showTotal && (
          <div className="p-6 animate-fadeIn">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
              {fullSortedOrquestasList.slice(0, visibleItems).map((item, index) => (
                <div
                  key={item.name}
                  onClick={() => {
                    setSelectedOrquesta(prev => prev === item.name ? null : item.name);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && (() => {
                    setSelectedOrquesta(prev => prev === item.name ? null : item.name);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  })()}
                  role="button"
                  tabIndex={0}
                  className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-white/5 hover:bg-white/10 hover:border-blue-500/30 transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2 overflow-hidden min-w-0">
                    <span className={`
                                    w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-md text-[10px] sm:text-xs font-bold
                                    ${index < 3 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        index < 10 ? 'bg-white/10 text-white' : 'text-gray-500 bg-black/20'}
                                `}>
                      #{index + 1}
                    </span>
                    <span className="text-gray-300 text-xs sm:text-sm font-medium truncate group-hover:text-white transition-colors" title={item.name}>
                      {item.name}
                    </span>
                  </div>
                  <span className="ml-2 text-[10px] sm:text-xs font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 flex-shrink-0">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>

            {visibleItems < fullSortedOrquestasList.length && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setVisibleItems(prev => prev + 20)}
                  className="px-6 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-full font-medium transition-colors border border-gray-700 shadow-lg flex items-center gap-2"
                >
                  <ChevronDown className="w-4 h-4" />
                  Ver más orquestas
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Comparativa Interanual */}
      {(() => {
        const monthsOrder = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
        const currentMonthIndex = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const monthsToRender = monthsOrder.filter((month, index) => {
          const hasCurrentData = monthlyData[month] && Object.keys(monthlyData[month]).length > 0;
          const hasPrevData = prevYearMonthlyData[month] && Object.keys(prevYearMonthlyData[month]).length > 0;

          const isPastOrCurrent = selectedYear < currentYear || index <= currentMonthIndex;
          return (hasCurrentData || hasPrevData) && isPastOrCurrent;
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

            <div className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                {monthsToRender.map(month => {
                  const isExpanded = expandedCompMonth === month;
                  const currentData = monthlyData[month] || {};
                  const prevData = prevYearMonthlyData[month] || {};
                  const allOrquestas = new Set([...Object.keys(currentData), ...Object.keys(prevData)]);
                  const count = allOrquestas.size;

                  return (
                    <button
                      key={month}
                      onClick={() => setExpandedCompMonth(isExpanded ? null : month)}
                      className={`
                        relative group flex flex-col items-center justify-center p-4 rounded-3xl transition-all duration-300 border
                        ${isExpanded
                          ? 'bg-pink-600 border-pink-400 shadow-[0_0_20px_rgba(219,39,119,0.5)] scale-105 z-10'
                          : 'bg-gradient-to-br from-gray-800 to-gray-900 border-white/20 shadow-lg hover:border-pink-400/50 hover:from-gray-700 hover:to-gray-800 hover:scale-110 hover:shadow-pink-500/20'
                        }
                      `}
                    >
                      <span className={`text-lg font-bold capitalize mb-1 transition-colors ${isExpanded ? 'text-white' : 'text-gray-200 group-hover:text-white'}`}>
                        {month}
                      </span>

                      <div className={`
                        flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors
                        ${isExpanded ? 'bg-white/20 text-white' : 'bg-black/40 text-gray-300 group-hover:text-white'}
                      `}>
                        <TrendingUp className="w-3 h-3" />
                        {count}
                      </div>

                      {isExpanded && (
                        <span className="absolute -bottom-2 w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>

              {monthsToRender.map(month => {
                if (expandedCompMonth !== month) return null;

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

                const visibleRows = comparativaVia.filter(item => item.prev > 0 || item.current > 0);
                const lostAll = comparativaVia.filter(item => item.prev > 0 && item.current === 0);
                const significantDrop = comparativaVia.filter(item => item.prev > 0 && item.current > 0 && item.variation <= -50);

                return (
                  <div key={month} className="bg-gray-800/50 rounded-2xl p-6 border border-white/10 animate-fadeInUp">
                    <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                      <h3 className="text-2xl font-bold text-white capitalize flex items-center gap-3">
                        <Calendar className="w-6 h-6 text-pink-500" />
                        {month}
                      </h3>
                      <button
                        onClick={() => setExpandedCompMonth(null)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                      >
                        <ChevronDown className="w-6 h-6 rotate-180" />
                      </button>
                    </div>

                    {visibleRows.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-gray-400 border-b border-white/10 shadow-sm">
                              <th className="text-left py-3 px-4 font-bold uppercase tracking-wider text-xs">Orquesta</th>
                              <th className="text-right py-3 px-4 font-bold uppercase tracking-wider text-xs">Variación</th>
                              <th className="text-center py-3 px-2 font-bold uppercase tracking-wider text-xs">Acción</th>
                            </tr>
                          </thead>
                          <tbody>
                            {visibleRows.map((item) => (
                              <tr
                                key={item.name}
                                className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-all duration-200 group/row"
                                onClick={() => setSelectedComparativaOrquesta({ name: item.name, month })}
                              >
                                <td className="py-4 px-4 font-semibold text-gray-100 group-hover/row:text-white">{item.name}</td>
                                <td className="py-4 px-4 text-right">
                                  <span className={`px-3 py-1 rounded-full text-xs font-black shadow-sm ${item.variation > 0 ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                    item.variation < 0 ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                                    }`}>
                                    {item.variation > 0 ? '+' : ''}{item.variation.toFixed(0)}%
                                  </span>
                                </td>
                                <td className="py-4 px-2 text-center">
                                  <div className="flex items-center justify-center gap-1 text-pink-400 group-hover/row:text-pink-300 transition-colors">
                                    <MousePointerClick className="w-4 h-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-tighter">Detalles</span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-black/20 rounded-2xl border border-white/5">
                        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                        <p className="text-gray-400 italic">No hay orquestas comparables para este mes.</p>
                      </div>
                    )}

                    {(lostAll.length > 0 || significantDrop.length > 0) && (
                      <div className="mt-8 bg-gradient-to-br from-red-950/40 to-black/40 rounded-2xl p-6 border border-red-500/20 shadow-xl">
                        <h4 className="text-red-400 font-black text-sm uppercase mb-4 flex items-center gap-2">
                          <TrendingDown className="w-5 h-5" /> REPORTE DE INCIDENCIAS
                        </h4>
                        <div className="space-y-3">
                          {lostAll.map(item => (
                            <div key={item.name} className="flex gap-3 text-sm items-start bg-black/20 p-3 rounded-lg border border-white/5">
                              <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                              <p className="text-gray-300 leading-relaxed">
                                <span className="font-bold text-white">{item.name}</span> tuvo <span className="text-pink-400 font-bold">{item.prev}</span> actuaciones el año pasado pero este mes <span className="text-red-500 font-extrabold underline decoration-red-500/50">ha desaparecido del mapa</span>.
                              </p>
                            </div>
                          ))}
                          {significantDrop.map(item => (
                            <div key={item.name} className="flex gap-3 text-sm items-start bg-black/20 p-3 rounded-lg border border-white/5">
                              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 flex-shrink-0" />
                              <p className="text-gray-300 leading-relaxed">
                                <span className="font-bold text-white">{item.name}</span> ha sufrido una caída crítica (de <span className="text-pink-400 font-bold">{item.prev}</span> a <span className="text-red-400 font-bold">{item.current}</span>).
                              </p>
                            </div>
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

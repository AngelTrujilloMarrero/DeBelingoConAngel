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
import { BarChart3, Calendar, Trophy, TrendingUp, ChevronDown, ChevronUp, MousePointerClick } from 'lucide-react';
import { Event, OrquestaCount, MonthlyOrquestaCount } from '../types';
import { getRandomColor } from '../utils/helpers';
import OrquestaAnalysis from './OrquestaAnalysis';

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

  // Determinar si debemos mostrar el análisis detallado (solo desde junio en adelante)
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth(); // 0 = enero, 11 = diciembre
  const currentYear = currentDate.getFullYear();

  // Mostrar análisis solo si:
  // 1. Estamos en junio (mes 5) o posterior del año actual, O
  // 2. Estamos viendo años anteriores al actual
  const showAnalysis = selectedYear < currentYear || (selectedYear === currentYear && currentMonth >= 5);

  const toggleMonth = (month: string) => {
    setExpandedMonths(prev => ({
      ...prev,
      [month]: !prev[month]
    }));
  };

  // Get available years
  const availableYears = [...new Set(events.map(event => new Date(event.day).getFullYear()))].sort((a, b) => b - a);

  useEffect(() => {
    calculateStatistics();
  }, [events, selectedYear]);

  const calculateStatistics = () => {
    const currentOrquestaCount: OrquestaCount = {};
    const nextOrquestaCount: OrquestaCount = {};
    const monthlyOrquestaCount: MonthlyOrquestaCount = {};
    const monthlyEvents: { [month: string]: number } = {};

    events.forEach(event => {
      if (event.cancelado) return;

      const eventDate = new Date(event.day);
      const eventYear = eventDate.getFullYear();
      const month = eventDate.toLocaleDateString('es-ES', { month: 'long' });

      if (eventYear === selectedYear) {
        // Contar eventos por mes
        monthlyEvents[month] = (monthlyEvents[month] || 0) + 1;

        const orquestas = event.orquesta.split(',').map(orq => orq.trim());
        orquestas.forEach(orq => {
          if (orq === 'DJ') return; // Excluir "DJ"

          currentOrquestaCount[orq] = (currentOrquestaCount[orq] || 0) + 1;

          if (!monthlyOrquestaCount[month]) {
            monthlyOrquestaCount[month] = {};
          }
          monthlyOrquestaCount[month][orq] = (monthlyOrquestaCount[month][orq] || 0) + 1;
        });
      }

      if (eventYear === selectedYear + 1) {
        const orquestas = event.orquesta.split(',').map(orq => orq.trim());
        orquestas.forEach(orq => {
          if (orq === 'DJ') return; // Excluir "DJ"
          nextOrquestaCount[orq] = (nextOrquestaCount[orq] || 0) + 1;
        });
      }
    });

    setCurrentYearData(currentOrquestaCount);
    setNextYearData(nextOrquestaCount);
    setMonthlyData(monthlyOrquestaCount);
    setMonthlyEventCount(monthlyEvents);
  };

  // Lista ordenada de orquestas para el análisis
  const sortedOrquestasList = useMemo(() => {
    return Object.entries(currentYearData)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([name, count]) => ({ name, count }));
  }, [currentYearData]);

  const createChartData = (data: OrquestaCount) => {
    const sortedData = Object.entries(data)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15); // Show top 15

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
      // Solo permitir clic si showAnalysis es true
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
          font: {
            size: 12,
          },
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
        ticks: {
          color: 'white',
          padding: 8,
          font: {
            size: 11,
          },
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false,
        },
      },
      x: {
        ticks: {
          color: 'white',
          maxRotation: window.innerWidth < 768 ? 90 : 45,
          minRotation: window.innerWidth < 768 ? 45 : 0,
          padding: 8,
          font: {
            size: window.innerWidth < 768 ? 9 : 11,
          },
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false,
        },
      },
    },
    layout: {
      padding: {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10,
      },
    },
  };

  const currentYearChartData = createChartData(currentYearData);
  const nextYearChartData = createChartData(nextYearData);

  // Obtener posición de la orquesta seleccionada
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
                onClick={() => {
                  setSelectedYear(year);
                  setSelectedOrquesta(null);
                }}
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

              {/* Top 15 Clickable List - Solo mostrar si showAnalysis es true */}
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

                  {/* Análisis de la orquesta seleccionada */}
                  {selectedOrquesta && selectedOrquestaPosition >= 0 && (
                    <OrquestaAnalysis
                      orquesta={selectedOrquesta}
                      events={events}
                      position={selectedOrquestaPosition}
                      totalOrquestas={sortedOrquestasList}
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

      {/* Next Year Statistics */}
      {Object.keys(nextYearData).length > 0 && (
        <div className="bg-gradient-to-br from-purple-900 via-indigo-800 to-purple-900 rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white text-center flex items-center justify-center gap-3">
              <Calendar className="w-8 h-8" />
              Estadísticas {selectedYear + 1}
              <Trophy className="w-8 h-8" />
            </h2>
          </div>

          <div className="p-3 md:p-6">
            <div className="w-full" style={{ height: 'calc(100vh - 400px)', minHeight: '400px', maxHeight: '600px' }}>
              <Bar data={nextYearChartData} options={chartOptions} />
            </div>
          </div>
        </div>
      )}

      {/* Monthly Tables */}
      <div className="space-y-8">
        {Object.entries(monthlyData)
          .sort(([monthA], [monthB]) => {
            const monthsOrder = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
            return monthsOrder.indexOf(monthA.toLowerCase()) - monthsOrder.indexOf(monthB.toLowerCase());
          })
          .map(([month, orquestas]) => {
            const sortedOrquestas = Object.entries(orquestas).sort(([, a], [, b]) => b - a);
            const totalActuacionesMes = sortedOrquestas.reduce((sum, [, count]) => sum + count, 0);
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
                            <tr
                              key={orquesta}
                              className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                                } hover:bg-blue-50 transition-colors duration-200`}
                            >
                              <td className="px-6 py-4 text-gray-800 font-medium">{orquesta}</td>
                              <td className="px-6 py-4 text-center">
                                <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full font-bold">
                                  {count}
                                </span>
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
    </div>
  );
};

export default Statistics;

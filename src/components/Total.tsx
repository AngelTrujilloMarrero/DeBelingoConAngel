import React, { useState, useMemo } from 'react';
import { Event } from '../types';
import { BarChart3, TrendingUp, Calendar } from 'lucide-react';

interface TotalProps {
  events: Event[];
}

const Total: React.FC<TotalProps> = ({ events }) => {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Obtener años disponibles de los eventos
  const availableYears = useMemo(() => {
    return [...new Set(events.map(event => new Date(event.day).getFullYear()))].sort((a, b) => b - a);
  }, [events]);

  const yearStats = useMemo(() => {
    const orquestaCount: { [orquesta: string]: number } = {};
    let eventCount = 0;

    events.forEach(event => {
      if (event.cancelado) return;

      const eventYear = new Date(event.day).getFullYear();

      if (eventYear === selectedYear) {
        eventCount++;
        const orquestas = event.orquesta.split(',').map(orq => orq.trim());
        orquestas.forEach(orq => {
          if (orq && orq !== 'DJ') {
            orquestaCount[orq] = (orquestaCount[orq] || 0) + 1;
          }
        });
      }
    });

    const sortedOrquestas = Object.entries(orquestaCount)
      .sort(([, a], [, b]) => b - a);

    return { sortedOrquestas, eventCount };
  }, [events, selectedYear]);

  return (
    <div className="space-y-6">
      {/* Year Selection */}
      <div className="flex justify-center">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-1">
          <div className="flex gap-2 bg-gray-900 rounded-lg p-2">
            {availableYears.map(year => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
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

      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
          <h2 className="text-2xl md:text-3xl font-bold text-white text-center flex items-center justify-center gap-3">
            <BarChart3 className="w-8 h-8" />
            Total de Actuaciones {selectedYear}
            <TrendingUp className="w-8 h-8" />
          </h2>
        </div>

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
                {yearStats.sortedOrquestas.map(([orquesta, count], index) => (
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
          <div className="mt-6 text-center">
            <p className="text-white text-lg font-bold flex items-center justify-center gap-2">
              <Calendar className="w-6 h-6" />
              Total de verbenas en {selectedYear}:
              <span className="text-2xl text-yellow-400">{yearStats.eventCount}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Total;

import React from 'react';
import { Eye, Zap } from 'lucide-react';
import { useVisitCounter } from '../hooks/useVisitCounter';

const VisitCounter: React.FC = () => {
  const { visitCount, dailyCount } = useVisitCounter();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 w-fit mx-auto">
      {/* Lifetime Visits */}
      <div className="bg-gray-900/60 backdrop-blur-md border border-gray-700/50 rounded-full px-6 py-2.5 flex items-center justify-center gap-3 shadow-xl hover:bg-gray-800/60 transition-all duration-300 hover:scale-[1.03]">
        <Eye className="w-4.5 h-4.5 text-emerald-400 animate-pulse" />
        <div className="flex items-baseline gap-1.5">
          <span className="text-gray-100 font-black font-mono text-base tracking-tight">
            {visitCount.toLocaleString('es-ES')}
          </span>
          <span className="text-gray-400 text-[10px] uppercase tracking-widest font-black">
            Visitas Totales
          </span>
        </div>
      </div>

      {/* Daily Visits */}
      <div className="bg-gray-900/60 backdrop-blur-md border border-gray-700/50 rounded-full px-6 py-2.5 flex items-center justify-center gap-3 shadow-xl hover:bg-gray-800/60 transition-all duration-300 hover:scale-[1.03]">
        <Zap className="w-4.5 h-4.5 text-indigo-400 animate-bounce-slow" />
        <div className="flex items-baseline gap-1.5">
          <span className="text-gray-100 font-black font-mono text-base tracking-tight">
            {dailyCount.toLocaleString('es-ES')}
          </span>
          <span className="text-gray-400 text-[10px] uppercase tracking-widest font-black">
            Visitas Hoy
          </span>
        </div>
      </div>
    </div>
  );
};

export default VisitCounter;

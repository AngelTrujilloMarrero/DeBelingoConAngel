import React from 'react';
import { NavLink } from 'react-router-dom';
import { Search } from 'lucide-react';

interface NavigationProps {
  onSearchClick: () => void;
  searchTerm: string;
}

const Navigation: React.FC<NavigationProps> = ({ onSearchClick, searchTerm }) => {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-[11px] sm:text-sm md:text-base font-semibold px-2 py-1.5 md:px-4 md:py-2 rounded-full transition-all duration-300 whitespace-nowrap ${isActive
      ? 'bg-white/30 shadow-lg'
      : 'hover:bg-white/20'
    }`;

  return (
    <nav className="bg-black/10 backdrop-blur-[2px] p-1 md:p-2 rounded-full max-w-[95vw] sm:max-w-full overflow-x-auto no-scrollbar">
      <div className="px-1 sm:px-4">
        <div className="flex justify-start sm:justify-center items-center flex-nowrap gap-1 sm:gap-2">
          <NavLink to="/" className={navLinkClass}>Eventos</NavLink>
          <NavLink to="/mapa" className={navLinkClass}>Mapa</NavLink>
          <NavLink to="/estadisticas" className={navLinkClass}>Estadísticas</NavLink>
          <NavLink to="/formaciones" className={navLinkClass}>Formaciones</NavLink>
          <NavLink to="/redes" className={navLinkClass}>Biografía</NavLink>
          
          <button 
            onClick={onSearchClick}
            className={`flex items-center justify-center p-1.5 sm:p-2 rounded-full transition-all duration-300 hover:bg-white/20 ml-1 ${searchTerm ? 'text-blue-400 bg-blue-500/10' : 'text-white'}`}
            aria-label="Buscar eventos"
          >
            <Search className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
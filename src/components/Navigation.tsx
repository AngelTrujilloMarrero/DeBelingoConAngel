import React from 'react';
import { NavLink } from 'react-router-dom';

const Navigation: React.FC = () => {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-[9px] min-[380px]:text-[10px] sm:text-sm md:text-base font-bold px-1 min-[380px]:px-1.5 py-1 md:px-4 md:py-2 rounded-full transition-all duration-300 whitespace-nowrap ${isActive
      ? 'bg-white/30 shadow-lg'
      : 'hover:bg-white/20'
    }`;

  return (
    <nav className="bg-black/10 backdrop-blur-[2px] p-0.5 min-[380px]:p-1 md:p-2 rounded-full max-w-full overflow-hidden">
      <div className="px-0 sm:px-4">
        <div className="flex justify-center items-center flex-nowrap gap-0 min-[380px]:gap-0.5 sm:gap-2">
          <NavLink to="/" className={navLinkClass}>Eventos</NavLink>
          <NavLink to="/mapa" className={navLinkClass}>Mapa</NavLink>
          <NavLink to="/estadisticas" className={navLinkClass}>Estadísticas</NavLink>
          <NavLink to="/formaciones" className={navLinkClass}>
            <span className="hidden sm:inline">Formaciones</span>
            <span className="sm:hidden">Bandas</span>
          </NavLink>
          <NavLink to="/redes" className={navLinkClass}>Biografía</NavLink>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
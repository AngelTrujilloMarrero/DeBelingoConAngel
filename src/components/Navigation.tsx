import React from 'react';
import { NavLink } from 'react-router-dom';

const Navigation: React.FC = () => {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-xs sm:text-sm md:text-base font-semibold px-2 py-1.5 md:px-4 md:py-2 rounded-full transition-all duration-300 whitespace-nowrap ${isActive
      ? 'bg-white/30 shadow-lg'
      : 'hover:bg-white/20'
    }`;

  return (
    <nav className="bg-black/10 backdrop-blur-[2px] p-1.5 md:p-2 rounded-full max-w-full overflow-x-auto">
      <div className="px-1 sm:px-4">
        <div className="flex justify-center items-center flex-wrap gap-1 sm:gap-2">
          <NavLink to="/" className={navLinkClass}>Eventos</NavLink>
          <NavLink to="/mapa" className={navLinkClass}>Mapa</NavLink>
          <NavLink to="/estadisticas" className={navLinkClass}>Estadísticas</NavLink>
          <NavLink to="/formaciones" className={navLinkClass}>Formaciones</NavLink>
          <NavLink to="/blog" className={navLinkClass}>Blog</NavLink>
          <NavLink to="/redes" className={navLinkClass}>Redes&Bio</NavLink>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
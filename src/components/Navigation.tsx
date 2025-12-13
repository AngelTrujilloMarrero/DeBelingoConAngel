import React from 'react';
import { NavLink } from 'react-router-dom';

const Navigation: React.FC = () => {
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-white font-semibold px-3 py-2 rounded-full transition-all duration-300 ${isActive
      ? 'bg-white/30 shadow-lg'
      : 'hover:bg-white/20'
    }`;

  return (
    <nav className="bg-black/10 backdrop-blur-[2px] p-2 rounded-full">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex justify-center items-center flex-wrap h-auto space-x-1 sm:space-x-2">
          <NavLink to="/" className={navLinkClass}>Eventos</NavLink>
          <NavLink to="/mapa" className={navLinkClass}>Mapa</NavLink>
          <NavLink to="/estadisticas" className={navLinkClass}>Estadísticas</NavLink>
          <NavLink to="/formaciones" className={navLinkClass}>Formaciones</NavLink>
          <NavLink to="/total" className={navLinkClass}>Total</NavLink>
          <NavLink to="/redes" className={navLinkClass}>Redes&Bio</NavLink>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
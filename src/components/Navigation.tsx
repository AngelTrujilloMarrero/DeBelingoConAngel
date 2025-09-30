import React from 'react';

const Navigation: React.FC = () => {
  return (
    <nav className="bg-black bg-opacity-20 backdrop-blur-sm p-2 mt-4 rounded-full">
      <div className="container mx-auto px-4">
        <div className="flex justify-center items-center h-12 space-x-2">
          <a href="#events" className="text-white hover:bg-white/20 font-semibold px-4 py-2 rounded-full transition-all duration-300">Eventos</a>
          <a href="#map" className="text-white hover:bg-white/20 font-semibold px-4 py-2 rounded-full transition-all duration-300">Mapa</a>
          <a href="#stats" className="text-white hover:bg-white/20 font-semibold px-4 py-2 rounded-full transition-all duration-300">Estadísticas</a>
          <a href="#analyzer" className="text-white hover:bg-white/20 font-semibold px-4 py-2 rounded-full transition-all duration-300">Analizador</a>
          <a href="#social" className="text-white hover:bg-white/20 font-semibold px-4 py-2 rounded-full transition-all duration-300">Redes</a>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
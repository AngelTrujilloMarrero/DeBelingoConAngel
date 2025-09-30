import React from 'react';

const Navigation: React.FC = () => {
  return (
    <nav className="sticky top-0 bg-white/80 backdrop-blur-md shadow-md z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-center items-center h-16 space-x-4">
          <a href="#events" className="text-gray-600 hover:text-blue-600 font-semibold px-3 py-2 rounded-md transition-colors duration-300">Eventos</a>
          <a href="#map" className="text-gray-600 hover:text-blue-600 font-semibold px-3 py-2 rounded-md transition-colors duration-300">Mapa</a>
          <a href="#stats" className="text-gray-600 hover:text-blue-600 font-semibold px-3 py-2 rounded-md transition-colors duration-300">Estadísticas</a>
          <a href="#analyzer" className="text-gray-600 hover:text-blue-600 font-semibold px-3 py-2 rounded-md transition-colors duration-300">Analizador</a>
          <a href="#social" className="text-gray-600 hover:text-blue-600 font-semibold px-3 py-2 rounded-md transition-colors duration-300">Redes</a>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
import React from 'react';
import { Instagram, Facebook, MessageCircle, Send } from 'lucide-react';
import DBCALogo from './DBCALogo';
import Navigation from './Navigation';

const Header: React.FC = () => {
  return (
    <header
      className="sticky top-0 z-50 text-white shadow-lg flex flex-col justify-center items-center blurred-bg cursor-default"
      style={{
        maxHeight: '35vh',
        backgroundSize: '200% 200%',
        animation: 'background-pan 10s ease infinite'
      }}
    >
      <div className="relative container mx-auto px-4 text-center flex flex-col justify-center h-full">
        {/* Top section with Logo and Social Icons */}
        <div className="flex items-center justify-center gap-4 md:gap-6 w-full">
          <div className="hidden md:flex items-center gap-2">
            <a href="https://www.instagram.com/debelingoconangel/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110">
              <Instagram className="w-5 h-5 text-white" />
            </a>
            <a href="https://www.facebook.com/debelingoconangel/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110">
              <Facebook className="w-5 h-5 text-white" />
            </a>
          </div>

          <div className="transform scale-75 md:scale-90 -my-2 md:my-0">
            <DBCALogo />
          </div>

          <div className="hidden md:flex items-center gap-2">
            <a href="https://www.whatsapp.com/channel/0029Va8nc2A77qVZokI0aC2K" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110">
              <MessageCircle className="w-5 h-5 text-white" />
            </a>
            <a href="https://t.me/debelingoconangel" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110">
              <Send className="w-5 h-5 text-white" />
            </a>
          </div>
        </div>

        {/* Main Title & Subtitle */}
        <div className="hidden md:block my-1">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-orbitron gradient-text">
            DE BELINGO CON ÁNGEL
          </h1>
          <p className="text-lg md:text-xl font-semibold text-blue-100 animate-fade-in">
            Verbenas en Tenerife
          </p>
        </div>

        {/* Navigation is now inside the flex container */}
        <div className="w-full mt-auto">
          <Navigation />
        </div>

        {/* Decorative elements are removed to save space */}
      </div>

      {/* Bottom gradient is removed as it's not needed with the new structure */}
    </header>
  );
};

export default Header;

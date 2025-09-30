import React from 'react';
import { Music, Guitar, Instagram, Facebook, MessageCircle, Send } from 'lucide-react';
import DBCALogo from './DBCALogo';
import Navigation from './Navigation';

const Header: React.FC = () => {
  return (
    <header className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 text-white py-8">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-pulse"></div>
      </div>
      
      <div className="relative container mx-auto px-4 text-center">
        {/* Logo Section */}
        <div className="flex items-center justify-center gap-6 mb-4">
          {/* Left Social Icons */}
          <div className="hidden md:flex items-center gap-2">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <Instagram className="w-6 h-6 text-white" />
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
              <Facebook className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Central Logo DBCA */}
          <DBCALogo />

          {/* Right Social Icons */}
          <div className="hidden md:flex items-center gap-2">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center shadow-lg">
              <Send className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Main Title */}
        <div className="mb-2">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-yellow-300 via-orange-300 to-yellow-300 bg-clip-text text-transparent animate-pulse">
            DE BELINGO CON ÁNGEL
          </h1>
        </div>
        
        <div className="text-xl md:text-2xl font-semibold text-blue-100 animate-fade-in">
          Verbenas en Tenerife
        </div>
        
        {/* Decorative elements */}
        <div className="mt-4 flex justify-center space-x-2">
          <div className="w-2 h-2 bg-yellow-300 rounded-full animate-ping"></div>
          <div 
            className="w-2 h-2 bg-orange-300 rounded-full animate-ping" 
            style={{ animationDelay: '0.2s' }}
          ></div>
          <div 
            className="w-2 h-2 bg-yellow-300 rounded-full animate-ping" 
            style={{ animationDelay: '0.4s' }}
          ></div>
        </div>

        {/* Mobile Social Icons */}
        <div className="md:hidden flex justify-center gap-3 mt-4">
          <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
            <Instagram className="w-4 h-4 text-white" />
          </div>
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
            <Facebook className="w-4 h-4 text-white" />
          </div>
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center relative">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
          <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center">
            <Send className="w-4 h-4 text-white" />
          </div>
        </div>
      </div>
      
      {/* Bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-gray-50 to-transparent"></div>
      <Navigation />
    </header>
  );
};

export default Header;

import React, { useRef, useEffect } from 'react';
import { Instagram, Facebook, MessageCircle, Send } from 'lucide-react';
import DBCALogo from './DBCALogo';
import Navigation from './Navigation';

const Header: React.FC = () => {
  const headerRef = useRef<HTMLElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <header
      ref={headerRef}
      onMouseMove={handleMouseMove}
      className="sticky top-0 z-50 text-white shadow-lg flex flex-col justify-center items-center cursor-default group transition-all duration-300 bg-[#001f3f] overflow-hidden"
    >
      {/* Background Layers - Optimized */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Base Image with subtle overlay */}
        <div
          className="absolute inset-0 bg-[url('/eltablero.jpg')] bg-cover bg-center opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
      </div>

      {/* Spotlight Effect (Optimized with transform) */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div
          className="absolute w-[800px] h-[800px] -left-[400px] -top-[400px]"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
            transform: 'translate3d(var(--mouse-x), var(--mouse-y), 0)',
            willChange: 'transform',
            zIndex: 5
          }}
        />
      </div>

      <div className="relative container mx-auto px-4 text-center flex flex-col justify-between z-10 py-4 lg:py-6 gap-3 lg:gap-5">
        {/* Top section with Logo and Social Icons */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 lg:gap-8 w-full relative">

          <div className="flex items-center gap-2 sm:gap-6 md:gap-8 lg:gap-12">
            {/* Social Icons Left Group */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              <a href="https://www.instagram.com/debelingoconangel/" target="_blank" rel="noopener noreferrer" className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110">
                <Instagram className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />
              </a>
              <a href="https://www.facebook.com/debelingoconangel/" target="_blank" rel="noopener noreferrer" className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110">
                <Facebook className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />
              </a>
            </div>

            {/* Logo Grouped in the middle of icons */}
            <div className="transform scale-[0.45] xs:scale-[0.5] sm:scale-[0.55] md:scale-[0.65] lg:scale-[0.75] transition-transform duration-300 -my-4 sm:-my-4 md:-my-5 relative z-20">
              <DBCALogo />
            </div>

            {/* Social Icons Right Group */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              <a href="https://www.whatsapp.com/channel/0029Va8nc2A77qVZokI0aC2K" target="_blank" rel="noopener noreferrer" className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110">
                <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />
              </a>
              <a href="https://t.me/debelingoconangel" target="_blank" rel="noopener noreferrer" className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110">
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-white" />
              </a>
            </div>
          </div>
        </div>

        {/* Group Title and Navigation */}
        <div className="w-full flex flex-col items-center gap-2 md:gap-3">
          {/* Main Title & Subtitle */}
          <div className="hidden md:block">
            <h1 className="text-xl md:text-2xl lg:text-4xl font-bold font-orbitron tracking-widest transform scale-x-110 origin-center inline-block group/text cursor-pointer transition-transform duration-300 hover:scale-125 py-2 perspective-[1000px]">
              {"DE BELINGO CON ÁNGEL".split('').map((char, index) => (
                <span
                  key={index}
                  className="gradient-text-wave group-hover/text:animate-[wave_1s_ease-in-out_infinite]"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
            </h1>
            <p className="text-sm md:text-base lg:text-lg font-semibold text-blue-100 animate-fade-in mt-1">
              Verbenas en Tenerife
            </p>
          </div>

          {/* Navigation */}
          <div className="w-full flex justify-center">
            <Navigation />
          </div>
        </div>

        {/* Decorative elements are removed to save space */}
      </div>

      {/* Bottom gradient is removed as it's not needed with the new structure */}
    </header>
  );
};

export default Header;

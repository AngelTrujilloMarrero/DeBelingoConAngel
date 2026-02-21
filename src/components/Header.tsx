import React, { useRef, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Instagram, MessageCircle } from 'lucide-react';
import Navigation from './Navigation';

const Header: React.FC = () => {
  const headerRef = useRef<HTMLElement>(null);
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const isDynamicHeaderPage = location.pathname === '/' || location.pathname.startsWith('/blog');

  useEffect(() => {
    if (!isDynamicHeaderPage) {
      setIsScrolled(false);
      return;
    }

    const handleScroll = () => {
      const scrollPos = window.scrollY;

      if (scrollPos > 150) {
        if (!isScrolled) setIsScrolled(true);
      } else if (scrollPos < 30) {
        if (isScrolled) setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isScrolled, isDynamicHeaderPage]);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  // Header sizing logic
  // Full: isEventosPage && !isScrolled
  // Compact (Auto-compress): isEventosPage && isScrolled
  // Reduced (30% less): !isEventosPage

  // Header sizing logic - Final 20% reduction
  const headerClasses = isDynamicHeaderPage
    ? (isScrolled ? 'py-1 backdrop-blur-md bg-[#001f3f]/90' : 'py-1.5 lg:py-3')
    : 'py-1 lg:py-1 bg-[#001f3f]/95';

  return (
    <header
      ref={headerRef}
      onMouseMove={handleMouseMove}
      className={`sticky top-0 z-50 text-white shadow-xl flex flex-col justify-center items-center cursor-default group transition-all duration-500 ease-in-out bg-[#001f3f] ${isDynamicHeaderPage ? '' : 'rounded-b-[32px] md:rounded-b-[48px]'} ${headerClasses}`}
      style={{ overflow: 'visible' }}
    >
      {/* Background Layers - Optimized */}
      <div className={`absolute inset-0 pointer-events-none overflow-hidden ${isDynamicHeaderPage ? '' : 'rounded-b-[32px] md:rounded-b-[48px]'}`}>
        <div
          className={`absolute inset-0 bg-[url('/fotos/eltablero.jpg')] bg-cover bg-center transition-opacity duration-700 ${(isDynamicHeaderPage && isScrolled) || !isDynamicHeaderPage ? 'opacity-20' : 'opacity-40'
            }`}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
      </div>

      {/* Spotlight Effect - Hidden when scrolled or in other pages to save CPU */}
      <div className={`absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden ${isDynamicHeaderPage ? '' : 'rounded-b-[32px] md:rounded-b-[48px]'} ${(isDynamicHeaderPage && isScrolled) || !isDynamicHeaderPage ? 'hidden' : ''}`}>
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

      <div className={`relative container mx-auto px-4 text-center flex flex-col items-center justify-center z-10 transition-all duration-500 ease-in-out ${isDynamicHeaderPage && isScrolled ? 'gap-0 py-1' : (!isDynamicHeaderPage ? 'gap-0 py-0' : 'py-1 lg:py-2 gap-1')
        }`}
        style={{ overflow: 'visible' }}
      >

        {/* Top section with Logo and Social Icons */}
        <div className={`flex flex-col items-center justify-center w-full relative transition-all duration-500 ease-in-out ${isDynamicHeaderPage && isScrolled ? 'max-h-0 opacity-0 pointer-events-none mb-0 overflow-hidden' : 'max-h-16 opacity-100 mb-0 overflow-visible'
          }`}>
          <div className={`flex items-center gap-2 sm:gap-3 md:gap-4 transition-all duration-500 ${!isDynamicHeaderPage ? 'scale-[0.45]' : ''}`}>
            {/* Instagram Icon - Left */}
            <div className="flex items-center">
              <a href="https://www.instagram.com/debelingoconangel/" target="_blank" rel="noopener noreferrer" className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110">
                <Instagram className="w-4 h-4 sm:w-4.5 sm:h-4.5 lg:w-6 lg:h-6 text-white" />
              </a>
            </div>

            {/* TikTok Logo - Center */}
            <div className="flex items-center">
              <a href="https://www.tiktok.com/@debelingoconangel" target="_blank" rel="noopener noreferrer" className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-black rounded-lg flex items-center justify-center shadow-lg transition-transform hover:scale-110 border border-white/40">
                <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4 sm:w-4.5 sm:h-4.5 lg:w-6 lg:h-6">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                </svg>
              </a>
            </div>

            {/* WhatsApp Icon - Right */}
            <div className="flex items-center">
              <a href="https://www.whatsapp.com/channel/0029Va8nc2A77qVZokI0aC2K" target="_blank" rel="noopener noreferrer" className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110">
                <MessageCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5 lg:w-6 lg:h-6 text-white" />
              </a>
            </div>
          </div>
        </div>

        {/* Group Title */}
        <div className={`w-full flex flex-col items-center transition-all duration-500 ease-in-out ${isDynamicHeaderPage && isScrolled ? 'max-h-0 opacity-0 pointer-events-none mb-0 overflow-hidden' : 'max-h-16 opacity-100 mb-0 overflow-visible'
          }`}>
          {/* Visible on mobile - small */}
          <div className={`block md:hidden transition-all duration-500 ${!isDynamicHeaderPage ? 'scale-[0.65]' : ''}`}>
            <h1 className="text-xs font-bold font-orbitron tracking-widest transform scale-x-110 origin-center inline-block group/text cursor-pointer transition-transform duration-300 py-0.5">
              {"DE BELINGO CON ÁNGEL".split('').map((char, i) => (
                <span
                  key={`char-${i}`}
                  className="gradient-text-wave"
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
            </h1>
          </div>
          {/* Visible on desktop */}
          <div className={`hidden md:block transition-all duration-500 ${!isDynamicHeaderPage ? 'scale-[0.65]' : ''}`}>
            <h1 className="text-lg md:text-xl lg:text-3xl font-bold font-orbitron tracking-widest transform scale-x-110 origin-center inline-block group/text cursor-pointer transition-transform duration-300 hover:scale-125 py-1 perspective-[1000px]">
              {"DE BELINGO CON ÁNGEL".split('').map((char, i) => (
                <span
                  key={`char-${i}`}
                  className="gradient-text-wave group-hover/text:animate-[wave_1s_ease-in-out_infinite]"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
            </h1>
            <p className={`text-xs md:text-sm lg:text-base font-bold font-orbitron tracking-wider text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)] hover:text-amber-200 hover:drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] transition-all duration-300 animate-fade-in ${!isDynamicHeaderPage ? 'hidden' : 'mt-0.5'}`}>
              Verbenas en Tenerife
            </p>
          </div>
        </div>

        {/* Navigation - ALWAYS VISIBLE */}
        <div className={`w-full flex justify-center transition-all duration-500 ${isDynamicHeaderPage && isScrolled
          ? 'py-1 scale-100'
          : (!isDynamicHeaderPage ? 'py-0.5 scale-85' : 'py-1')
          }`}>
          <Navigation />
        </div>
      </div>
    </header>
  );
};

export default Header;


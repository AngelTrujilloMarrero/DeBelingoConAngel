import React, { useRef, useEffect, useState } from 'react';
import Navigation from './Navigation';

const Header: React.FC = () => {
  const headerRef = useRef<HTMLElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
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
  }, [isScrolled]);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  const headerClasses = isScrolled 
    ? 'py-1 backdrop-blur-md bg-[#001f3f]/90' 
    : 'py-1.5 lg:py-3';

  return (
    <header
      ref={headerRef}
      onMouseMove={handleMouseMove}
      className={`sticky top-0 z-50 text-white shadow-xl flex flex-col justify-center items-center cursor-default group transition-all duration-500 ease-in-out bg-[#001f3f] ${headerClasses}`}
      style={{ overflow: 'visible' }}
    >
      {/* Background Layers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className={`absolute inset-0 bg-[url('/fotos/eltablero.jpg')] bg-cover bg-center transition-opacity duration-700 ${isScrolled ? 'opacity-20' : 'opacity-40'}`}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
      </div>

      {/* Spotlight Effect */}
      <div className={`absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 overflow-hidden ${isScrolled ? 'hidden' : ''}`}>
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

      <div className={`relative container mx-auto px-4 text-center flex flex-col items-center justify-center z-10 transition-all duration-500 ease-in-out ${isScrolled ? 'gap-0 py-1' : 'py-1 lg:py-2 gap-1'}`}
        style={{ overflow: 'visible' }}
      >


        {/* Group Title */}
        <div className={`w-full flex flex-col items-center transition-all duration-500 ease-in-out ${isScrolled ? 'max-h-0 opacity-0 pointer-events-none mb-0 overflow-hidden' : 'max-h-16 opacity-100 mb-0 overflow-visible'}`}>
          {/* Visible on mobile - small */}
          <div className="block md:hidden transition-all duration-500">
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
          <div className="hidden md:block transition-all duration-500">
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
            <p className="text-xs md:text-sm lg:text-base font-bold font-orbitron tracking-wider text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)] hover:text-amber-200 hover:drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] transition-all duration-300 animate-fade-in mt-0.5">
              Verbenas en Tenerife
            </p>
          </div>
        </div>

        {/* Navigation - ALWAYS VISIBLE */}
        <div className={`w-full flex justify-center transition-all duration-500 ${isScrolled ? 'py-1 scale-100' : 'py-1'}`}>
          <Navigation />
        </div>
      </div>
    </header>
  );
};

export default Header;

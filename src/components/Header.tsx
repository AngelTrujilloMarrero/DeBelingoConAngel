import React, { useRef, useEffect, useState } from 'react';
import { Search, X, ArrowLeft } from 'lucide-react';
import Navigation from './Navigation';

interface HeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

const Header: React.FC<HeaderProps> = ({ searchTerm, setSearchTerm }) => {
  const headerRef = useRef<HTMLElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchOpen]);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setIsSearchOpen(false);
  };

  const headerClasses = isScrolled 
    ? 'py-1 bg-[#001f3f]' 
    : 'py-1.5 lg:py-3';

  return (
    <header
      ref={headerRef}
      onMouseMove={handleMouseMove}
      className={`relative md:sticky top-0 z-50 text-white shadow-xl flex flex-col justify-center items-center cursor-default group transition-none md:transition-all md:duration-500 ease-in-out bg-[#001f3f] ${headerClasses}`}
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
        {/* Search Overlay/Input */}
        <div 
          className={`absolute inset-0 z-20 flex items-center justify-center transition-all duration-300 ${
            isSearchOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="w-full max-w-2xl px-4 flex items-center gap-3">
            <button 
              onClick={clearSearch}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-white/70" />
            </button>
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Busca por municipio, orquesta o lugar..."
                className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-full py-2 px-6 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                onKeyDown={(e) => e.key === 'Escape' && clearSearch()}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-4 h-4 text-white/50" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Group Title - Hidden when searching on mobile */}
        <div className={`w-full flex flex-col items-center transition-all duration-500 ease-in-out ${
          isScrolled || isSearchOpen ? 'max-h-0 opacity-0 pointer-events-none mb-0 overflow-hidden' : 'max-h-24 opacity-100 mb-0 overflow-visible'
        }`}>
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

        {/* Navigation & Search Icon */}
        <div className={`w-full flex justify-center items-center transition-all duration-500 ${isScrolled ? 'py-1 scale-100' : 'py-1'} ${isSearchOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <Navigation 
            onSearchClick={() => setIsSearchOpen(true)}
            searchTerm={searchTerm}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;

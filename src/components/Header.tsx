import React, { useRef, useEffect } from 'react';
import { Instagram, Facebook, MessageCircle, Send } from 'lucide-react';
import DBCALogo from './DBCALogo';
import Navigation from './Navigation';

const Header: React.FC = () => {
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    let rafId: number | null = null;
    let rect = header.getBoundingClientRect();

    const updateRect = () => {
      rect = header.getBoundingClientRect();
    };

    // Update rect on resize and scroll to ensure accuracy
    window.addEventListener('resize', updateRect, { passive: true });
    window.addEventListener('scroll', updateRect, { passive: true });

    const handleMouseMove = (e: MouseEvent) => {
      if (rafId) return;

      rafId = requestAnimationFrame(() => {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        header.style.setProperty('--mouse-x', `${x}px`);
        header.style.setProperty('--mouse-y', `${y}px`);
        rafId = null;
      });
    };

    header.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      header.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 text-white shadow-lg flex flex-col justify-center items-center cursor-default group overflow-hidden"
      style={{
        maxHeight: '28.5vh',
      }}
    >
      {/* Background Layers */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Base Blurred Image */}
        <div
          className="absolute inset-0 bg-[url('/eltablero.jpg')] bg-cover bg-center blur-[2px] scale-110"
        />

        {/* Unblurred Reveal Layer */}
        <div
          className="absolute inset-0 bg-[url('/eltablero.jpg')] bg-cover bg-center scale-110 transition-opacity duration-300"
          style={{
            maskImage: `radial-gradient(160px circle at var(--mouse-x) var(--mouse-y), black, transparent)`,
            WebkitMaskImage: `radial-gradient(160px circle at var(--mouse-x) var(--mouse-y), black, transparent)`,
          }}
        />

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Spotlight Effect (Intensified) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.3), transparent 40%)`,
          zIndex: 5
        }}
      />

      <div className="relative container mx-auto px-4 text-center flex flex-col justify-between h-full z-10 py-2">
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

          <div className="transform scale-[0.45] md:scale-[0.60] -my-2 md:-my-1 translate-y-[4%]">
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

        {/* Group Title and Navigation to keep them close and lift them up together */}
        <div className="w-full flex flex-col items-center gap-1 md:gap-0 mt-auto mb-3 md:mb-4">
          {/* Main Title & Subtitle */}
          <div className="hidden md:block -mt-2">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold font-orbitron tracking-widest transform scale-x-110 origin-center inline-block group/text cursor-pointer transition-transform duration-300 hover:scale-125 py-2 perspective-[1000px]">
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
            <p className="text-base md:text-lg font-semibold text-blue-100 animate-fade-in">
              Verbenas en Tenerife
            </p>
          </div>

          {/* Navigation */}
          <div className="w-full">
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

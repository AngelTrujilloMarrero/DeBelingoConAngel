import React from 'react';
import { Music, Guitar, Mic, Disc3, Piano, Headphones } from 'lucide-react';

const DBCALogo: React.FC = () => {
  return (
    <div className="relative">
      <div
        className="dbca-logo w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/30 relative overflow-hidden"
        style={{
          background: `conic-gradient(from 0deg, 
            #FF6B35, #F7931E, #FFD23F, #06FFA5, 
            #1FB3D3, #5D737E, #64B6AC, #C0392B, 
            #9B59B6, #2ECC71, #E74C3C, #3498DB, 
            #FF6B35)`,
        }}
      >

        {/* Musical instruments pattern background - simulating the original logo */}
        <div className="absolute inset-0 opacity-50">
          {/* Top instruments */}
          <Guitar className="absolute top-1 left-2 w-3 h-3 text-white/80 rotate-12" />
          <Music className="absolute top-2 right-1 w-2.5 h-2.5 text-yellow-200/80 rotate-45" />
          <Mic className="absolute top-0.5 left-1/2 w-2.5 h-2.5 text-orange-200/80 -rotate-12" />

          {/* Middle instruments */}
          <Piano className="absolute top-1/2 left-0.5 w-3 h-3 text-green-200/80 rotate-90" />
          <Disc3 className="absolute top-1/2 right-0.5 w-3 h-3 text-purple-200/80 -rotate-90" />

          {/* Bottom instruments */}
          <Guitar className="absolute bottom-1 left-1 w-3 h-3 text-orange-200/80 -rotate-12" />
          <Headphones className="absolute bottom-1 right-2 w-2.5 h-2.5 text-blue-200/80 -rotate-45" />
          <Music className="absolute bottom-0.5 left-1/2 w-2.5 h-2.5 text-green-300/80 rotate-30" />

          {/* Additional scattered instruments for density */}
          <Guitar className="absolute top-3 left-3 w-2 h-2 text-cyan-200/60 rotate-45" />
          <Music className="absolute top-4 right-3 w-2 h-2 text-pink-200/60 -rotate-30" />
          <Mic className="absolute bottom-3 left-4 w-2 h-2 text-yellow-300/60 rotate-60" />
          <Piano className="absolute bottom-4 right-2 w-2 h-2 text-indigo-200/60 -rotate-45" />
        </div>

        {/* Central DBCA text with better contrast */}
        <div className="relative z-10 bg-black/80 rounded-full w-14 h-14 md:w-16 md:h-16 flex items-center justify-center border-2 border-white/20">
          <span className="text-lg md:text-xl font-black text-white drop-shadow-lg tracking-tight">DBCA</span>
        </div>

        {/* Static musical elements around the logo - removed animate-bounce for performance */}
        <Guitar className="absolute -top-2 -right-2 w-6 h-6 text-yellow-300 drop-shadow-lg transition-transform hover:scale-110" />
        <Music className="absolute -bottom-2 -left-2 w-5 h-5 text-orange-300 drop-shadow-lg transition-transform hover:scale-110" />
        <Guitar className="absolute -top-2 -left-2 w-5 h-5 text-green-300 drop-shadow-lg transition-transform hover:scale-110" />
        <Music className="absolute -bottom-2 -right-2 w-5 h-5 text-purple-300 drop-shadow-lg transition-transform hover:scale-110" />
      </div>
    </div>
  );
};

export default DBCALogo;

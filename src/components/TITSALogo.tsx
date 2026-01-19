import React from 'react';

const TITSALogo: React.FC = () => {
  return (
    <div className="flex-shrink-0 flex items-center justify-center p-0.5" title="TITSA">
      <img
        src="https://movil.titsa.com/images/logo-titsa.png"
        alt="TITSA"
        className="h-5 w-auto object-contain brightness-110 contrast-110"
        onError={(e) => {
          // Fallback if image fails to load
          e.currentTarget.style.display = 'none';
          const container = e.currentTarget.parentElement;
          if (container) {
            container.innerHTML = '<div class="px-1.5 py-0.5 bg-[#00a54e] rounded text-white font-black text-[10px] italic">TITSA</div>';
          }
        }}
      />
    </div>
  );
};

export default TITSALogo;
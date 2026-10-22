import React from 'react';

const FinPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black text-center px-4 select-none">
      <h1
        className="font-orbitron font-extrabold tracking-[0.2em] bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
        style={{ fontSize: 'clamp(6rem, 35vw, 22rem)', lineHeight: 1 }}
      >
        FIN
      </h1>
      <p className="mt-8 text-gray-400 text-lg md:text-2xl font-medium tracking-wide">
        De Belingo con Ángel
      </p>
    </div>
  );
};

export default FinPage;
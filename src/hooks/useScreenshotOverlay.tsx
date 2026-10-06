import { useState, useCallback, useEffect, useRef } from 'react';

interface ScreenshotOverlayProps {
  watermarkCode?: string;
  enabled?: boolean;
}

export function useScreenshotOverlay({ watermarkCode, enabled = true }: ScreenshotOverlayProps = {}) {
  const [flashVisible, setFlashVisible] = useState(false);
  const [flashCount, setFlashCount] = useState(() => {
    if (!enabled) return 0;
    const stored = sessionStorage.getItem('_dbca_ss_count');
    return stored ? parseInt(stored, 10) : 0;
  });

  const flash = useCallback(() => {
    if (!enabled || flashVisible) return;
    setFlashVisible(true);
    setFlashCount(c => c + 1);
    setTimeout(() => setFlashVisible(false), 800);
  }, [enabled, flashVisible]);

  useEffect(() => {
    sessionStorage.setItem('_dbca_ss_count', flashCount.toString());
  }, [flashCount]);

  const OverlayComponent = flashVisible ? (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
      style={{
        animation: 'screenshotFlash 800ms ease-out forwards',
      }}
    >
      <div className="text-center space-y-4">
        <div className="text-orange-500 font-black text-2xl md:text-4xl tracking-widest drop-shadow-lg"
             style={{ textShadow: '0 0 20px rgba(255,106,0,0.8)' }}>
          DBCA
        </div>
        {watermarkCode && (
          <div className="text-orange-400/70 font-mono text-xs tracking-[0.5em]">
            {watermarkCode}
          </div>
        )}
        <div className="text-white/60 text-sm font-medium">
          Contenido protegido · debelingoconangel.web.app
        </div>
      </div>
      <style>{`
        @keyframes screenshotFlash {
          0% { background: rgba(255,106,0,0.15); opacity: 0; }
          15% { background: rgba(255,106,0,0.25); opacity: 1; }
          85% { background: rgba(255,106,0,0.15); opacity: 1; }
          100% { background: rgba(255,106,0,0); opacity: 0; }
        }
      `}</style>
    </div>
  ) : null;

  return { flash, OverlayComponent, flashCount };
}

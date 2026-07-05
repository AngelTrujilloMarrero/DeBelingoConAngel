import { useEffect, useCallback, useRef } from 'react';

interface ScreenshotGuardOptions {
  onScreenshotAttempt?: () => void;
  enabled?: boolean;
}

export function useScreenshotGuard({ onScreenshotAttempt, enabled = true }: ScreenshotGuardOptions = {}) {
  const cooldownRef = useRef(false);
  const callbackRef = useRef(onScreenshotAttempt);

  useEffect(() => {
    callbackRef.current = onScreenshotAttempt;
  }, [onScreenshotAttempt]);

  const trigger = useCallback(() => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;
    callbackRef.current?.();
    setTimeout(() => { cooldownRef.current = false; }, 2000);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = /Mac/i.test(navigator.platform || '');
      const isWindows = /Win/i.test(navigator.platform || '');

      if (isMac) {
        if (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) {
          trigger();
        }
        if (e.metaKey && e.shiftKey && e.key === '6') {
          trigger();
        }
      }

      if (isWindows) {
        if (e.key === 'PrintScreen' || e.key === 'Snapshot') {
          trigger();
        }
        if (e.metaKey && e.shiftKey && e.key === 's') {
          trigger();
        }
        if ((e.altKey || e.metaKey) && e.key === 'PrintScreen') {
          trigger();
        }
      }

      if (e.key === 'PrintScreen') {
        trigger();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const now = Date.now();
        const lastHidden = parseInt(sessionStorage.getItem('_dbca_lasthidden') || '0', 10);
        if (now - lastHidden < 500) {
          trigger();
        }
        sessionStorage.setItem('_dbca_lasthidden', now.toString());
      }
    };

    const handleBlur = () => {
      trigger();
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [enabled, trigger]);

  return { trigger };
}

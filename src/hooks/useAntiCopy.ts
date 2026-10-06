import { useEffect } from 'react';
import { confusableObfuscate } from '../utils/confusableObfuscate';

/**
 * Hook que previene:
 * - Clic derecho en el contenedor
 * - Atajos de teclado para copiar (Ctrl+C, Cmd+C, Ctrl+U, etc.)
 * - F12 y otros accesos a DevTools
 * - Selección masiva de texto
 * - Al copiar, transforma el texto a caracteres confusables
 */
export function useAntiCopy(enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleContextMenu = (e: Event) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key === 'c') {
        const selection = window.getSelection();
        if (!selection || selection.toString().length === 0) {
          e.preventDefault();
        }
      }

      if (modifier && e.key === 'u') {
        e.preventDefault();
      }

      if (modifier && e.key === 's') {
        e.preventDefault();
      }

      if (modifier && e.key === 'p') {
        e.preventDefault();
      }

      if (e.key === 'F12') {
        e.preventDefault();
      }

      if (modifier && e.shiftKey && e.key === 'I') {
        e.preventDefault();
      }

      if (modifier && e.shiftKey && e.key === 'J') {
        e.preventDefault();
      }

      if (modifier && e.shiftKey && e.key === 'C') {
        e.preventDefault();
      }

      if (isMac && e.altKey && e.metaKey && e.key === 'i') {
        e.preventDefault();
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection();
      if (!selection || selection.toString().length === 0) return;

      const selectedText = selection.toString();
      const scrambled = confusableObfuscate(selectedText);

      if (scrambled !== selectedText) {
        e.preventDefault();
        e.clipboardData?.setData('text/plain', scrambled);
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
    };
  }, [enabled]);
}

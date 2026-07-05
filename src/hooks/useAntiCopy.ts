import { useEffect } from 'react';

/**
 * Hook que previene:
 * - Clic derecho en el contenedor
 * - Atajos de teclado para copiar (Ctrl+C, Cmd+C, Ctrl+U, etc.)
 * - F12 y otros accesos a DevTools
 * - Selección masiva de texto
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

      // Ctrl/Cmd + C (copiar)
      if (modifier && e.key === 'c') {
        // Permitir copiar solo si hay texto seleccionado internamente
        // (para no romper funcionalidad de links)
        const selection = window.getSelection();
        if (!selection || selection.toString().length === 0) {
          e.preventDefault();
        }
      }

      // Ctrl/Cmd + U (ver código fuente)
      if (modifier && e.key === 'u') {
        e.preventDefault();
      }

      // Ctrl/Cmd + S (guardar)
      if (modifier && e.key === 's') {
        e.preventDefault();
      }

      // Ctrl/Cmd + P (imprimir)
      if (modifier && e.key === 'p') {
        e.preventDefault();
      }

      // F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
      }

      // Ctrl/Cmd + Shift + I (DevTools)
      if (modifier && e.shiftKey && e.key === 'I') {
        e.preventDefault();
      }

      // Ctrl/Cmd + Shift + J (Console)
      if (modifier && e.shiftKey && e.key === 'J') {
        e.preventDefault();
      }

      // Ctrl/Cmd + Shift + C (Inspector)
      if (modifier && e.shiftKey && e.key === 'C') {
        e.preventDefault();
      }

      // Cmd + Option + I (Safari DevTools)
      if (isMac && e.altKey && e.metaKey && e.key === 'i') {
        e.preventDefault();
      }
    };

    // Agregar event listeners al document
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled]);
}

import { useRef, useCallback } from 'react';

function generateSessionId(): string {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).substring(2, 8);
  return `${t}-${r}`;
}

export function useSessionWatermark() {
  const sessionIdRef = useRef<string | null>(null);

  const getSessionId = useCallback((): string => {
    if (sessionIdRef.current) return sessionIdRef.current;

    const existing = sessionStorage.getItem('_dbca_sid');
    if (existing) {
      sessionIdRef.current = existing;
      return existing;
    }

    const id = generateSessionId();
    sessionStorage.setItem('_dbca_sid', id);
    sessionIdRef.current = id;
    return id;
  }, []);

  const encodeSessionToOffset = useCallback((eventId: string): { xOffset: number; yOffset: number; rotOffset: number } => {
    const sid = getSessionId();
    let hash = 0;
    const combined = `${eventId}:${sid}`;
    for (let i = 0; i < combined.length; i++) {
      hash = Math.imul(31, hash) + combined.charCodeAt(i) | 0;
    }
    return {
      xOffset: (Math.abs(hash % 17)) - 8,
      yOffset: (Math.abs((hash >> 8) % 17)) - 8,
      rotOffset: (Math.abs((hash >> 16) % 11)) - 5,
    };
  }, [getSessionId]);

  const encodeSessionToChar = useCallback((index: number): string => {
    const sid = getSessionId();
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let hash = 0;
    const key = `${index}:${sid}`;
    for (let i = 0; i < key.length; i++) {
      hash = Math.imul(31, hash) + key.charCodeAt(i) | 0;
    }
    return chars[Math.abs(hash) % chars.length];
  }, [getSessionId]);

  const getWatermarkCode = useCallback((): string => {
    const sid = getSessionId();
    let hash = 0;
    for (let i = 0; i < sid.length; i++) {
      hash = Math.imul(31, hash) + sid.charCodeAt(i) | 0;
    }
    const code = Math.abs(hash).toString(36).substring(0, 4).toUpperCase();
    return code;
  }, [getSessionId]);

  return { getSessionId, encodeSessionToOffset, encodeSessionToChar, getWatermarkCode };
}

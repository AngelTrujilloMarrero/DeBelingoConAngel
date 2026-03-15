import { useState, useEffect, useRef } from 'react';
import { get, set, onValue, visitCountRef } from '../utils/firebase';

export function useVisitCounter() {
  const [visitCount, setVisitCount] = useState<number>(0);
  const hasIncremented = useRef(false);

  useEffect(() => {
    const unsubscribe = onValue(visitCountRef, async (snapshot) => {
      const count = snapshot.val() || 0;
      setVisitCount(count);

      if (!hasIncremented.current) {
        hasIncremented.current = true;
        try {
          await set(visitCountRef, count + 1);
        } catch (error) {
          console.error('Error al incrementar el contador:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return visitCount;
}

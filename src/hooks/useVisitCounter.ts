import { useState, useEffect } from 'react';
import { get, onValue, visitCountRef } from '../utils/firebase';

export function useVisitCounter() {
  const [visitCount, setVisitCount] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = onValue(visitCountRef, (snapshot) => {
      const count = snapshot.val() || 0;
      setVisitCount(count);
    });

    return () => unsubscribe();
  }, []);

  return visitCount;
}

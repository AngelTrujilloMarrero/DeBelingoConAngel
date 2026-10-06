import { useState, useEffect } from 'react';
import { onValue, visitCountRef, db, ref } from '../utils/firebase';

export function useVisitCounter() {
  const [visitCount, setVisitCount] = useState<number>(0);
  const [dailyCount, setDailyCount] = useState<number>(0);

  useEffect(() => {
    // 1. Listen to lifetime visits
    const unsubscribeLifetime = onValue(visitCountRef, (snapshot) => {
      const count = snapshot.val() || 0;
      setVisitCount(count);
    });

    // 2. Construct today's date key for daily visits
    const date = new Date();
    const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const dayName = daysOfWeek[date.getDay()];
    const dayNum = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();

    const formattedDate = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')} (${dayName} ${dayNum} de ${monthName})`;

    const dailyVisitRef = ref(db, `dailyVisits/${formattedDate}`);
    
    // 3. Listen to today's visits
    const unsubscribeDaily = onValue(dailyVisitRef, (snapshot) => {
      const count = snapshot.val() || 0;
      setDailyCount(count);
    });

    return () => {
      unsubscribeLifetime();
      unsubscribeDaily();
    };
  }, []);

  return { visitCount, dailyCount };
}

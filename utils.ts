
export const getHolidayName = (date: Date): string | null => {
  const d = date.getDate();
  const m = date.getMonth(); // 0-indexed (Jan=0, Dec=11)
  const y = date.getFullYear();

  // 1. Fixed National & Regional (Comunidad Valenciana) Holidays
  if (d === 1 && m === 0) return "Año Nuevo";
  if (d === 6 && m === 0) return "Reyes";
  if (d === 19 && m === 2) return "San José";
  if (d === 1 && m === 4) return "Día del Trabajo";
  if (d === 24 && m === 5) return "San Juan";
  if (d === 15 && m === 7) return "Asunción";
  if (d === 9 && m === 9) return "Día C. Valenciana";
  if (d === 12 && m === 9) return "Fiesta Nacional";
  if (d === 1 && m === 10) return "Todos los Santos";
  if (d === 6 && m === 11) return "Constitución";
  if (d === 8 && m === 11) return "Inmaculada";
  if (d === 25 && m === 11) return "Navidad";

  // 2. Local Holidays Forcall (Approximate dates for 2026/27 based on tradition)
  if (d === 17 && m === 0) return "Sant Antoni"; // San Antonio Abad
  if (d === 24 && m === 7) return "Fiestas Mayores"; // Aprox. San Víctor

  // 3. Movable Feasts (Easter/Semana Santa) for 2026 and 2027
  if (y === 2026) {
      if (d === 3 && m === 3) return "Viernes Santo";
      if (d === 6 && m === 3) return "Lunes Pascua";
  }
  if (y === 2027) {
      if (d === 26 && m === 2) return "Viernes Santo";
      if (d === 29 && m === 2) return "Lunes Pascua";
  }

  return null;
};

export const getNextUpcomingHolidays = (count: number = 2, startDate: Date = new Date()): { date: Date; name: string }[] => {
  const holidays = [];
  const maxDaysLookahead = 365;
  const checkDate = new Date(startDate);
  
  // Empezar desde mañana
  checkDate.setDate(checkDate.getDate() + 1);

  for (let i = 0; i < maxDaysLookahead && holidays.length < count; i++) {
    const name = getHolidayName(checkDate);
    if (name) {
      holidays.push({ date: new Date(checkDate), name });
    }
    checkDate.setDate(checkDate.getDate() + 1);
  }
  return holidays;
};

export const getNextUpcomingHoliday = (startDate: Date = new Date()): { date: Date; name: string } | null => {
  const res = getNextUpcomingHolidays(1, startDate);
  return res.length > 0 ? res[0] : null;
};

/**
 * Date Parsing Utilities
 * Handles natural language date parsing for AI commands
 */

/**
 * Parse natural language date strings into Date objects
 * Supports: "hoy", "mañana", "en X días", "próximo lunes", etc.
 */
export const parseDateString = (dateInput: string): Date | null => {
  if (!dateInput) return null;

  const input = dateInput.trim().toLowerCase();
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Hoy
  if (input === 'hoy' || input === 'today') {
    return now;
  }

  // Mañana
  if (input === 'mañana' || input === 'tomorrow') {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  // Pasado mañana
  if (input === 'pasado mañana' || input === 'day after tomorrow') {
    const dayAfter = new Date(now);
    dayAfter.setDate(dayAfter.getDate() + 2);
    return dayAfter;
  }

  // En X días
  const daysMatch = input.match(/en (\d+) d[ií]as?/i) || input.match(/in (\d+) days?/i);
  if (daysMatch) {
    const days = parseInt(daysMatch[1], 10);
    const future = new Date(now);
    future.setDate(future.getDate() + days);
    return future;
  }

  // Próximo día de la semana
  const weekdays = [
    { es: 'domingo', en: 'sunday', index: 0 },
    { es: 'lunes', en: 'monday', index: 1 },
    { es: 'martes', en: 'tuesday', index: 2 },
    { es: 'miércoles', en: 'wednesday', index: 3 },
    { es: 'jueves', en: 'thursday', index: 4 },
    { es: 'viernes', en: 'friday', index: 5 },
    { es: 'sábado', en: 'saturday', index: 6 },
  ];

  for (const day of weekdays) {
    const nextMatch =
      input.match(new RegExp(`pr[óo]ximo? ${day.es}`, 'i')) ||
      input.match(new RegExp(`next ${day.en}`, 'i'));

    if (nextMatch) {
      const today = now.getDay();
      const target = day.index;
      let daysUntil = target - today;
      if (daysUntil <= 0) daysUntil += 7;

      const result = new Date(now);
      result.setDate(result.getDate() + daysUntil);
      return result;
    }
  }

  // Esta semana
  if (input.includes('esta semana') || input.includes('this week')) {
    const friday = new Date(now);
    const daysUntilFriday = 5 - now.getDay();
    friday.setDate(friday.getDate() + (daysUntilFriday >= 0 ? daysUntilFriday : daysUntilFriday + 7));
    return friday;
  }

  // Próxima semana / Semana que viene
  if (input.includes('pr[óo]xima semana') || input.includes('semana que viene') || input.includes('next week')) {
    const nextMonday = new Date(now);
    const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
    nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
    return nextMonday;
  }

  // Fin de semana
  if (input.includes('fin de semana') || input.includes('weekend')) {
    const saturday = new Date(now);
    const daysUntilSaturday = 6 - now.getDay();
    saturday.setDate(saturday.getDate() + (daysUntilSaturday >= 0 ? daysUntilSaturday : daysUntilSaturday + 7));
    return saturday;
  }

  // Fin de mes
  if (input.includes('fin de mes') || input.includes('end of month')) {
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return lastDay;
  }

  // Próximo mes
  if (input.includes('próximo mes') || input.includes('next month')) {
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    return nextMonth;
  }

  // Formato ISO o estándar (YYYY-MM-DD, DD/MM/YYYY)
  const isoMatch = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return new Date(input);
  }

  const ddmmyyyyMatch = input.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // No se pudo parsear
  return null;
};

/**
 * Format date for display
 */
export const formatDateForDisplay = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Check if date string is valid
 */
export const isValidDateString = (dateInput: string): boolean => {
  return parseDateString(dateInput) !== null;
};

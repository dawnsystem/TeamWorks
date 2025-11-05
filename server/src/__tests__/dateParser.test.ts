import {
  parseDateString,
  formatDateForDisplay,
  isValidDateString,
} from '../services/ai/dateParser';

describe('AI Date Parser', () => {
  let originalDate: Date;

  beforeAll(() => {
    // Mock date to ensure consistent tests
    originalDate = new Date();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-15T12:00:00Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('parseDateString', () => {
    it('should parse "hoy" to today', () => {
      const result = parseDateString('hoy');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDate()).toBe(15);
    });

    it('should parse "mañana" to tomorrow', () => {
      const result = parseDateString('mañana');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDate()).toBe(16);
    });

    it('should parse "today" in English', () => {
      const result = parseDateString('today');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDate()).toBe(15);
    });

    it('should parse "tomorrow" in English', () => {
      const result = parseDateString('tomorrow');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDate()).toBe(16);
    });

    it('should parse "pasado mañana"', () => {
      const result = parseDateString('pasado mañana');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDate()).toBe(17);
    });

    it('should parse "en X días"', () => {
      const result = parseDateString('en 5 días');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDate()).toBe(20);
    });

    it('should parse "in X days" in English', () => {
      const result = parseDateString('in 7 days');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDate()).toBe(22);
    });

    it('should parse "próximo lunes"', () => {
      const result = parseDateString('próximo lunes');
      expect(result).toBeInstanceOf(Date);
      // Should find next Monday from Jan 15, 2025 (Wednesday)
      expect(result?.getDay()).toBe(1); // Monday
    });

    it('should parse "next friday" in English', () => {
      const result = parseDateString('next friday');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDay()).toBe(5); // Friday
    });

    it('should parse "esta semana"', () => {
      const result = parseDateString('esta semana');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDay()).toBe(5); // Should return Friday
    });

    it('should parse "fin de semana"', () => {
      const result = parseDateString('fin de semana');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDay()).toBe(6); // Saturday
    });

    it('should parse "fin de mes"', () => {
      const result = parseDateString('fin de mes');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDate()).toBe(31); // Last day of January
    });

    it('should parse "próximo mes"', () => {
      const result = parseDateString('próximo mes');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getMonth()).toBe(1); // February
      expect(result?.getDate()).toBe(1);
    });

    it('should parse ISO format (YYYY-MM-DD)', () => {
      const result = parseDateString('2025-02-20');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2025);
      expect(result?.getMonth()).toBe(1); // February (0-indexed)
      expect(result?.getDate()).toBe(20);
    });

    it('should parse DD/MM/YYYY format', () => {
      const result = parseDateString('25/12/2025');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDate()).toBe(25);
      expect(result?.getMonth()).toBe(11); // December
    });

    it('should return null for empty string', () => {
      const result = parseDateString('');
      expect(result).toBeNull();
    });

    it('should return null for invalid date string', () => {
      const result = parseDateString('invalid date');
      expect(result).toBeNull();
    });

    it('should be case insensitive', () => {
      const result1 = parseDateString('HOY');
      const result2 = parseDateString('Hoy');
      const result3 = parseDateString('hoy');
      
      expect(result1?.getDate()).toBe(result2?.getDate());
      expect(result2?.getDate()).toBe(result3?.getDate());
    });

    it('should handle trimmed whitespace', () => {
      const result = parseDateString('  hoy  ');
      expect(result).toBeInstanceOf(Date);
    });

    it('should handle mixed case with whitespace', () => {
      const result = parseDateString('  MAÑANA  ');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getDate()).toBe(16);
    });

    it('should parse dates across month boundaries', () => {
      jest.setSystemTime(new Date('2025-01-30T12:00:00Z'));
      const result = parseDateString('en 5 días');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getMonth()).toBe(1); // February
      expect(result?.getDate()).toBe(4);
    });

    it('should parse dates across year boundaries', () => {
      jest.setSystemTime(new Date('2025-12-30T12:00:00Z'));
      const result = parseDateString('en 5 días');
      expect(result).toBeInstanceOf(Date);
      expect(result?.getFullYear()).toBe(2026);
      expect(result?.getMonth()).toBe(0); // January
    });
  });

  describe('formatDateForDisplay', () => {
    it('should format date as ISO string', () => {
      const date = new Date('2025-03-15T10:30:00Z');
      const result = formatDateForDisplay(date);
      expect(result).toBe('2025-03-15');
    });

    it('should handle different dates', () => {
      const date = new Date('2024-12-25T00:00:00Z');
      const result = formatDateForDisplay(date);
      expect(result).toBe('2024-12-25');
    });
  });

  describe('isValidDateString', () => {
    it('should return true for valid date strings', () => {
      expect(isValidDateString('hoy')).toBe(true);
      expect(isValidDateString('mañana')).toBe(true);
      expect(isValidDateString('2025-03-15')).toBe(true);
      expect(isValidDateString('25/12/2025')).toBe(true);
    });

    it('should return false for invalid date strings', () => {
      expect(isValidDateString('invalid')).toBe(false);
      expect(isValidDateString('')).toBe(false);
      expect(isValidDateString('not a date')).toBe(false);
    });

    it('should return false for null/undefined input', () => {
      expect(isValidDateString(null as any)).toBe(false);
      expect(isValidDateString(undefined as any)).toBe(false);
    });
  });
});

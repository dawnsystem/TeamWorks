import { describe, it, expect } from 'vitest';

// Utility functions for testing
describe('Utility Functions', () => {
  describe('Priority Mapping', () => {
    it('debería mapear correctamente P1 a alta prioridad', () => {
      const priorityMap: Record<string, number> = { 
        P1: 1, 
        P2: 2, 
        P3: 3, 
        P4: 4 
      };
      expect(priorityMap['P1']).toBe(1);
      expect(priorityMap['P2']).toBe(2);
      expect(priorityMap['P3']).toBe(3);
      expect(priorityMap['P4']).toBe(4);
    });
  });

  describe('Color Utilities', () => {
    it('debería validar colores hex', () => {
      const isValidHex = (color: string) => /^#[0-9A-F]{6}$/i.test(color);
      
      expect(isValidHex('#FF0000')).toBe(true);
      expect(isValidHex('#00ff00')).toBe(true);
      expect(isValidHex('#123456')).toBe(true);
      expect(isValidHex('FF0000')).toBe(false);
      expect(isValidHex('#FFF')).toBe(false);
      expect(isValidHex('not-a-color')).toBe(false);
    });
  });

  describe('String Utilities', () => {
    it('debería truncar strings largos', () => {
      const truncate = (str: string, maxLength: number) => {
        if (str.length <= maxLength) return str;
        return str.slice(0, maxLength - 3) + '...';
      };

      expect(truncate('Short', 10)).toBe('Short');
      expect(truncate('This is a very long string', 10)).toBe('This is...');
      expect(truncate('Exactly10!', 10)).toBe('Exactly10!');
    });

    it('debería capitalizar la primera letra', () => {
      const capitalize = (str: string) => {
        if (!str) return str;
        return str.charAt(0).toUpperCase() + str.slice(1);
      };

      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('HELLO')).toBe('HELLO');
      expect(capitalize('')).toBe('');
      expect(capitalize('a')).toBe('A');
    });
  });

  describe('Array Utilities', () => {
    it('debería agrupar elementos por propiedad', () => {
      const groupBy = <T,>(array: T[], key: keyof T): Record<string, T[]> => {
        return array.reduce((result, item) => {
          const group = String(item[key]);
          if (!result[group]) result[group] = [];
          result[group].push(item);
          return result;
        }, {} as Record<string, T[]>);
      };

      const tasks = [
        { id: 1, status: 'pending' },
        { id: 2, status: 'completed' },
        { id: 3, status: 'pending' },
      ];

      const grouped = groupBy(tasks, 'status');
      expect(grouped['pending']).toHaveLength(2);
      expect(grouped['completed']).toHaveLength(1);
    });
  });

  describe('Date Utilities', () => {
    it('debería verificar si una fecha es hoy', () => {
      const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
      };

      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      expect(isToday(today)).toBe(true);
      expect(isToday(yesterday)).toBe(false);
    });

    it('debería verificar si una fecha está en el pasado', () => {
      const isPast = (date: Date) => date < new Date();

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      expect(isPast(yesterday)).toBe(true);
      expect(isPast(tomorrow)).toBe(false);
    });
  });

  describe('Validation Utilities', () => {
    it('debería validar emails', () => {
      const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      };

      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user@domain.co.uk')).toBe(true);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
    });

    it('debería validar que un string no esté vacío', () => {
      const isNotEmpty = (str: string) => {
        return str.trim().length > 0;
      };

      expect(isNotEmpty('hello')).toBe(true);
      expect(isNotEmpty('   ')).toBe(false);
      expect(isNotEmpty('')).toBe(false);
      expect(isNotEmpty('  a  ')).toBe(true);
    });
  });
});

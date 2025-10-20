import { describe, it, expect, afterEach } from 'vitest';
import {
  isRemoteAccess,
  suggestApiUrl,
  isApiUrlLikelyCorrect,
  getApiUrlMismatchReason,
} from '../apiUrlDetection';

describe('apiUrlDetection', () => {
  const originalLocation = window.location;

  // Helper to mock window.location
  const mockLocation = (hostname: string, protocol = 'http:', port = '5173') => {
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      hostname,
      protocol,
      port,
      href: `${protocol}//${hostname}:${port}/`,
    } as any;
  };

  afterEach(() => {
    window.location = originalLocation;
  });

  describe('isRemoteAccess', () => {
    it('should return false for localhost', () => {
      mockLocation('localhost');
      expect(isRemoteAccess()).toBe(false);
    });

    it('should return false for 127.0.0.1', () => {
      mockLocation('127.0.0.1');
      expect(isRemoteAccess()).toBe(false);
    });

    it('should return false for 0.0.0.0', () => {
      mockLocation('0.0.0.0');
      expect(isRemoteAccess()).toBe(false);
    });

    it('should return true for remote IP address', () => {
      mockLocation('192.168.0.165');
      expect(isRemoteAccess()).toBe(true);
    });

    it('should return true for domain name', () => {
      mockLocation('example.com');
      expect(isRemoteAccess()).toBe(true);
    });
  });

  describe('suggestApiUrl', () => {
    it('should suggest localhost API for localhost access', () => {
      mockLocation('localhost');
      expect(suggestApiUrl()).toBe('http://localhost:3000/api');
    });

    it('should suggest localhost API for 127.0.0.1', () => {
      mockLocation('127.0.0.1');
      expect(suggestApiUrl()).toBe('http://localhost:3000/api');
    });

    it('should suggest remote API URL for remote IP', () => {
      mockLocation('192.168.0.165');
      expect(suggestApiUrl()).toBe('http://192.168.0.165:3000/api');
    });

    it('should suggest remote API URL for domain', () => {
      mockLocation('example.com');
      expect(suggestApiUrl()).toBe('http://example.com:3000/api');
    });

    it('should preserve https protocol', () => {
      mockLocation('example.com', 'https:');
      expect(suggestApiUrl()).toBe('https://example.com:3000/api');
    });
  });

  describe('isApiUrlLikelyCorrect', () => {
    it('should return true when both are localhost variants', () => {
      mockLocation('localhost');
      expect(isApiUrlLikelyCorrect('http://localhost:3000/api')).toBe(true);
      expect(isApiUrlLikelyCorrect('http://127.0.0.1:3000/api')).toBe(true);
      expect(isApiUrlLikelyCorrect('http://0.0.0.0:3000/api')).toBe(true);
    });

    it('should return true when hostnames match', () => {
      mockLocation('192.168.0.165');
      expect(isApiUrlLikelyCorrect('http://192.168.0.165:3000/api')).toBe(true);
    });

    it('should return false when remote page uses localhost API', () => {
      mockLocation('192.168.0.165');
      expect(isApiUrlLikelyCorrect('http://localhost:3000/api')).toBe(false);
    });

    it('should return false when localhost page uses remote API', () => {
      mockLocation('localhost');
      expect(isApiUrlLikelyCorrect('http://192.168.0.165:3000/api')).toBe(false);
    });

    it('should return false when hostnames do not match', () => {
      mockLocation('192.168.0.165');
      expect(isApiUrlLikelyCorrect('http://192.168.1.100:3000/api')).toBe(false);
    });

    it('should return false for invalid API URL', () => {
      mockLocation('localhost');
      expect(isApiUrlLikelyCorrect('not-a-url')).toBe(false);
    });
  });

  describe('getApiUrlMismatchReason', () => {
    it('should return reason when remote page uses localhost API', () => {
      mockLocation('192.168.0.165');
      const reason = getApiUrlMismatchReason('http://localhost:3000/api');
      expect(reason).toContain('localhost');
      expect(reason).toContain('192.168.0.165');
      expect(reason).toContain('http://192.168.0.165:3000/api');
    });

    it('should return reason when hostnames do not match', () => {
      mockLocation('192.168.0.165');
      const reason = getApiUrlMismatchReason('http://192.168.1.100:3000/api');
      expect(reason).toContain('192.168.1.100');
      expect(reason).toContain('192.168.0.165');
    });

    it('should return null when configuration is correct', () => {
      mockLocation('localhost');
      const reason = getApiUrlMismatchReason('http://localhost:3000/api');
      expect(reason).toBeNull();
    });

    it('should return null when both are localhost variants', () => {
      mockLocation('localhost');
      const reason = getApiUrlMismatchReason('http://127.0.0.1:3000/api');
      expect(reason).toBeNull();
    });

    it('should return error message for invalid URL', () => {
      mockLocation('localhost');
      const reason = getApiUrlMismatchReason('not-a-url');
      expect(reason).toBe('La URL de la API no es válida');
    });
  });
});

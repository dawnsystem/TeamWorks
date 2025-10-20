import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMediaQuery, useIsMobile, useIsTablet, useIsDesktop, useDeviceType } from '../useMediaQuery';

describe('useMediaQuery hooks', () => {
  it('useMediaQuery should return boolean', () => {
    const { result } = renderHook(() => useMediaQuery('(max-width: 639px)'));
    expect(typeof result.current).toBe('boolean');
  });

  it('useIsMobile should return boolean', () => {
    const { result } = renderHook(() => useIsMobile());
    expect(typeof result.current).toBe('boolean');
  });

  it('useIsTablet should return boolean', () => {
    const { result } = renderHook(() => useIsTablet());
    expect(typeof result.current).toBe('boolean');
  });

  it('useIsDesktop should return boolean', () => {
    const { result } = renderHook(() => useIsDesktop());
    expect(typeof result.current).toBe('boolean');
  });

  it('useDeviceType should return valid device type', () => {
    const { result } = renderHook(() => useDeviceType());
    expect(['mobile', 'tablet', 'desktop']).toContain(result.current);
  });
});

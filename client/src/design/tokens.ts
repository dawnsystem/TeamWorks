import type { ThemeRadii, ThemeShadows, ThemeSpacing } from './themeTypes';

export const spacingTokens: ThemeSpacing = {
  xs: '0.375rem',
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.5rem',
};

export const radiiTokens: ThemeRadii = {
  sm: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  full: '9999px',
};

export const shadowTokens: ThemeShadows = {
  soft: '0 15px 30px -18px rgba(15, 23, 42, 0.3)',
  medium: '0 25px 60px -30px rgba(15, 23, 42, 0.35)',
  strong: '0 45px 90px -35px rgba(15, 23, 42, 0.45)',
};

export const darkShadowTokens: ThemeShadows = {
  soft: '0 15px 30px -18px rgba(15, 23, 42, 0.5)',
  medium: '0 25px 60px -30px rgba(15, 23, 42, 0.65)',
  strong: '0 45px 90px -35px rgba(15, 23, 42, 0.85)',
};



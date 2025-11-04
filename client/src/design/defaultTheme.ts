import { ThemeDefinition } from './themeTypes';

export const defaultLightTheme: ThemeDefinition = {
  name: 'default-light',
  appearance: 'light',
  tokens: {
    colors: {
      accent: {
        '50': '#fef2f2',
        '100': '#fee2e2',
        '500': '#ef4444',
        '600': '#dc2626',
        '700': '#b91c1c',
      },
      neutral: {
        '50': '#f8fafc',
        '100': '#e2e8f0',
        '400': '#94a3b8',
        '600': '#4b5563',
        '900': '#111827',
      },
      text: {
        primary: '#111827',
        muted: '#6b7280',
        inverse: '#f8fafc',
      },
      background: {
        gradient: 'radial-gradient(circle at 0% 0%, #ffe4e6 0%, #fff7ed 35%, #f8fafc 70%, #eef2ff 100%)',
        surface: '#ffffff',
        surfaceAlt: '#f1f5f9',
      },
      toast: {
        background: '#1f2937',
        text: '#f9fafb',
      },
      glass: {
        surface: 'rgba(255, 255, 255, 0.85)',
        border: 'rgba(148, 163, 184, 0.35)',
        shadow: '0 25px 60px -30px rgba(15, 23, 42, 0.35)',
        surfaceDark: 'rgba(17, 24, 39, 0.82)',
        borderDark: 'rgba(148, 163, 184, 0.14)',
        shadowDark: '0 25px 50px -35px rgba(15, 23, 42, 0.65)',
      },
    },
    spacing: {
      xs: '0.375rem',
      sm: '0.5rem',
      md: '0.75rem',
      lg: '1rem',
      xl: '1.5rem',
    },
    radii: {
      sm: '0.5rem',
      md: '0.75rem',
      lg: '1rem',
      full: '9999px',
    },
    shadows: {
      soft: '0 15px 30px -18px rgba(15, 23, 42, 0.3)',
      medium: '0 25px 60px -30px rgba(15, 23, 42, 0.35)',
      strong: '0 45px 90px -35px rgba(15, 23, 42, 0.45)',
    },
  },
};

export const defaultDarkTheme: ThemeDefinition = {
  name: 'default-dark',
  appearance: 'dark',
  tokens: {
    colors: {
      accent: {
        '50': '#4c0519',
        '100': '#881337',
        '500': '#ef4444',
        '600': '#dc2626',
        '700': '#f87171',
      },
      neutral: {
        '50': '#0f172a',
        '100': '#1e293b',
        '400': '#475569',
        '600': '#94a3b8',
        '900': '#f8fafc',
      },
      text: {
        primary: '#f8fafc',
        muted: 'rgba(203, 213, 225, 0.85)',
        inverse: '#111827',
      },
      background: {
        gradient: 'radial-gradient(circle at 20% 0%, rgba(244, 63, 94, 0.18) 0%, rgba(30, 64, 175, 0.18) 35%, #0f172a 75%, #020617 100%)',
        surface: '#0f172a',
        surfaceAlt: '#1e293b',
      },
      toast: {
        background: '#0f172a',
        text: '#f8fafc',
      },
      glass: {
        surface: 'rgba(17, 24, 39, 0.82)',
        border: 'rgba(148, 163, 184, 0.14)',
        shadow: '0 25px 60px -30px rgba(15, 23, 42, 0.65)',
        surfaceDark: 'rgba(15, 23, 42, 0.92)',
        borderDark: 'rgba(148, 163, 184, 0.2)',
        shadowDark: '0 35px 90px -35px rgba(15, 23, 42, 0.8)',
      },
    },
    spacing: {
      xs: '0.375rem',
      sm: '0.5rem',
      md: '0.75rem',
      lg: '1rem',
      xl: '1.5rem',
    },
    radii: {
      sm: '0.5rem',
      md: '0.75rem',
      lg: '1rem',
      full: '9999px',
    },
    shadows: {
      soft: '0 15px 30px -18px rgba(15, 23, 42, 0.5)',
      medium: '0 25px 60px -30px rgba(15, 23, 42, 0.65)',
      strong: '0 45px 90px -35px rgba(15, 23, 42, 0.85)',
    },
  },
};

export const defaultTheme = defaultLightTheme;



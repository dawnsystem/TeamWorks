export type ColorScale = Record<string, string>;

export interface ThemeColors {
  accent: ColorScale;
  neutral: ColorScale;
  text: {
    primary: string;
    muted: string;
    inverse: string;
  };
  background: {
    gradient: string;
    surface: string;
    surfaceAlt: string;
  };
  toast: {
    background: string;
    text: string;
  };
  glass: {
    surface: string;
    border: string;
    shadow: string;
    surfaceDark: string;
    borderDark: string;
    shadowDark: string;
  };
}

export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface ThemeRadii {
  sm: string;
  md: string;
  lg: string;
  full: string;
}

export interface ThemeShadows {
  soft: string;
  medium: string;
  strong: string;
}

export interface ThemeTokens {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  radii: ThemeRadii;
  shadows: ThemeShadows;
}

export interface ThemeDefinition {
  name: string;
  appearance: 'light' | 'dark';
  tokens: ThemeTokens;
}



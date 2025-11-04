import { ThemeDefinition } from './themeTypes';

const setVar = (root: HTMLElement, name: string, value?: string) => {
  if (value === undefined || value === null) return;
  root.style.setProperty(name, value);
};

export function applyTheme(theme: ThemeDefinition) {
  const root = document.documentElement;
  const { tokens } = theme;

  // Accent colors
  Object.entries(tokens.colors.accent).forEach(([tone, value]) => {
    setVar(root, `--accent-${tone}`, value);
    setVar(root, `--color-primary-${tone}`, value);
  });

  // Neutral colors
  Object.entries(tokens.colors.neutral).forEach(([tone, value]) => {
    setVar(root, `--neutral-${tone}`, value);
  });

  // Backgrounds
  setVar(root, '--bg-gradient', tokens.colors.background.gradient);
  setVar(root, '--surface-default', tokens.colors.background.surface);
  setVar(root, '--surface-alt', tokens.colors.background.surfaceAlt);

  // Toast
  setVar(root, '--toast-bg', tokens.colors.toast.background);
  setVar(root, '--toast-text', tokens.colors.toast.text);

  // Text
  setVar(root, '--text-primary', tokens.colors.text.primary);
  setVar(root, '--text-muted', tokens.colors.text.muted);
  setVar(root, '--text-inverse', tokens.colors.text.inverse);

  // Glass surfaces
  setVar(root, '--glass-surface', tokens.colors.glass.surface);
  setVar(root, '--glass-border', tokens.colors.glass.border);
  setVar(root, '--glass-shadow', tokens.colors.glass.shadow);
  setVar(root, '--glass-surface-dark', tokens.colors.glass.surfaceDark);
  setVar(root, '--glass-border-dark', tokens.colors.glass.borderDark);
  setVar(root, '--glass-shadow-dark', tokens.colors.glass.shadowDark);

  // Spacing
  Object.entries(tokens.spacing).forEach(([key, value]) => {
    setVar(root, `--spacing-${key}`, value);
  });

  // Radii
  Object.entries(tokens.radii).forEach(([key, value]) => {
    setVar(root, `--radius-${key}`, value);
  });

  // Shadows
  Object.entries(tokens.shadows).forEach(([key, value]) => {
    setVar(root, `--shadow-${key}`, value);
  });

  // Appearance
  root.dataset.theme = theme.appearance;
  root.classList.toggle('dark', theme.appearance === 'dark');
}



import type { Preview } from '@storybook/react';
import '../src/index.css';
import { applyTheme, defaultTheme } from '../src/design';

applyTheme(defaultTheme);

const preview: Preview = {
  parameters: {
    layout: 'centered',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
  },
};

export default preview;



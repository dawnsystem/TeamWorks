import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  args: {
    className: 'space-y-2',
    children: (
      <>
        <h3 className="text-lg font-semibold">Título</h3>
        <p className="text-sm text-gray-600">
          Las tarjetas se utilizan para agrupar información relacionada y mantienen padding y sombras consistentes.
        </p>
      </>
    ),
  },
};

export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {};

export const WithList: Story = {
  args: {
    children: (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">Tareas recientes</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>Actualizar documentación del proyecto</li>
          <li>Preparar demo para cliente</li>
          <li>Revisar PRs pendientes</li>
        </ul>
      </div>
    ),
  },
};



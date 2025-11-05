import type { Meta, StoryObj } from '@storybook/react';
import { Select } from './Select';

const meta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
  args: {
    children: (
      <>
        <option value="">Selecciona una opción</option>
        <option value="1">Opción 1</option>
        <option value="2">Opción 2</option>
        <option value="3">Opción 3</option>
      </>
    ),
  },
};

export default meta;

type Story = StoryObj<typeof Select>;

export const Default: Story = {};

export const WithLabel: Story = {
  render: (args: React.ComponentProps<typeof Select>) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">Prioridad</label>
      <Select {...args} />
    </div>
  ),
};



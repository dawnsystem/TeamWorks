import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  args: {
    placeholder: 'Introduce un valor',
  },
};

export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {};

export const WithLabel: Story = {
  render: (args: React.ComponentProps<typeof Input>) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">Nombre</label>
      <Input {...args} />
    </div>
  ),
  args: {
    placeholder: 'Ej: Proyecto Alpha',
  },
};



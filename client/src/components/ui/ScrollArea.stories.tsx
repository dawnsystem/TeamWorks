import type { Meta, StoryObj } from '@storybook/react';
import { ScrollArea } from './ScrollArea';

const meta: Meta<typeof ScrollArea> = {
  title: 'UI/ScrollArea',
  component: ScrollArea,
  args: {
    className: 'max-h-56 w-72 border border-gray-200 rounded-lg p-4',
    children: (
      <div className="space-y-2">
        {Array.from({ length: 20 }).map((_, index) => (
          <div key={index} className="text-sm text-gray-600">
            Elemento #{index + 1}
          </div>
        ))}
      </div>
    ),
  },
};

export default meta;

type Story = StoryObj<typeof ScrollArea>;

export const Default: Story = {};



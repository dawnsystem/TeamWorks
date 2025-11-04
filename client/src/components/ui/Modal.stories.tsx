import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Modal, Button, ScrollArea } from './';

const meta: Meta = {
  title: 'UI/Modal',
  component: Modal,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

export const Playground: Story = {
  render: () => {
    const [open, setOpen] = useState(true);

    return (
      <>
        <Button onClick={() => setOpen(true)}>Abrir modal</Button>
        <Modal
          isOpen={open}
          onClose={() => setOpen(false)}
          title="Modal de ejemplo"
          description="Este modal ilustra el layout estándar y el uso de ScrollArea."
          size="md"
          footer={
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => setOpen(false)}>Aceptar</Button>
            </div>
          }
        >
          <ScrollArea className="max-h-64 space-y-3">
            {Array.from({ length: 10 }).map((_, index) => (
              <p key={index} className="text-sm text-gray-600">
                Contenido de demostración #{index + 1}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </p>
            ))}
          </ScrollArea>
        </Modal>
      </>
    );
  },
};

export const Sizes: Story = {
  render: () => {
    const [open, setOpen] = useState<'sm' | 'md' | 'lg' | 'xl' | null>('sm');
    const sizes: Array<'sm' | 'md' | 'lg' | 'xl'> = ['sm', 'md', 'lg', 'xl'];

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {sizes.map((size) => (
            <Button key={size} onClick={() => setOpen(size)}>
              Abrir {size.toUpperCase()}
            </Button>
          ))}
        </div>

        {sizes.map((size) => (
          <Modal
            key={size}
            isOpen={open === size}
            onClose={() => setOpen(null)}
            title={`Modal ${size.toUpperCase()}`}
            size={size}
            footer={
              <Button onClick={() => setOpen(null)}>
                Cerrar
              </Button>
            }
          >
            <p className="text-sm text-gray-600">
              Esta variante usa `size="{size}"`.
            </p>
          </Modal>
        ))}
      </div>
    );
  },
};



import { HTMLAttributes } from 'react';

import type { PropsWithChildren } from 'react';

function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ');
}

export interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export function Card({ children, className, ...props }: PropsWithChildren<CardProps>) {
  return (
    <div className={cn('ui-card p-6', className)} {...props}>
      {children}
    </div>
  );
}



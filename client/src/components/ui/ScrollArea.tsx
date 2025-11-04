import { HTMLAttributes } from 'react';

import type { PropsWithChildren } from 'react';

function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(' ');
}

export interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {}

export function ScrollArea({ children, className, ...props }: PropsWithChildren<ScrollAreaProps>) {
  return (
    <div className={cn('scroll-area', className)} {...props}>
      <div className="scroll-area-content">{children}</div>
    </div>
  );
}



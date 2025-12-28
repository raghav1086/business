'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Mobile-optimized container with proper spacing and touch targets
 */
export function MobileContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'w-full px-4 py-4',
        'md:px-6 md:py-6',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Touch-friendly button wrapper for mobile
 */
export function TouchTarget({
  children,
  className,
  as: Component = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}) {
  return (
    <Component
      className={cn(
        'min-h-[44px] min-w-[44px]',
        'flex items-center justify-center',
        className
      )}
    >
      {children}
    </Component>
  );
}


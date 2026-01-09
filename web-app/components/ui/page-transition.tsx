'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = React.useState(false);
  const prevPathnameRef = React.useRef(pathname);

  // Only trigger transition animation when pathname changes (not on every render)
  React.useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 150);
      prevPathnameRef.current = pathname;
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  return (
    <div
      className={cn(
        'page-enter',
        isTransitioning && 'opacity-0',
        className
      )}
    >
      {children}
    </div>
  );
}



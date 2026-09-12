'use client';

import { useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

/** A short state transition, scoped and reverted on navigation. */
export function ViewTransition({
  children,
  stateKey,
  className = '',
}: {
  children: ReactNode;
  stateKey: string;
  className?: string;
}) {
  const scope = useRef<HTMLDivElement>(null);
  const initial = useRef(true);
  useGSAP(
    () => {
      if (initial.current) {
        initial.current = false;
        return;
      }
      const media = gsap.matchMedia();
      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          scope.current,
          { opacity: 0.65, y: 8 },
          {
            opacity: 1,
            y: 0,
            duration: 0.24,
            ease: 'power3.out',
            clearProps: 'transform,opacity',
          },
        );
      });
      return () => media.revert();
    },
    { scope, dependencies: [stateKey], revertOnUpdate: true },
  );
  return (
    <div className={className} ref={scope}>
      {children}
    </div>
  );
}

import { forwardRef } from 'react';
import type { HTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** 'grouped' surface (border + shadow) vs 'base' surface (hairline only). */
  on?: 'grouped' | 'base';
  padding?: 'default' | 'feature' | 'none';
}

const paddingClasses = { default: 'p-4', feature: 'p-5', none: '' } as const;

/** Resting card per design-system.md §6 — nearly flat; status never tints the card. */
export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { on = 'grouped', padding = 'default', className = '', children, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={`rounded-md bg-bg-elevated ${on === 'grouped' ? 'shadow-1' : 'border border-separator'}
        ${paddingClasses[padding]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

export interface InteractiveCardProps extends HTMLMotionProps<'div'> {
  padding?: 'default' | 'feature' | 'none';
  children?: ReactNode;
}

/** Clickable card: lifts to shadow-2 on hover, presses to 0.99. */
export const InteractiveCard = forwardRef<HTMLDivElement, InteractiveCardProps>(
  function InteractiveCard({ padding = 'default', className = '', children, ...props }, ref) {
    return (
      <motion.div
        ref={ref}
        role="button"
        tabIndex={0}
        whileTap={{ scale: 0.99 }}
        className={`cursor-pointer rounded-md bg-bg-elevated shadow-1
          transition-[box-shadow,transform] duration-instant ease-out
          hover:-translate-y-px hover:shadow-2
          focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-soft-2
          ${paddingClasses[padding]} ${className}`}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);

export function CardTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h3 className={`text-title-3 text-label-1 ${className}`}>{children}</h3>;
}

export function CardDescription({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`mt-1 text-callout text-label-2 ${className}`}>{children}</p>;
}

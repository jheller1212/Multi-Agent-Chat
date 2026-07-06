import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-fill text-accent-on hover:bg-accent-fill-hover active:bg-accent-pressed shadow-1',
  secondary:
    'bg-bg-elevated text-label-1 border border-separator-opaque hover:bg-fill-2 active:bg-fill-1',
  ghost: 'bg-transparent text-label-2 hover:bg-fill-2 hover:text-label-1 active:bg-fill-1',
  destructive:
    'bg-destructive text-white hover:opacity-90 active:opacity-80 shadow-1',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-callout font-medium gap-1.5 rounded-xs',
  md: 'h-8 px-3.5 text-callout font-semibold gap-1.5 rounded-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', icon, className = '', children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`inline-flex select-none items-center justify-center whitespace-nowrap
        transition-colors duration-instant ease-out
        active:scale-[0.97] motion-safe:transition-transform
        focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-soft-2
        disabled:pointer-events-none disabled:opacity-40
        ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
});

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/shared/utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline';
type ButtonSize = 'sm' | 'default' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:brightness-110 hover:scale-105 active:scale-95',
  secondary: 'bg-black/5 dark:bg-white/10 text-foreground border border-border hover:bg-black/10 dark:hover:bg-white/15',
  ghost: 'text-foreground-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5',
  destructive: 'bg-destructive text-white hover:bg-destructive/90',
  outline: 'border border-border text-foreground hover:bg-black/5 dark:hover:bg-white/5',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-[11px]',
  default: 'px-6 py-2.5 text-xs',
  lg: 'px-8 py-3.5 text-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'default', className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2',
          'font-bold uppercase tracking-[0.2em] rounded-full',
          'transition-all duration-300 ease-out',
          'disabled:opacity-50 disabled:pointer-events-none',
          'cursor-pointer press-scale',
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

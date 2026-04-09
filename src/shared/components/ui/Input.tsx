import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/shared/utils/cn';

// --- Input ---
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-');
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="label-style text-foreground-muted block">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-4 py-2.5 rounded-lg text-sm',
            'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700',
            'text-foreground placeholder:text-foreground-muted/50',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40',
            'transition-all duration-300',
            error && 'border-destructive/50 focus:ring-destructive/30',
            className,
          )}
          {...props}
        />
        {error && <p className="text-destructive text-xs">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

// --- Textarea ---
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-');
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="label-style text-foreground-muted block">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-4 py-2.5 rounded-xl text-sm min-h-[80px] resize-y',
            'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700',
            'text-foreground placeholder:text-foreground-muted/50',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40',
            'transition-all duration-300',
            error && 'border-destructive/50 focus:ring-destructive/30',
            className,
          )}
          {...props}
        />
        {error && <p className="text-destructive text-xs">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

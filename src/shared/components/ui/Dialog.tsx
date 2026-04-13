import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { useIsMobile } from '@/shared/hooks/useIsMobile';
import type { ReactNode } from 'react';

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </DialogPrimitive.Root>
  );
}

export function DialogContent({
  children,
  className,
  size = 'default',
}: {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}) {
  const isMobile = useIsMobile();

  const sizeStyles = {
    sm: 'max-w-sm',
    default: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0" />
      <DialogPrimitive.Content
        className={cn(
          isMobile
            ? [
                // ── Mobile: bottom sheet ──
                'fixed bottom-0 left-0 right-0 z-50',
                'w-full max-h-[90vh]',
                'bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800',
                'rounded-t-2xl p-6 pt-3',
                'shadow-2xl overflow-y-auto',
                'data-[state=open]:animate-slide-up data-[state=closed]:animate-slide-down',
                'safe-bottom',
              ]
            : [
                // ── Desktop: centered dialog ──
                'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
                'w-[calc(100%-2rem)]',
                sizeStyles[size],
                'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8',
                'shadow-2xl',
                'data-[state=open]:animate-in data-[state=closed]:animate-out',
                'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
                'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
                'data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
              ],
          className,
        )}
      >
        {/* Mobile drag handle */}
        {isMobile && (
          <div className="flex justify-center pb-3">
            <div className="drag-handle" />
          </div>
        )}
        {children}
        <DialogPrimitive.Close className={cn(
          'absolute rounded-lg p-1.5 text-foreground-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors',
          isMobile ? 'right-3 top-3' : 'right-4 top-4',
        )}>
          <X className="h-4 w-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

export function DialogHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mb-6', className)}>{children}</div>;
}

export function DialogTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <DialogPrimitive.Title
      className={cn('font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-foreground', className)}
    >
      {children}
    </DialogPrimitive.Title>
  );
}

export function DialogDescription({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <DialogPrimitive.Description className={cn('text-sm text-foreground-muted mt-1', className)}>
      {children}
    </DialogPrimitive.Description>
  );
}

export function DialogFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mt-8 flex items-center justify-end gap-3', className)}>
      {children}
    </div>
  );
}

export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

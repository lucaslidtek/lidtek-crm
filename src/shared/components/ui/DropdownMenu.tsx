import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { cn } from '@/shared/utils/cn';
import type { ReactNode } from 'react';

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;

export function DropdownMenuContent({
  children,
  className,
  ...props
}: DropdownMenuPrimitive.DropdownMenuContentProps & { children: ReactNode }) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        className={cn(
          'z-50 min-w-[12rem] overflow-hidden',
          'glass rounded-lg p-1',
          'shadow-[0_15px_40px_rgba(0,0,0,0.5)]',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
          'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
          className,
        )}
        sideOffset={4}
        {...props}
      >
        {children}
      </DropdownMenuPrimitive.Content>
    </DropdownMenuPrimitive.Portal>
  );
}

export function DropdownMenuItem({
  children,
  className,
  destructive,
  ...props
}: DropdownMenuPrimitive.DropdownMenuItemProps & { children: ReactNode; destructive?: boolean }) {
  return (
    <DropdownMenuPrimitive.Item
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
        'cursor-pointer select-none outline-none',
        'transition-colors duration-150',
        destructive
          ? 'text-destructive hover:bg-destructive/10 focus:bg-destructive/10'
          : 'text-foreground hover:bg-black/5 dark:hover:bg-white/5 focus:bg-black/5 dark:focus:bg-white/5',
        className,
      )}
      {...props}
    >
      {children}
    </DropdownMenuPrimitive.Item>
  );
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return (
    <DropdownMenuPrimitive.Separator className={cn('my-1 h-px bg-border-subtle', className)} />
  );
}

export function DropdownMenuLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <DropdownMenuPrimitive.Label className={cn('px-3 py-1.5 label-style text-foreground-muted', className)}>
      {children}
    </DropdownMenuPrimitive.Label>
  );
}

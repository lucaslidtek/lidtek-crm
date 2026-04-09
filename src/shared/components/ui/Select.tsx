import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import type { ReactNode } from 'react';

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  children: ReactNode;
}

export function Select({ value, onValueChange, placeholder, label, children }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <span className="label-style text-foreground-muted block">{label}</span>
      )}
      <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
        <SelectPrimitive.Trigger
          className={cn(
            'w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm',
            'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700',
            'text-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40',
            'transition-all duration-300',
            'data-[placeholder]:text-foreground-muted/50',
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon>
            <ChevronDown className="w-4 h-4 text-foreground-muted" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className={cn(
              'z-50 min-w-[8rem] overflow-hidden',
              'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl p-1',
              'shadow-lg',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
              'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
            )}
            position="popper"
            sideOffset={4}
          >
            <SelectPrimitive.Viewport className="p-1">
              {children}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  );
}

export function SelectItem({ value, children }: { value: string; children: ReactNode }) {
  return (
    <SelectPrimitive.Item
      value={value}
      className={cn(
        'relative flex items-center px-3 py-2 rounded-lg text-sm',
        'text-foreground cursor-pointer select-none',
        'hover:bg-zinc-100 dark:hover:bg-zinc-700 focus:bg-zinc-100 dark:focus:bg-zinc-700 focus:outline-none',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        'transition-colors duration-150',
      )}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2">
        <Check className="w-4 h-4 text-primary" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

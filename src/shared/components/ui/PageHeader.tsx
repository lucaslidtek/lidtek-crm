import { type ReactNode, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

interface PageHeaderProps {
  /** Controlled search value */
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  /** Placeholder — embed count here: e.g. "Buscar entre 42 leads..." */
  searchPlaceholder?: string;
  /** Filters, view toggles, action buttons — rendered on the right */
  actions?: ReactNode;
  className?: string;
}

/**
 * Utility bar that sits at the top of each list page.
 * Layout:  [🔍 search — grows]  [actions — shrinks]
 *
 * The page TITLE lives in the TopBar, not here.
 * Pass the item count inside `searchPlaceholder` for context without clutter.
 */
export function PageHeader({
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Buscar...',
  actions,
  className,
}: PageHeaderProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasSearch = onSearchChange !== undefined;
  const isActive = focused || !!searchQuery;

  return (
    <div className={cn('flex items-center gap-2 sm:gap-3 mb-6 flex-wrap sm:flex-nowrap', className)}>

      {/* ── Search — primary, takes available space ── */}
      {hasSearch && (
        <div className="relative flex-1 min-w-[180px] max-w-sm w-full sm:w-auto">
          {/* Icon */}
          <Search
            className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none transition-colors duration-150',
              isActive ? 'text-primary' : 'text-foreground-muted'
            )}
          />

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={searchPlaceholder}
            className={cn(
              'w-full h-9 pl-9 pr-8 rounded-lg text-sm transition-all duration-200',
              'border bg-black/[0.04] dark:bg-white/[0.04]',
              'text-foreground placeholder:text-foreground-muted/50',
              'focus:outline-none',
              isActive
                ? 'border-primary/30 ring-2 ring-primary/10 bg-background dark:bg-background'
                : 'border-border hover:bg-black/[0.06] dark:hover:bg-white/[0.06] hover:border-border'
            )}
          />

          {/* Clear button */}
          {searchQuery && (
            <button
              onClick={() => {
                onSearchChange('');
                inputRef.current?.focus();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-foreground-muted hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* ── Actions — grouped right, never wrap individually ── */}
      {actions && (
        <div className="flex items-center gap-1.5 sm:gap-2 ml-auto shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

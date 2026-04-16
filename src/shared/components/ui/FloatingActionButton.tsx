import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/shared/utils/cn';

interface FloatingActionButtonProps {
  onClick: () => void;
  icon: ReactNode;
  className?: string;
}

/**
 * Mobile-only floating action button (FAB).
 * Uses createPortal to escape parent transform/overflow contexts (same pattern as Dashboard).
 * Renders as a plain circle — no label, no animation.
 */
export function FloatingActionButton({ onClick, icon, className }: FloatingActionButtonProps) {
  return createPortal(
    <button
      onClick={onClick}
      style={{ WebkitTapHighlightColor: 'transparent' }}
      className={cn(
        'fixed right-4 z-40 w-14 h-14 rounded-full',
        'bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)]',
        'bg-primary text-white',
        'flex items-center justify-center',
        'shadow-xl press-scale',
        className,
      )}
    >
      {icon}
    </button>,
    document.body,
  );
}

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/shared/utils/cn';

interface FloatingActionButtonProps {
  onClick: () => void;
  icon: ReactNode;
  label?: string;
  className?: string;
}

/**
 * Mobile-only floating action button (FAB).
 * Sits above the bottom nav bar (safe-area aware via `bottom-20`).
 * On desktop this renders nothing.
 */
export function FloatingActionButton({ onClick, icon, label, className }: FloatingActionButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      className={cn(
        // Positioning — above the bottom nav (h-16 nav + 4 gap = ~72px → bottom-20)
        'fixed bottom-20 right-4 z-40',
        // Shape & color
        'flex items-center gap-2 px-4 h-12 rounded-2xl shadow-xl',
        'bg-primary text-white',
        'active:scale-95 transition-transform',
        className,
      )}
    >
      <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
        {icon}
      </span>
      {label && (
        <span className="text-sm font-semibold tracking-tight whitespace-nowrap">
          {label}
        </span>
      )}
    </motion.button>
  );
}

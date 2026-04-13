import { type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shared/utils/cn';
import { useIsMobile } from '@/shared/hooks/useIsMobile';

interface MobileDrawerWrapperProps {
  /** Unique key for AnimatePresence */
  itemKey: string | null;
  /** Whether the drawer is open (item !== null) */
  open: boolean;
  onClose: () => void;
  /** Desktop width — e.g. 420 or 380 */
  desktopWidth?: number;
  children: ReactNode;
}

/**
 * Wraps a detail drawer to render as:
 * - Desktop: inline side panel with animated width
 * - Mobile: fullscreen overlay bottom sheet via Portal (escapes transform stacking context)
 */
export function MobileDrawerWrapper({
  itemKey,
  open,
  onClose,
  desktopWidth = 420,
  children,
}: MobileDrawerWrapperProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    // Portal renders directly on document.body, escaping any parent
    // transform/stacking context (e.g. motion.main in PageLayout)
    return createPortal(
      <AnimatePresence>
        {open && (
          <motion.div
            key={`mobile-overlay-${itemKey}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'absolute bottom-0 left-0 right-0',
                'max-h-[92vh] h-[92vh]',
                'bg-white dark:bg-zinc-900',
                'rounded-t-2xl',
                'flex flex-col overflow-hidden',
                'shadow-2xl',
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="drag-handle" />
              </div>

              {/* Content — the drawer's own header provides the close button */}
              <div className="flex-1 overflow-y-auto overscroll-contain safe-bottom">
                {children}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body,
    );
  }

  return (
    <AnimatePresence mode="wait">
      {open && (
        <motion.aside
          key={`desktop-${itemKey}`}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: desktopWidth, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="flex-shrink-0 rounded-xl border border-zinc-200/60 dark:border-zinc-700/40 bg-white dark:bg-zinc-900 overflow-hidden"
          style={{ height: '100%' }}
        >
          <div
            className="h-full flex flex-col overflow-y-auto"
            style={{ width: desktopWidth }}
          >
            {children}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}


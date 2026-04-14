import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { TASK_STATUSES } from '@/shared/lib/constants';
import type { TaskStatus } from '@/shared/types/models';

interface StatusChipProps {
  status: TaskStatus;
  onStatusChange: (status: TaskStatus) => void;
}

export function StatusChip({ status, onStatusChange }: StatusChipProps) {
  const [open, setOpen] = useState(false);
  const chipRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const current = TASK_STATUSES.find(s => s.id === status);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (
        chipRef.current && !chipRef.current.contains(e.target as Node) &&
        popoverRef.current && !popoverRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  // Position
  const [pos, setPos] = useState({ top: 0, left: 0 });
  useEffect(() => {
    if (open && chipRef.current) {
      const rect = chipRef.current.getBoundingClientRect();
      const popoverHeight = 180; // approximate
      const viewportH = window.innerHeight;

      // Show above if not enough space below
      const showAbove = rect.bottom + popoverHeight > viewportH && rect.top > popoverHeight;

      setPos({
        top: showAbove ? rect.top - popoverHeight - 4 : rect.bottom + 4,
        left: Math.min(rect.left, window.innerWidth - 180),
      });
    }
  }, [open]);

  const handleSelect = (newStatus: TaskStatus) => {
    if (newStatus !== status) {
      onStatusChange(newStatus);
    }
    setOpen(false);
  };

  return (
    <>
      <button
        ref={chipRef}
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5',
          'text-[10px] font-semibold uppercase tracking-wider rounded-full',
          'whitespace-nowrap transition-all press-scale cursor-pointer active:scale-95',
          open ? 'ring-2 ring-primary/30' : ''
        )}
        style={{
          backgroundColor: `${current?.color}20`,
          color: current?.color,
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: current?.color }}
        />
        {current?.label}
      </button>

      {open && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            zIndex: 9999,
            pointerEvents: 'auto',
          }}
          className="w-44 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl shadow-black/20 animate-in fade-in-0 zoom-in-95 duration-150"
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div className="px-2.5 py-1.5 mb-0.5">
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">
              Alterar status
            </span>
          </div>
          {TASK_STATUSES.map(s => {
            const isActive = s.id === status;
            return (
              <button
                key={s.id}
                onClick={(e) => { e.stopPropagation(); handleSelect(s.id as TaskStatus); }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-medium transition-colors cursor-pointer',
                  isActive
                    ? 'bg-zinc-50 dark:bg-zinc-800'
                    : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60',
                )}
              >
                <span
                  className={cn(
                    'w-2.5 h-2.5 rounded-full flex-shrink-0',
                    isActive && 'ring-2 ring-offset-1 ring-offset-white dark:ring-offset-zinc-900',
                  )}
                  style={{
                    backgroundColor: s.color,
                    ...(isActive ? { ['--tw-ring-color' as string]: s.color } : {}),
                  }}
                />
                <span
                  className="flex-1 text-left"
                  style={{ color: isActive ? s.color : undefined }}
                >
                  {s.label}
                </span>
                {isActive && (
                  <Check
                    className="w-3.5 h-3.5 flex-shrink-0"
                    style={{ color: s.color }}
                  />
                )}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </>
  );
}

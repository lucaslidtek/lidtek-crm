import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import type { User } from '@/shared/types/models';
import { createPortal } from 'react-dom';

interface MultiUserSelectProps {
  label?: string;
  users: User[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}

export function MultiUserSelect({
  label,
  users,
  selectedIds,
  onChange,
  placeholder = 'Selecione responsáveis...',
}: MultiUserSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedUsers = users.filter(u => selectedIds.includes(u.id));

  const toggleUser = (userId: string) => {
    if (selectedIds.includes(userId)) {
      onChange(selectedIds.filter(id => id !== userId));
    } else {
      onChange([...selectedIds, userId]);
    }
  };

  const removeUser = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedIds.filter(id => id !== userId));
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (
        containerRef.current && !containerRef.current.contains(e.target as Node) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  // Position the dropdown
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  useEffect(() => {
    if (open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [open]);

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-xs font-medium text-foreground-muted">{label}</label>
      )}
      <div
        ref={containerRef}
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center flex-wrap gap-1.5 min-h-[38px] px-3 py-1.5 rounded-lg border cursor-pointer transition-all',
          'bg-white dark:bg-zinc-900 text-sm',
          open
            ? 'border-primary ring-2 ring-primary/20'
            : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600',
        )}
      >
        {selectedUsers.length === 0 && (
          <span className="text-foreground-muted/50 text-sm select-none">{placeholder}</span>
        )}
        {selectedUsers.map(user => (
          <span
            key={user.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium"
          >
            <span className="w-4 h-4 rounded-[4px] bg-primary/20 flex items-center justify-center text-[7px] font-bold flex-shrink-0">
              {user.initials}
            </span>
            {user.name.split(' ')[0]}
            <button
              onClick={(e) => removeUser(user.id, e)}
              className="ml-0.5 hover:bg-primary/20 rounded-sm p-0.5 transition-colors cursor-pointer"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        ))}
        <ChevronDown className={cn(
          'w-4 h-4 text-foreground-muted ml-auto flex-shrink-0 transition-transform',
          open && 'rotate-180',
        )} />
      </div>

      {open && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: dropdownPos.top,
            left: dropdownPos.left,
            width: dropdownPos.width,
            zIndex: 9999,
            pointerEvents: 'auto',
          }}
          className="py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl shadow-black/15 max-h-48 overflow-y-auto animate-in fade-in-0 zoom-in-95 duration-150"
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {users.map(user => {
            const isSelected = selectedIds.includes(user.id);
            return (
              <button
                key={user.id}
                onClick={(e) => { e.stopPropagation(); toggleUser(user.id); }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors cursor-pointer',
                  isSelected
                    ? 'bg-primary/5 text-primary'
                    : 'text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-800',
                )}
              >
                <div className={cn(
                  'w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold flex-shrink-0',
                  isSelected
                    ? 'bg-primary/20 text-primary'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-foreground-muted',
                )}>
                  {user.initials}
                </div>
                <span className="truncate flex-1 text-left">{user.name}</span>
                {isSelected && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
              </button>
            );
          })}
          {users.length === 0 && (
            <div className="px-3 py-4 text-sm text-foreground-muted text-center">
              Nenhum membro disponível
            </div>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}

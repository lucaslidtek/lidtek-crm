import { useState, useEffect } from 'react';
import { X, Palette, Check, Trash2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { cn } from '@/shared/utils/cn';
import type { FunnelColumn } from '@/shared/types/models';

interface ColumnManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  column?: FunnelColumn | null;
  onSave: (data: { label: string; color: string }) => Promise<void>;
  onDelete?: () => Promise<void>;
  leadsInColumn?: number;
}

const COLOR_PRESETS = [
  '#A3A3A3', '#6B7280', '#374151',
  '#EF4444', '#F97316', '#F59E0B',
  '#84CC16', '#22C55E', '#10B981',
  '#14B8A6', '#06B6D4', '#0EA5E9',
  '#3B82F6', '#6366F1', '#8B5CF6',
  '#A855F7', '#D946EF', '#EC4899',
  '#F43F5E', '#059669', '#5A4FFF',
  '#6580E1', '#7B73FF', '#0284C7',
];

export function ColumnManagerDialog({
  open,
  onOpenChange,
  column,
  onSave,
  onDelete,
  leadsInColumn = 0,
}: ColumnManagerDialogProps) {
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#5A4FFF');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!column;

  useEffect(() => {
    if (open) {
      setLabel(column?.label ?? '');
      setColor(column?.color ?? '#5A4FFF');
      setError(null);
      setConfirmDelete(false);
    }
  }, [open, column]);

  const handleSave = async () => {
    if (!label.trim()) {
      setError('Título é obrigatório');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({ label: label.trim(), color });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await onDelete?.();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-[110]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
          />

          {/* Dialog */}
          <motion.div
            className="fixed inset-0 z-[111] flex items-center justify-center p-4 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-zinc-900 w-full max-w-[420px] rounded-xl overflow-hidden pointer-events-auto shadow-2xl border border-zinc-200 dark:border-zinc-800"
              initial={{ y: 20, scale: 0.96 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.96 }}
              transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  {isEditing ? 'Editar Coluna' : 'Nova Coluna'}
                </h2>
                <button
                  onClick={() => onOpenChange(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="px-5 space-y-5 pb-5">
                {/* Preview */}
                <div className="flex items-center gap-2.5 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0 transition-colors duration-200"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                    {label || 'Título da coluna'}
                  </span>
                  <span className="text-xs text-zinc-400 ml-auto bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full font-medium">
                    0
                  </span>
                </div>

                {/* Title */}
                <Input
                  label="Título"
                  placeholder="Ex: Qualificação"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
                  autoFocus
                />

                {/* Color Picker */}
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5" />
                    Cor
                  </label>
                  <div className="grid grid-cols-8 gap-2 mt-2">
                    {COLOR_PRESETS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setColor(c)}
                        className={cn(
                          'w-8 h-8 rounded-lg transition-all duration-150 cursor-pointer flex items-center justify-center',
                          'hover:scale-110 hover:shadow-md',
                          color === c && 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 scale-110',
                        )}
                        style={{
                          backgroundColor: c,
                          ['--tw-ring-color' as string]: c,
                        }}
                      >
                        {color === c && (
                          <Check className="w-3.5 h-3.5 text-white drop-shadow-sm" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Custom color */}
                  <div className="flex items-center gap-2 mt-3">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-8 h-8 rounded-lg border-0 cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="flex-1 text-xs px-2 py-1.5 rounded-md bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 outline-none focus:ring-1 focus:ring-primary/30 text-zinc-700 dark:text-zinc-300 font-mono uppercase"
                      maxLength={7}
                      placeholder="#000000"
                    />
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <p className="text-xs text-red-500 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">{error}</p>
                )}

                {/* Delete Section — only for non-default columns */}
                {isEditing && onDelete && !column?.isDefault && (
                  <div className={cn(
                    'rounded-lg p-3 border transition-colors',
                    confirmDelete
                      ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                      : 'border-zinc-100 dark:border-zinc-800',
                  )}>
                    {confirmDelete ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-xs font-semibold">Confirmar exclusão?</span>
                        </div>
                        {leadsInColumn > 0 && (
                          <p className="text-[11px] text-red-600/80 dark:text-red-400/80">
                            {leadsInColumn} lead{leadsInColumn > 1 ? 's' : ''} será{leadsInColumn > 1 ? 'ão' : ''} movido{leadsInColumn > 1 ? 's' : ''} para a primeira coluna.
                          </p>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmDelete(false)}
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="flex-1"
                          >
                            {deleting ? 'Excluindo...' : 'Excluir'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 text-xs text-zinc-400 hover:text-red-500 transition-colors cursor-pointer w-full"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Excluir esta coluna
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30">
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={!label.trim() || saving}>
                  {saving ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar Coluna'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  );
}

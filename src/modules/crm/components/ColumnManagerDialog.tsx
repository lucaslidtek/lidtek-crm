import { useState, useEffect } from 'react';
import { X, Palette, Check, Trash2, Zap, Trophy, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import { cn } from '@/shared/utils/cn';
import type { FunnelColumn, ColumnBehavior } from '@/shared/types/models';

interface ColumnManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  column?: FunnelColumn | null;
  onSave: (data: { label: string; color: string; behavior: ColumnBehavior }) => Promise<void>;
  onDelete?: () => Promise<void>;
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
}: ColumnManagerDialogProps) {
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('#5A4FFF');
  const [behavior, setBehavior] = useState<ColumnBehavior>('active');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!column;

  useEffect(() => {
    if (open) {
      setLabel(column?.label ?? '');
      setColor(column?.color ?? '#5A4FFF');
      setBehavior(column?.behavior ?? 'active');
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
      await onSave({ label: label.trim(), color, behavior });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSaving(false);
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
              className="bg-white dark:bg-zinc-900 w-full max-w-[420px] max-h-[90vh] rounded-xl overflow-hidden pointer-events-auto shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col"
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
              <div className="px-5 space-y-5 pb-5 overflow-y-auto">
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

                {/* Behavior Selector */}
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    Comportamento
                  </label>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mb-2.5">
                    O que acontece quando um lead é movido para esta coluna?
                  </p>
                  <div className="space-y-1.5">
                    {([
                      {
                        value: 'active' as ColumnBehavior,
                        icon: <Zap className="w-3.5 h-3.5" />,
                        label: 'Pipeline ativo',
                        desc: 'Lead permanece ativo. Projeto segue visível normalmente.',
                        accent: 'text-blue-500',
                        bg: 'bg-blue-500/10',
                      },
                      {
                        value: 'won' as ColumnBehavior,
                        icon: <Trophy className="w-3.5 h-3.5" />,
                        label: 'Negócio ganho',
                        desc: 'Lead é dado como ganho. Permite conversão para projeto.',
                        accent: 'text-emerald-500',
                        bg: 'bg-emerald-500/10',
                      },
                      {
                        value: 'lost' as ColumnBehavior,
                        icon: <XCircle className="w-3.5 h-3.5" />,
                        label: 'Perdido / Cancelado',
                        desc: 'Lead é inativado. Projeto associado será arquivado automaticamente.',
                        accent: 'text-red-500',
                        bg: 'bg-red-500/10',
                      },
                    ]).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setBehavior(opt.value)}
                        className={cn(
                          'w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left cursor-pointer',
                          behavior === opt.value
                            ? `border-current ${opt.accent} ${opt.bg}`
                            : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700',
                        )}
                      >
                        <div className={cn(
                          'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                          behavior === opt.value ? opt.bg : 'bg-zinc-100 dark:bg-zinc-800',
                        )}>
                          <span className={behavior === opt.value ? opt.accent : 'text-zinc-400'}>{opt.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              'text-xs font-semibold',
                              behavior === opt.value ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400',
                            )}>
                              {opt.label}
                            </span>
                            {behavior === opt.value && (
                              <Check className="w-3 h-3 text-current" />
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 leading-relaxed">{opt.desc}</p>
                        </div>
                      </button>
                    ))}
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
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="flex items-center gap-2 text-xs text-zinc-400 hover:text-red-500 transition-colors cursor-pointer w-full"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Excluir esta coluna
                    </button>
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

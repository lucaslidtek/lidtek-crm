import { X, Calendar, Mail, Phone, FileText, MessageSquare, Briefcase, ArrowRight, Tag, User, DollarSign, Edit3, Check, Repeat, Zap } from 'lucide-react';
import { WhatsAppIcon } from '@/shared/components/icons/WhatsAppIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shared/utils/cn';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { useStore } from '@/shared/lib/store';
import { usePermissions } from '@/shared/hooks/usePermissions';
import { FUNNEL_STAGES, BILLING_TYPES, BILLING_CYCLES, getStageLabel, getStageColor } from '@/shared/lib/constants';
import type { Lead, Interaction, ProjectType, BillingType, BillingCycle } from '@/shared/types/models';
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'wouter';

interface LeadDetailDrawerProps {
  lead: Lead | null;
  onClose: () => void;
}

const interactionIcons: Record<Interaction['type'], typeof Mail> = {
  email: Mail,
  call: Phone,
  meeting: Calendar,
  note: FileText,
};

const interactionLabels: Record<Interaction['type'], string> = {
  email: 'E-mail',
  call: 'Ligação',
  meeting: 'Reunião',
  note: 'Nota',
};

export function LeadDetailDrawer({ lead, onClose }: LeadDetailDrawerProps) {
  const { getUserById, updateLead, convertLeadToProject, projects, users } = useStore();
  const { canEdit, canEditAll } = usePermissions();
  const [, setLocation] = useLocation();
  const [converting, setConverting] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<ProjectType>('oneshot');

  if (!lead) return null;

  // Permission check: can this user edit this specific lead?
  const editable = canEdit(lead.ownerId);

  const stageColor = getStageColor(FUNNEL_STAGES, lead.stage);
  const stageLabel = getStageLabel(FUNNEL_STAGES, lead.stage);
  const isOverdue = lead.nextContactDate && new Date(lead.nextContactDate) < new Date();
  const hasProject = projects.some(p => p.leadId === lead.id);
  const canConvert = (lead.stage === 'contract_signed' || lead.stage === 'contract_sent') && !hasProject;

  const handleConvert = async () => {
    setConverting(true);
    try {
      await convertLeadToProject(lead.id, selectedType);
      onClose();
      setLocation('/projects');
    } catch (err) {
      console.error('Error converting lead:', err);
    } finally {
      setConverting(false);
    }
  };

  const handleFieldSave = async (field: string, value: string) => {
    const updates: Partial<Lead> = {};
    if (field === 'name') updates.name = value;
    if (field === 'contact') updates.contact = value;
    if (field === 'phone') updates.phone = value;
    if (field === 'notes') updates.notes = value;
    if (field === 'estimatedValue') updates.estimatedValue = parseFloat(value.replace(/\D/g, '')) || 0;
    if (field === 'solutionType') updates.solutionType = value;
    if (field === 'ownerId') updates.ownerId = value;
    if (field === 'billingType') {
      updates.billingType = value as BillingType;
      if (value !== 'recurring') updates.billingCycle = undefined;
    }
    if (field === 'billingCycle') updates.billingCycle = value as BillingCycle;
    await updateLead(lead.id, updates);
  };

  const formattedValue = lead.estimatedValue
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.estimatedValue)
    : 'Sem valor';

  return createPortal(
    <AnimatePresence>
      {lead && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 z-[99]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-[100] flex items-start justify-center pt-[6vh] px-4 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white dark:bg-zinc-900 w-full max-w-[900px] max-h-[82vh] rounded-xl overflow-hidden flex flex-col pointer-events-auto shadow-2xl"
              initial={{ y: 40, scale: 0.96 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 40, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* ═══ Header ═══ */}
              <div className="px-6 pt-5 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge color={stageColor}>{stageLabel}</Badge>
                    {hasProject && <Badge variant="done">Projeto vinculado</Badge>}
                  </div>
                  <button
                    onClick={onClose}
                    className="p-1.5 -mr-1.5 -mt-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <EditableText
                  value={lead.name}
                  onSave={(v) => handleFieldSave('name', v)}
                  className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight"
                  readOnly={!editable}
                />
                <EditableText
                  value={lead.contact}
                  onSave={(v) => handleFieldSave('contact', v)}
                  className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5"
                  readOnly={!editable}
                />
              </div>

              {/* ═══ Body — Two columns ═══ */}
              <div className="flex flex-1 overflow-hidden">

                {/* ── Left: Main content ── */}
                <div className="flex-1 p-6 space-y-5 overflow-y-auto">

                  {/* Info row */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <FieldCard
                      icon={<DollarSign className="w-3.5 h-3.5" />}
                      label="Valor"
                      value={formattedValue}
                      editable={editable}
                      onSave={(v) => handleFieldSave('estimatedValue', v)}
                    />
                    <FieldCard
                      icon={<Phone className="w-3.5 h-3.5" />}
                      label="Telefone"
                      value={lead.phone || ''}
                      editable={editable}
                      onSave={(v) => handleFieldSave('phone', v)}
                      action={lead.phone ? (
                        <a 
                          href={`https://wa.me/55${lead.phone.replace(/\D/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center justify-center w-5 h-5 rounded hover:bg-emerald-100 text-emerald-600 dark:text-emerald-400 dark:hover:bg-emerald-900/30 transition-colors"
                          title="Abrir no WhatsApp"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5" />
                        </a>
                      ) : undefined}
                    />
                    <FieldCard
                      icon={<Tag className="w-3.5 h-3.5" />}
                      label="Origem"
                      value={lead.origin || '—'}
                    />
                    <OwnerFieldCard
                      ownerId={lead.ownerId}
                      users={users}
                      getUserById={getUserById}
                      onSave={(id) => handleFieldSave('ownerId', id)}
                    />
                    <FieldCard
                      icon={<Calendar className="w-3.5 h-3.5" />}
                      label="Próx. contato"
                      value={lead.nextContactDate ? new Date(lead.nextContactDate).toLocaleDateString('pt-BR') : '—'}
                      alert={!!isOverdue}
                    />
                    <BillingFieldCard
                      billingType={lead.billingType}
                      billingCycle={lead.billingCycle}
                      onSaveBillingType={(v) => handleFieldSave('billingType', v)}
                      onSaveBillingCycle={(v) => handleFieldSave('billingCycle', v)}
                    />
                  </div>

                  {/* Solution type */}
                  {lead.solutionType && (
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1">Tipo de solução</span>
                      <EditableText
                        value={lead.solutionType}
                        onSave={(v) => handleFieldSave('solutionType', v)}
                        className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                        readOnly={!editable}
                      />
                    </div>
                  )}

                  {/* Description / Notes */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Edit3 className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Observações</span>
                    </div>
                    <EditableTextArea
                      value={lead.notes || ''}
                      placeholder="Adicione uma descrição mais detalhada..."
                      onSave={(v) => handleFieldSave('notes', v)}
                      readOnly={!editable}
                    />
                  </div>

                  {/* Loss Reason */}
                  {lead.lossReason && (
                    <div className="rounded-lg p-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-red-500 block mb-1">Motivo da Perda</span>
                      <p className="text-sm text-zinc-700 dark:text-zinc-300">{lead.lossReason}</p>
                    </div>
                  )}

                  {/* Convert to Project — only admin/gestor can convert */}
                  {canConvert && canEditAll && (
                    <div className="rounded-lg p-4 space-y-3 bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Converter em Projeto</h3>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedType('recurring')}
                          className={cn(
                            'flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all border cursor-pointer',
                            selectedType === 'recurring'
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                              : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800',
                          )}
                        >Recorrente</button>
                        <button
                          onClick={() => setSelectedType('oneshot')}
                          className={cn(
                            'flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all border cursor-pointer',
                            selectedType === 'oneshot'
                              ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
                              : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800',
                          )}
                        >Único</button>
                      </div>
                      <Button size="sm" onClick={handleConvert} disabled={converting} className="w-full">
                        {converting ? 'Convertendo...' : 'Criar Projeto'}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}

                  {/* Linked project */}
                  {hasProject && (
                    <div className="rounded-lg p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-3">
                      <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Projeto criado deste lead</p>
                        <button onClick={() => { onClose(); setLocation('/projects'); }} className="text-[11px] text-violet-600 dark:text-violet-400 hover:underline cursor-pointer">
                          Ver em Projetos →
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Right: Activity sidebar ── */}
                <div className="w-[280px] flex-shrink-0 border-l border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 p-4 space-y-4 overflow-y-auto">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-zinc-400" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Atividade</h3>
                    <span className="text-[10px] text-zinc-400 ml-auto bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded-full font-medium">
                      {lead.interactions.length}
                    </span>
                  </div>

                  {lead.interactions.length > 0 ? (
                    <div className="space-y-3">
                      {[...lead.interactions].reverse().map((interaction) => {
                        const Icon = interactionIcons[interaction.type] || MessageSquare;
                        const user = getUserById(interaction.userId);
                        return (
                          <div key={interaction.id} className="flex gap-2.5">
                            <div className="flex-shrink-0 w-7 h-7 rounded-md bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mt-0.5">
                              <Icon className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                                  {interactionLabels[interaction.type]}
                                </span>
                                <span className="text-[9px] text-zinc-400">
                                  {new Date(interaction.date).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                {interaction.content}
                              </p>
                              {user && (
                                <span className="text-[9px] text-zinc-400/70 mt-0.5 block">
                                  por {user.name}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[11px] text-zinc-400 text-center py-6">Nenhuma atividade.</p>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

/* ═══ Inline Editable Text ═══ */
function EditableText({ value, onSave, className, placeholder, readOnly }: {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  placeholder?: string;
  readOnly?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() !== value) onSave(draft.trim());
  };

  if (readOnly) {
    return <p className={className}>{value || <span className="text-zinc-400 italic">{placeholder || '—'}</span>}</p>;
  }

  if (editing) {
    return (
      <input
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
        className={cn(className, 'bg-transparent outline-none border-b-2 border-violet-400 w-full')}
        placeholder={placeholder}
      />
    );
  }

  return (
    <p
      onClick={() => setEditing(true)}
      className={cn(className, 'cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded px-1 -mx-1 transition-colors')}
      title="Clique para editar"
    >
      {value || <span className="text-zinc-400 italic">{placeholder || 'Clique para editar'}</span>}
    </p>
  );
}

/* ═══ Inline Editable TextArea ═══ */
function EditableTextArea({ value, onSave, placeholder, readOnly }: {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing && ref.current) { ref.current.focus(); ref.current.style.height = 'auto'; ref.current.style.height = ref.current.scrollHeight + 'px'; } }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() !== value) onSave(draft.trim());
  };

  if (readOnly) {
    return (
      <div className="text-sm leading-relaxed rounded-lg p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-transparent min-h-[80px]">
        {value ? <p className="text-zinc-700 dark:text-zinc-300">{value}</p> : <p className="text-zinc-400 italic">{placeholder || '—'}</p>}
      </div>
    );
  }

  if (editing) {
    return (
      <textarea
        ref={ref}
        value={draft}
        onChange={(e) => { setDraft(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
        className="w-full text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed bg-white dark:bg-zinc-800 border border-violet-300 dark:border-violet-600 rounded-lg p-3 outline-none resize-none min-h-[80px]"
        placeholder={placeholder}
      />
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className="text-sm leading-relaxed rounded-lg p-3 cursor-pointer transition-colors bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 min-h-[80px]"
      title="Clique para editar"
    >
      {value ? (
        <p className="text-zinc-700 dark:text-zinc-300">{value}</p>
      ) : (
        <p className="text-zinc-400 italic">{placeholder || 'Clique para adicionar...'}</p>
      )}
    </div>
  );
}

/* ═══ Field Card ═══ */
function FieldCard({ icon, label, value, alert, editable, onSave, action }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  alert?: boolean;
  editable?: boolean;
  onSave?: (value: string) => void;
  action?: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const commit = () => {
    setEditing(false);
    if (draft.trim() !== value && onSave) onSave(draft.trim());
  };

  return (
    <div
      className={cn(
        'rounded-lg p-2.5 border transition-colors relative group',
        alert
          ? 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30'
          : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800',
        editable && !editing && 'hover:border-violet-200 dark:hover:border-violet-700 cursor-pointer',
      )}
      onClick={(e) => { if (editable && !editing) { e.preventDefault(); setEditing(true); } }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <span className={alert ? 'text-red-500' : 'text-zinc-400'}>{icon}</span>
          <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{label}</span>
        </div>
        {action && (
          <div onClick={(e) => e.stopPropagation()}>{action}</div>
        )}
      </div>
      {editing ? (
        <input
          ref={ref}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
          className="text-sm font-medium bg-transparent outline-none border-b border-violet-400 w-full text-zinc-800 dark:text-zinc-200"
        />
      ) : (
        <p className={cn('text-sm font-medium truncate', alert ? 'text-red-600 dark:text-red-400' : 'text-zinc-800 dark:text-zinc-200')}>
          {value || (editable ? <span className="text-zinc-400 font-normal italic">Adicionar...</span> : '—')}
        </p>
      )}
    </div>
  );
}

/* ═══ Billing Field Card ═══ */
function BillingFieldCard({ billingType, billingCycle, onSaveBillingType, onSaveBillingCycle }: {
  billingType?: BillingType;
  billingCycle?: BillingCycle;
  onSaveBillingType: (value: string) => void;
  onSaveBillingCycle: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);

  const typeLabel = billingType ? getStageLabel(BILLING_TYPES, billingType) : null;
  const cycleLabel = billingType === 'recurring' && billingCycle ? getStageLabel(BILLING_CYCLES, billingCycle) : null;
  const displayText = typeLabel
    ? `${typeLabel}${cycleLabel ? ` · ${cycleLabel}` : ''}`
    : '';

  if (editing) {
    return (
      <div className="rounded-lg p-2.5 border border-violet-200 dark:border-violet-700 bg-zinc-50 dark:bg-zinc-800/50 space-y-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-400"><Repeat className="w-3.5 h-3.5" /></span>
            <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Cobrança</span>
          </div>
          <button
            onClick={() => setEditing(false)}
            className="text-[9px] text-violet-500 hover:text-violet-700 font-medium cursor-pointer"
          >
            Fechar
          </button>
        </div>

        {/* Billing Type Selector */}
        <div className="flex gap-1">
          {BILLING_TYPES.map((bt) => (
            <button
              key={bt.id}
              onClick={() => onSaveBillingType(bt.id)}
              className={cn(
                'flex-1 px-2 py-1.5 rounded-md text-[10px] font-semibold transition-all border cursor-pointer',
                billingType === bt.id
                  ? bt.id === 'recurring'
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                    : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
                  : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800',
              )}
            >
              {bt.label}
            </button>
          ))}
        </div>

        {/* Billing Cycle Selector (only for recurring) */}
        {billingType === 'recurring' && (
          <div className="flex gap-1">
            {BILLING_CYCLES.map((bc) => (
              <button
                key={bc.id}
                onClick={() => onSaveBillingCycle(bc.id)}
                className={cn(
                  'flex-1 px-2 py-1.5 rounded-md text-[10px] font-semibold transition-all border cursor-pointer',
                  billingCycle === bc.id
                    ? 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800 text-violet-700 dark:text-violet-400'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800',
                )}
              >
                {bc.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className="rounded-lg p-2.5 border transition-colors bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800 hover:border-violet-200 dark:hover:border-violet-700 cursor-pointer"
      onClick={() => setEditing(true)}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-zinc-400">
          {billingType === 'recurring' ? <Repeat className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
        </span>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Cobrança</span>
      </div>
      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
        {displayText || <span className="text-zinc-400 font-normal italic">Adicionar...</span>}
      </p>
    </div>
  );
}

/* ═══ Owner Field Card — pick responsible user ═══ */
function OwnerFieldCard({ ownerId, users, getUserById, onSave }: {
  ownerId: string;
  users: { id: string; name: string; initials: string; avatarUrl?: string }[];
  getUserById: (id: string) => { name: string; initials: string; avatarUrl?: string } | undefined;
  onSave: (userId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const owner = getUserById(ownerId);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <div
        className="rounded-lg p-2.5 border transition-colors bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800 hover:border-violet-200 dark:hover:border-violet-700 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-zinc-400"><User className="w-3.5 h-3.5" /></span>
          <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Responsável</span>
        </div>
        <div className="flex items-center gap-2">
          {owner ? (
            <>
              <div className="w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0">
                {owner.avatarUrl ? (
                  <img src={owner.avatarUrl} className="w-5 h-5 rounded-full object-cover" alt="" />
                ) : (
                  <span className="text-[8px] font-bold text-violet-600 dark:text-violet-400">{owner.initials}</span>
                )}
              </div>
              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{owner.name.split(' ')[0]}</span>
            </>
          ) : (
            <span className="text-sm text-zinc-400 italic">Selecionar...</span>
          )}
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl z-50 py-1 max-h-52 overflow-y-auto">
          {users.map((u) => (
            <button
              key={u.id}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors cursor-pointer',
                u.id === ownerId && 'bg-violet-50 dark:bg-violet-950/20 font-medium',
              )}
              onClick={() => { onSave(u.id); setOpen(false); }}
            >
              <div className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center flex-shrink-0">
                {u.avatarUrl ? (
                  <img src={u.avatarUrl} className="w-6 h-6 rounded-full object-cover" alt="" />
                ) : (
                  <span className="text-[9px] font-bold text-violet-600 dark:text-violet-400">{u.initials}</span>
                )}
              </div>
              <span className="text-zinc-700 dark:text-zinc-300 truncate">{u.name}</span>
              {u.id === ownerId && <Check className="w-3.5 h-3.5 text-violet-500 ml-auto flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


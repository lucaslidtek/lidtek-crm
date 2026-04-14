import { X, Calendar, Mail, Phone, FileText, MessageSquare, Briefcase, ArrowRight, Tag, User, Edit3, Check, Globe, Plus, Trash2, Image as ImageIcon, ChevronDown, AlertTriangle, ChevronRight, ListTodo } from 'lucide-react';
import { WhatsAppIcon } from '@/shared/components/icons/WhatsAppIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shared/utils/cn';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { DatePicker } from '@/shared/components/ui/DatePicker';
import { MobileDrawerWrapper } from '@/shared/components/layout/MobileDrawerWrapper';
import { useStore } from '@/shared/lib/store';
import { LEAD_ORIGINS, BILLING_TYPES, BILLING_CYCLES, getStageLabel, getStageColor } from '@/shared/lib/constants';
import type { Lead, Interaction, ProjectType, BillingType, BillingCycle, FunnelStage } from '@/shared/types/models';
import { useState, useRef, useEffect } from 'react';
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
  const { getUserById, updateLead, deleteLead, convertLeadToProject, projects, tasks, users, funnelColumns, moveLeadStage, createTask } = useStore();
  const [, setLocation] = useLocation();
  const [converting, setConverting] = useState<boolean>(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const taskInputRef = useRef<HTMLInputElement>(null);

  // Reset states when lead changes
  useEffect(() => {
    setConfirmDelete(false);
    setDeleting(false);
    setShowActivity(false);
    setAddingTask(false);
    setNewTaskTitle('');
  }, [lead?.id]);

  // All derived state must be computed even when lead is null (for AnimatePresence to work)
  const editable = true;
  const stageColor = lead ? getStageColor(funnelColumns, lead.stage) : '#A3A3A3';
  const stageLabel = lead ? getStageLabel(funnelColumns, lead.stage) : '';
  const isOverdue = lead?.nextContactDate && new Date(lead.nextContactDate) < new Date();
  const linkedProject = lead ? projects.find(p => p.leadId === lead.id) : undefined;
  const hasProject = !!linkedProject;
  const canConvert = lead ? (lead.stage === 'contract_signed' || lead.stage === 'contract_sent') && !hasProject : false;

  // Tasks linked to this lead
  const linkedTasks = lead ? tasks.filter(t => t.leadId === lead.id) : [];

  // Derive project type from lead's billingType (set during funnel)
  const derivedProjectType: ProjectType = lead?.billingType === 'recurring' ? 'recurring' : 'oneshot';
  const derivedTypeLabel = derivedProjectType === 'recurring' ? 'Recorrente' : 'Único';

  const handleConvert = async () => {
    if (!lead) return;
    setConverting(true);
    try {
      await convertLeadToProject(lead.id, derivedProjectType);
      onClose();
      setLocation('/projects');
    } catch (err) {
      console.error('Error converting lead:', err);
    } finally {
      setConverting(false);
    }
  };

  const handleDelete = async () => {
    if (!lead) return;
    setDeleting(true);
    try {
      await deleteLead(lead.id);
      onClose();
    } catch (err) {
      console.error('Error deleting lead:', err);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleStageChange = async (stage: string) => {
    if (!lead) return;
    await moveLeadStage(lead.id, stage as FunnelStage);
  };

  const handleFieldSave = async (field: string, value: string) => {
    if (!lead) return;
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
    if (field === 'cnpj') updates.cnpj = value;
    if (field === 'logoUrl') updates.logoUrl = value;
    if (field === 'website') updates.website = value;
    if (field === 'razaoSocial') updates.razaoSocial = value;
    if (field === 'endereco') updates.endereco = value;
    if (field === 'origin') updates.origin = value;
    if (field === 'nextContactDate') updates.nextContactDate = value;
    if (field === 'lossReason') updates.lossReason = value;
    await updateLead(lead.id, updates);
  };

  const handleArraySave = async (field: 'emails' | 'phones', items: string[]) => {
    if (!lead) return;
    await updateLead(lead.id, { [field]: items });
  };

  const handleCreateTask = async () => {
    if (!lead) return;
    if (!newTaskTitle.trim()) return;
    await createTask({
      title: newTaskTitle.trim(),
      type: 'sales',
      status: 'todo',
      priority: 'medium',
      ownerIds: lead.ownerId ? [lead.ownerId] : users[0]?.id ? [users[0].id] : [],
      tags: [],
      leadId: lead.id,
    });
    setNewTaskTitle('');
    setAddingTask(false);
  };

  const formattedValue = lead?.estimatedValue
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.estimatedValue)
    : '';

  const allPhones = lead?.phone
    ? [lead.phone, ...(lead.phones || []).filter(p => p !== lead.phone)]
    : (lead?.phones || []);


  return (
    <MobileDrawerWrapper
      itemKey={lead?.id ?? null}
      open={!!lead}
      onClose={onClose}
      desktopWidth={420}
    >
      {lead && (
        <div className="h-full flex flex-col">
          {/* ═══ Header ═══ */}
            <div className="px-5 pt-4 pb-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge color={stageColor}>{stageLabel}</Badge>
                  {hasProject && <Badge variant="done">Projeto vinculado</Badge>}
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Logo + Name */}
              <div className="flex items-start gap-3">
                <LogoSection
                  name={lead.name}
                  logoUrl={lead.logoUrl}
                  editable={editable}
                  onSave={(url) => handleFieldSave('logoUrl', url)}
                />
                <div className="flex-1 min-w-0">
                  <EditableText
                    value={lead.name}
                    onSave={(v) => handleFieldSave('name', v)}
                    className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight"
                    readOnly={!editable}
                  />
                  {(lead.razaoSocial || editable) && (
                    <EditableText
                      value={lead.razaoSocial || ''}
                      onSave={(v) => handleFieldSave('razaoSocial', v)}
                      className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5"
                      placeholder="Razão social..."
                      readOnly={!editable}
                    />
                  )}
                  {lead.website && (
                    <div className="flex items-center gap-1 mt-1">
                      <Globe className="w-3 h-3 text-zinc-400" />
                      <a
                        href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-blue-500 dark:text-blue-400 hover:underline truncate"
                      >
                        {lead.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ═══ Scrollable Body ═══ */}
            <div className="flex-1 px-5 pb-5 space-y-3 overflow-y-auto">

              {/* ─── Contatos ─── */}
              <Section title="Contatos" icon={<User className="w-3.5 h-3.5" />}>
                <div className="space-y-1.5">
                  <InfoRow icon={<User className="w-3 h-3" />}>
                    <EditableText
                      value={lead.contact}
                      onSave={(v) => handleFieldSave('contact', v)}
                      className="text-xs text-zinc-700 dark:text-zinc-300"
                      placeholder="Nome do contato..."
                      readOnly={!editable}
                    />
                  </InfoRow>

                  {/* Emails */}
                  <MultiFieldCompact
                    icon={<Mail className="w-3 h-3" />}
                    label="Emails"
                    items={lead.emails || []}
                    onUpdate={(items) => handleArraySave('emails', items)}
                    placeholder="email@empresa.com"
                    type="email"
                    editable={editable}
                  />

                  {/* Phones */}
                  <MultiFieldCompact
                    icon={<Phone className="w-3 h-3" />}
                    label="Telefones"
                    items={allPhones}
                    onUpdate={(items) => {
                      const [first, ...rest] = items;
                      handleFieldSave('phone', first || '');
                      handleArraySave('phones', rest);
                    }}
                    placeholder="(11) 99999-0000"
                    type="tel"
                    editable={editable}
                    renderAction={(item) => (
                      <a
                        href={`https://wa.me/55${item.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-0.5 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 transition-colors"
                        title="WhatsApp"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <WhatsAppIcon className="w-3 h-3" />
                      </a>
                    )}
                  />
                </div>
              </Section>

              {/* ─── Detalhes do Negócio ─── */}
              <Section title="Detalhes" icon={<Tag className="w-3.5 h-3.5" />}>
                <div className="space-y-0">
                  <DetailRow label="Etapa">
                    <StageSelector
                      value={lead.stage}
                      columns={funnelColumns}
                      onChange={handleStageChange}
                    />
                  </DetailRow>
                  <DetailRow label="Valor">
                    <EditableText
                      value={formattedValue}
                      onSave={(v) => handleFieldSave('estimatedValue', v)}
                      className="text-xs font-medium text-zinc-700 dark:text-zinc-300"
                      placeholder="R$ 0,00"
                      readOnly={!editable}
                    />
                  </DetailRow>
                  <DetailRow label="Origem">
                    <OriginSelector value={lead.origin || ''} onSave={(v) => handleFieldSave('origin', v)} />
                  </DetailRow>
                  <DetailRow label="Responsável">
                    <OwnerSelector
                      ownerId={lead.ownerId}
                      users={users}
                      getUserById={getUserById}
                      onSave={(id) => handleFieldSave('ownerId', id)}
                    />
                  </DetailRow>
                  <DetailRow label="Próx. contato">
                    <DatePicker
                      value={lead.nextContactDate || ''}
                      onChange={(v) => handleFieldSave('nextContactDate', v ?? '')}
                      variant="compact"
                      placeholder="Definir"
                    />
                  </DetailRow>
                  <DetailRow label="Cobrança">
                    <BillingSelector
                      billingType={lead.billingType}
                      billingCycle={lead.billingCycle}
                      onSaveType={(v) => handleFieldSave('billingType', v)}
                      onSaveCycle={(v) => handleFieldSave('billingCycle', v)}
                    />
                  </DetailRow>
                  <DetailRow label="Solução">
                    <EditableText
                      value={lead.solutionType || ''}
                      onSave={(v) => handleFieldSave('solutionType', v)}
                      className="text-xs text-zinc-700 dark:text-zinc-300"
                      placeholder="SaaS, App, Dashboard..."
                      readOnly={!editable}
                    />
                  </DetailRow>
                  <DetailRow label="CNPJ">
                    <EditableText
                      value={lead.cnpj ? formatCnpj(lead.cnpj) : ''}
                      onSave={(v) => handleFieldSave('cnpj', stripCnpj(v))}
                      className="text-xs text-zinc-700 dark:text-zinc-300"
                      placeholder="00.000.000/0001-00"
                      readOnly={!editable}
                    />
                  </DetailRow>
                  <DetailRow label="Endereço">
                    <EditableText
                      value={lead.endereco || ''}
                      onSave={(v) => handleFieldSave('endereco', v)}
                      className="text-xs text-zinc-700 dark:text-zinc-300"
                      placeholder="Endereço..."
                      readOnly={!editable}
                    />
                  </DetailRow>
                </div>
              </Section>

              {/* ─── Tarefas Vinculadas ─── */}
              <Section title="Tarefas" icon={<ListTodo className="w-3.5 h-3.5" />} count={linkedTasks.length}
                action={
                  <button
                    onClick={() => { setAddingTask(true); setTimeout(() => taskInputRef.current?.focus(), 50); }}
                    className="p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
                    title="Adicionar tarefa"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                }
              >
                <div className="space-y-1">
                  {addingTask && (
                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-white dark:bg-zinc-800 border border-primary/30">
                      <input
                        ref={taskInputRef}
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCreateTask();
                          if (e.key === 'Escape') { setAddingTask(false); setNewTaskTitle(''); }
                        }}
                        onBlur={() => { if (!newTaskTitle.trim()) { setAddingTask(false); setNewTaskTitle(''); } }}
                        className="flex-1 text-xs bg-transparent outline-none text-zinc-700 dark:text-zinc-300"
                        placeholder="Título da tarefa..."
                      />
                      <button onClick={handleCreateTask} className="text-primary hover:text-primary/80 cursor-pointer">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  {linkedTasks.length > 0 ? linkedTasks.map(task => {
                    const statusColors: Record<string, string> = {
                      todo: 'bg-zinc-300 dark:bg-zinc-600',
                      in_progress: 'bg-blue-500',
                      done: 'bg-emerald-500',
                      blocked: 'bg-red-500',
                    };
                    return (
                      <div key={task.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white dark:hover:bg-zinc-800 transition-colors group">
                        <div className={cn('w-2 h-2 rounded-full flex-shrink-0', statusColors[task.status] || 'bg-zinc-300')} />
                        <span className={cn('text-xs flex-1 truncate', task.status === 'done' ? 'line-through text-zinc-400' : 'text-zinc-700 dark:text-zinc-300')}>
                          {task.title}
                        </span>
                        {task.dueDate && (
                          <span className={cn('text-[9px]', new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'text-red-500' : 'text-zinc-400')}>
                            {new Date(task.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        )}
                      </div>
                    );
                  }) : !addingTask && (
                    <p className="text-[11px] text-zinc-400 px-2 py-2">Nenhuma tarefa vinculada.</p>
                  )}
                </div>
              </Section>

              {/* ─── Projeto Vinculado ─── */}
              {linkedProject && (
                <Section title="Projeto" icon={<Briefcase className="w-3.5 h-3.5" />}>
                  <button
                    onClick={() => { onClose(); setLocation('/projects'); }}
                    className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-white dark:hover:bg-zinc-800 transition-colors group cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 truncate">{linkedProject.clientName}</p>
                      <p className="text-[10px] text-zinc-400">{linkedProject.type === 'recurring' ? 'Recorrente' : 'Único'} · {linkedProject.status === 'active' ? 'Ativo' : linkedProject.status === 'paused' ? 'Pausado' : 'Concluído'}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" />
                  </button>
                </Section>
              )}

              {/* ─── Convert to Project ─── */}
              {canConvert && (
                <Section title="Converter" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                  <div className="space-y-2">
                    <div className={cn(
                      'flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[10px] font-semibold border',
                      derivedProjectType === 'recurring'
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                        : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400',
                    )}>
                      <Briefcase className="w-3 h-3" />
                      <span>Projeto {derivedTypeLabel}</span>
                    </div>
                    <Button size="sm" onClick={handleConvert} disabled={converting} className="w-full">
                      {converting ? 'Convertendo...' : 'Criar Projeto'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </Section>
              )}

              {/* ─── Observações ─── */}
              <Section title="Observações" icon={<Edit3 className="w-3.5 h-3.5" />}>
                <EditableTextArea
                  value={lead.notes || ''}
                  placeholder="Adicione observações..."
                  onSave={(v) => handleFieldSave('notes', v)}
                  readOnly={!editable}
                />
              </Section>

              {/* ─── Loss Reason ─── */}
              {(lead.lossReason || lead.stage === 'lost') && (
                <div className="rounded-lg p-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30">
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-red-500 block mb-1">Motivo da Perda</span>
                  <EditableText
                    value={lead.lossReason || ''}
                    onSave={(v) => handleFieldSave('lossReason', v)}
                    className="text-xs text-zinc-700 dark:text-zinc-300"
                    placeholder="Descreva..."
                    readOnly={!editable}
                  />
                </div>
              )}

              {/* ─── Activity Feed (collapsible) ─── */}
              <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                <button
                  onClick={() => setShowActivity(!showActivity)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex-1">Atividade</span>
                  <span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full font-medium">
                    {lead.interactions.length}
                  </span>
                  <ChevronDown className={cn('w-3.5 h-3.5 text-zinc-400 transition-transform', showActivity && 'rotate-180')} />
                </button>

                <AnimatePresence>
                  {showActivity && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 space-y-2.5 border-t border-zinc-100 dark:border-zinc-800 pt-2.5">
                        {lead.interactions.length > 0 ? (
                          [...lead.interactions].reverse().map((interaction) => {
                            const Icon = interactionIcons[interaction.type] || MessageSquare;
                            const user = getUserById(interaction.userId);
                            return (
                              <div key={interaction.id} className="flex gap-2">
                                <div className="flex-shrink-0 w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center mt-0.5">
                                  <Icon className="w-3 h-3 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-semibold text-zinc-700 dark:text-zinc-300">
                                      {interactionLabels[interaction.type]}
                                    </span>
                                    <span className="text-[9px] text-zinc-400">
                                      {new Date(interaction.date).toLocaleDateString('pt-BR')}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                    {interaction.content}
                                  </p>
                                  {user && (
                                    <span className="text-[9px] text-zinc-400/70">por {user.name}</span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-[10px] text-zinc-400 text-center py-3">Nenhuma atividade.</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ─── Footer: Delete ─── */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-1.5 text-[10px] text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer py-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Excluir lead
                  </button>
                ) : (
                  <div className="rounded-lg p-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                      <span className="text-[10px] font-semibold text-red-600 dark:text-red-400">Tem certeza?</span>
                    </div>
                    <p className="text-[10px] text-red-600/80 dark:text-red-400/80 leading-relaxed">
                      Isso excluirá permanentemente o lead
                      {hasProject && <>, o <strong>projeto vinculado</strong>, suas sprints</>}
                      {linkedTasks.length > 0 && <> e <strong>{linkedTasks.length} tarefa{linkedTasks.length > 1 ? 's' : ''}</strong></>}
                      . Esta ação não pode ser desfeita.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="flex-1 px-2 py-1.5 text-[10px] font-medium rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="flex-1 px-2 py-1.5 text-[10px] font-medium rounded-md bg-red-500 hover:bg-red-600 text-white transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {deleting ? 'Excluindo...' : 'Sim, excluir tudo'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Meta info */}
              <div className="text-[9px] text-zinc-400/60 pt-1 space-y-0.5">
                <p>Criado em {new Date(lead.createdAt).toLocaleDateString('pt-BR')}</p>
                <p>Atualizado em {new Date(lead.updatedAt).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
        </div>
      )}
    </MobileDrawerWrapper>
  );
}


/* ═══════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════ */

/* ─── Section Container (GitLab-style) ─── */
function Section({ title, icon, children, count, action }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  count?: number;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
        <span className="text-zinc-400">{icon}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex-1">{title}</span>
        {count !== undefined && count > 0 && (
          <span className="text-[9px] text-zinc-400 bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded-full font-medium">{count}</span>
        )}
        {action}
      </div>
      <div className="px-3 py-2">
        {children}
      </div>
    </div>
  );
}

/* ─── Detail Row (label: value) ─── */
function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center py-1.5 border-b border-zinc-100 dark:border-zinc-800/50 last:border-b-0">
      <span className="text-[10px] text-zinc-400 w-[90px] flex-shrink-0">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

/* ─── Info Row (icon + content) ─── */
function InfoRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <span className="text-zinc-400 flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

/* ─── Logo Section (with upload) ─── */
function LogoSection({ name, logoUrl, editable, onSave }: {
  name: string;
  logoUrl?: string;
  editable: boolean;
  onSave: (url: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState<'upload' | 'url'>('upload');
  const [draft, setDraft] = useState(logoUrl || '');
  const [imgError, setImgError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const urlRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setDraft(logoUrl || ''); setImgError(false); }, [logoUrl]);
  useEffect(() => { if (editing && tab === 'url') urlRef.current?.focus(); }, [editing, tab]);
  useEffect(() => {
    if (!editing) return;
    const handleClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setEditing(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [editing]);

  const initials = name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();

  const commitUrl = () => {
    setEditing(false);
    if (draft.trim() !== (logoUrl || '')) onSave(draft.trim());
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) return;
    setUploading(true);
    try {
      const { supabase } = await import('@/shared/lib/supabase');
      const ext = file.name.split('.').pop() || 'png';
      const fileName = `lead-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('logos').upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (error) {
        const reader = new FileReader();
        reader.onload = (e) => { onSave(e.target?.result as string); setEditing(false); };
        reader.readAsDataURL(file);
        return;
      }
      const { data } = supabase.storage.from('logos').getPublicUrl(fileName);
      if (data?.publicUrl) { onSave(data.publicUrl); setEditing(false); }
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => { onSave(e.target?.result as string); setEditing(false); };
      reader.readAsDataURL(file);
    } finally { setUploading(false); }
  };

  const showImage = logoUrl && !imgError;

  return (
    <div className="relative flex-shrink-0" ref={popoverRef}>
      <div
        className={cn(
          'w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden transition-all',
          showImage ? 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700' : 'bg-primary/10 dark:bg-primary/20',
          editable && 'cursor-pointer group',
        )}
        onClick={() => editable && setEditing(true)}
      >
        {showImage ? (
          <img src={logoUrl} alt={name} className="w-full h-full object-contain p-0.5" onError={() => setImgError(true)} />
        ) : (
          <span className="text-sm font-bold text-primary">{initials}</span>
        )}
        {editable && (
          <div className="absolute inset-0 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <ImageIcon className="w-3 h-3 text-white" />
          </div>
        )}
      </div>

      {editing && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl w-64 overflow-hidden">
          <div className="flex border-b border-zinc-100 dark:border-zinc-800">
            {(['upload', 'url'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={cn(
                'flex-1 px-2 py-1.5 text-[9px] font-semibold uppercase tracking-wider transition-colors cursor-pointer',
                tab === t ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-zinc-400 hover:text-zinc-600',
              )}>{t === 'upload' ? 'Upload' : 'URL'}</button>
            ))}
          </div>
          <div className="p-2.5">
            {tab === 'upload' ? (
              <>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
                <button onClick={() => fileRef.current?.click()} disabled={uploading} className="w-full border-2 border-dashed rounded-lg py-3 flex flex-col items-center gap-1 border-zinc-200 dark:border-zinc-700 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer">
                  {uploading ? (
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  ) : (
                    <>
                      <ImageIcon className="w-4 h-4 text-zinc-400" />
                      <span className="text-[10px] text-zinc-500">Clique ou arraste</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <input
                ref={urlRef} type="url" value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitUrl}
                onKeyDown={(e) => { if (e.key === 'Enter') commitUrl(); if (e.key === 'Escape') { setDraft(logoUrl || ''); setEditing(false); } }}
                className="w-full text-xs px-2 py-1.5 rounded-md bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 outline-none focus:ring-1 focus:ring-primary/30 text-zinc-700 dark:text-zinc-300"
                placeholder="https://..."
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}


/* ─── Editable Text ─── */
function EditableText({ value, onSave, className, placeholder, readOnly, icon }: {
  value: string; onSave: (v: string) => void; className?: string; placeholder?: string; readOnly?: boolean; icon?: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing) { ref.current?.focus(); ref.current?.select(); } }, [editing]);
  const commit = () => { setEditing(false); if (draft.trim() !== value && onSave) onSave(draft.trim()); };

  if (readOnly || !editing) {
    return (
      <div className={cn('flex items-center gap-1 group', !readOnly && 'cursor-pointer')} onClick={() => !readOnly && setEditing(true)}>
        {icon}
        <span className={cn(className, !value && 'text-zinc-400 italic')}>
          {value || placeholder || '—'}
        </span>
      </div>
    );
  }
  return (
    <input
      ref={ref} value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
      className={cn(className, 'bg-transparent outline-none border-b border-primary/40 w-full')}
      placeholder={placeholder}
    />
  );
}

/* ─── Editable TextArea ─── */
function EditableTextArea({ value, onSave, placeholder, readOnly }: {
  value: string; onSave: (v: string) => void; placeholder?: string; readOnly?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);
  const commit = () => { setEditing(false); if (draft.trim() !== value) onSave(draft.trim()); };

  if (!editing || readOnly) {
    return (
      <div className={cn('text-xs text-zinc-600 dark:text-zinc-400 whitespace-pre-wrap min-h-[40px]', !readOnly && 'cursor-pointer hover:bg-white dark:hover:bg-zinc-800 rounded p-1 -m-1 transition-colors')} onClick={() => !readOnly && setEditing(true)}>
        {value || <span className="text-zinc-400 italic">{placeholder}</span>}
      </div>
    );
  }
  return (
    <textarea
      ref={ref} value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      rows={3}
      className="w-full text-xs bg-transparent outline-none border border-primary/30 rounded-md p-2 text-zinc-700 dark:text-zinc-300 resize-none"
      placeholder={placeholder}
    />
  );
}

/* ─── MultiField Compact ─── */
function MultiFieldCompact({ icon, label, items, onUpdate, placeholder, type, editable, renderAction }: {
  icon: React.ReactNode; label: string; items: string[]; onUpdate: (items: string[]) => void;
  placeholder: string; type?: string; editable: boolean; renderAction?: (item: string) => React.ReactNode;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (adding) ref.current?.focus(); }, [adding]);

  const commitAdd = () => {
    if (draft.trim()) { onUpdate([...items, draft.trim()]); }
    setDraft(''); setAdding(false);
  };

  return (
    <div className="px-2 py-1 space-y-1">
      <div className="flex items-center gap-2">
        <span className="text-zinc-400 flex-shrink-0">{icon}</span>
        <span className="text-[10px] text-zinc-400 flex-1">{label}</span>
        {editable && (
          <button onClick={() => setAdding(true)} className="p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-400 cursor-pointer">
            <Plus className="w-3 h-3" />
          </button>
        )}
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 pl-5 group">
          <span className="text-xs text-zinc-700 dark:text-zinc-300 flex-1 truncate">{item}</span>
          {renderAction?.(item)}
          {editable && (
            <button onClick={() => onUpdate(items.filter((_, j) => j !== i))} className="p-0.5 opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-500 transition-all cursor-pointer">
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      ))}
      {adding && (
        <div className="flex items-center gap-2 pl-5">
          <input
            ref={ref} value={draft} type={type}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitAdd}
            onKeyDown={(e) => { if (e.key === 'Enter') commitAdd(); if (e.key === 'Escape') { setDraft(''); setAdding(false); } }}
            className="flex-1 text-xs bg-transparent outline-none border-b border-primary/30 text-zinc-700 dark:text-zinc-300 py-0.5"
            placeholder={placeholder}
          />
        </div>
      )}
      {items.length === 0 && !adding && (
        <p className="text-[10px] text-zinc-400 pl-5 italic">{editable ? 'Clique + para adicionar' : 'Nenhum'}</p>
      )}
    </div>
  );
}

/* ─── Stage Selector (inline dropdown) ─── */
function StageSelector({ value, columns, onChange }: { value: string; columns: { id: string; label: string; color: string }[]; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = columns.find(c => c.id === value);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer hover:text-primary transition-colors">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: current?.color || '#A3A3A3' }} />
        {current?.label || value}
        <ChevronDown className="w-3 h-3 text-zinc-400" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl py-1 w-48 max-h-52 overflow-y-auto">
          {columns.map(c => (
            <button key={c.id} onClick={() => { onChange(c.id); setOpen(false); }}
              className={cn('w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer', c.id === value && 'bg-zinc-50 dark:bg-zinc-800 font-medium')}>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
              {c.label}
              {c.id === value && <Check className="w-3 h-3 text-primary ml-auto" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Origin Selector ─── */
function OriginSelector({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer hover:text-primary transition-colors">
        {value || <span className="text-zinc-400 italic">Selecionar</span>}
        <ChevronDown className="w-3 h-3 text-zinc-400" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl py-1 w-40 max-h-48 overflow-y-auto">
          {LEAD_ORIGINS.map(o => (
            <button key={o} onClick={() => { onSave(o); setOpen(false); }}
              className={cn('w-full text-left px-3 py-1.5 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer', o === value && 'bg-zinc-50 dark:bg-zinc-800 font-medium')}>
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Owner Selector ─── */
function OwnerSelector({ ownerId, users, getUserById, onSave }: {
  ownerId: string; users: { id: string; name: string; initials: string }[]; getUserById: (id: string) => any; onSave: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const owner = ownerId ? getUserById(ownerId) : undefined;
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 text-xs cursor-pointer hover:text-primary transition-colors">
        {owner ? (
          <>
            <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-[7px] font-bold text-primary">{owner.initials}</span>
            </div>
            <span className="text-zinc-700 dark:text-zinc-300">{owner.name.split(' ')[0]}</span>
          </>
        ) : <span className="text-amber-500 italic">Sem responsável</span>}
        <ChevronDown className="w-3 h-3 text-zinc-400" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl py-1 w-48 max-h-48 overflow-y-auto">
          {users.map(u => (
            <button key={u.id} onClick={() => { onSave(u.id); setOpen(false); }}
              className={cn('w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer', u.id === ownerId && 'bg-zinc-50 dark:bg-zinc-800 font-medium')}>
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-[8px] font-bold text-primary">{u.initials}</span>
              </div>
              {u.name}
              {u.id === ownerId && <Check className="w-3 h-3 text-primary ml-auto" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* DateInput removed — replaced by shared DatePicker component */

/* ─── Billing Selector ─── */
function BillingSelector({ billingType, billingCycle, onSaveType, onSaveCycle }: {
  billingType?: BillingType; billingCycle?: BillingCycle; onSaveType: (v: string) => void; onSaveCycle: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const label = billingType
    ? `${getStageLabel(BILLING_TYPES, billingType)}${billingType === 'recurring' && billingCycle ? ` · ${getStageLabel(BILLING_CYCLES, billingCycle)}` : ''}`
    : '';

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer hover:text-primary transition-colors">
        {label || <span className="text-zinc-400 italic">Definir</span>}
        <ChevronDown className="w-3 h-3 text-zinc-400" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl p-2.5 w-52">
          <div className="flex gap-1 mb-2">
            {BILLING_TYPES.map(bt => (
              <button key={bt.id} onClick={() => onSaveType(bt.id)}
                className={cn('flex-1 px-2 py-1 rounded text-[10px] font-semibold border cursor-pointer transition-all',
                  billingType === bt.id
                    ? bt.id === 'recurring' ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-700' : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 text-blue-700'
                    : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50',
                )}>{bt.label}</button>
            ))}
          </div>
          {billingType === 'recurring' && (
            <div className="flex gap-1">
              {BILLING_CYCLES.map(bc => (
                <button key={bc.id} onClick={() => { onSaveCycle(bc.id); setOpen(false); }}
                  className={cn('flex-1 px-2 py-1 rounded text-[10px] font-semibold border cursor-pointer transition-all',
                    billingCycle === bc.id ? 'bg-primary/10 border-primary/30 text-primary' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-50',
                  )}>{bc.label}</button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Helpers ─── */
function formatCnpj(v: string) { return v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5'); }
function stripCnpj(v: string) { return v.replace(/\D/g, ''); }

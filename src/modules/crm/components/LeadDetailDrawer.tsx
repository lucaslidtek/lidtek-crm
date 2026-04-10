import { X, Calendar, Mail, Phone, FileText, MessageSquare, Briefcase, ArrowRight, Tag, User, DollarSign, Edit3, Check, Repeat, Zap, Globe, Building2, MapPin, Plus, Trash2, Image as ImageIcon, ExternalLink, ChevronDown, AlertTriangle } from 'lucide-react';
import { WhatsAppIcon } from '@/shared/components/icons/WhatsAppIcon';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/shared/utils/cn';
import { Badge } from '@/shared/components/ui/Badge';
import { Button } from '@/shared/components/ui/Button';
import { useStore } from '@/shared/lib/store';
import { usePermissions } from '@/shared/hooks/usePermissions';
import { LEAD_ORIGINS, BILLING_TYPES, BILLING_CYCLES, getStageLabel, getStageColor } from '@/shared/lib/constants';
import type { Lead, Interaction, ProjectType, BillingType, BillingCycle, FunnelStage } from '@/shared/types/models';
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
  const { getUserById, updateLead, deleteLead, convertLeadToProject, projects, users, funnelColumns, moveLeadStage } = useStore();
  const { canEdit, canEditAll } = usePermissions();
  const [, setLocation] = useLocation();
  const [converting, setConverting] = useState<boolean>(false);
  const [selectedType, setSelectedType] = useState<ProjectType>('oneshot');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!lead) return null;

  // Permission: any authenticated user can edit/delete leads in this internal CRM.
  // The 2-step confirmation provides safety for destructive actions.
  const editable = true;
  const canDeleteLead = true;

  const stageColor = getStageColor(funnelColumns, lead.stage);
  const stageLabel = getStageLabel(funnelColumns, lead.stage);
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

  const handleDelete = async () => {
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
    await moveLeadStage(lead.id, stage as FunnelStage);
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
    await updateLead(lead.id, { [field]: items });
  };

  const formattedValue = lead.estimatedValue
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.estimatedValue)
    : 'Sem valor';

  // Merge legacy phone field with phones array for display
  const allPhones = lead.phone
    ? [lead.phone, ...(lead.phones || []).filter(p => p !== lead.phone)]
    : (lead.phones || []);

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
              <div className="px-6 pt-5 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 mb-3">
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

                {/* Logo + Company Info */}
                <div className="flex items-start gap-4">
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
                      className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight"
                      readOnly={!editable}
                    />
                    <EditableText
                      value={lead.razaoSocial || ''}
                      onSave={(v) => handleFieldSave('razaoSocial', v)}
                      className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5"
                      placeholder="Razão social..."
                      readOnly={!editable}
                      icon={<Building2 className="w-3 h-3 text-zinc-400 mr-1 flex-shrink-0" />}
                    />
                    <div className="flex items-center gap-1 mt-1">
                      {lead.website ? (
                        <div className="flex items-center gap-1 group">
                          <Globe className="w-3 h-3 text-zinc-400" />
                          <EditableText
                            value={lead.website}
                            onSave={(v) => handleFieldSave('website', v)}
                            className="text-xs text-blue-500 dark:text-blue-400 hover:underline"
                            readOnly={!editable}
                          />
                          <a
                            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-blue-500 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ) : editable ? (
                        <EditableText
                          value=""
                          onSave={(v) => handleFieldSave('website', v)}
                          className="text-xs text-zinc-400"
                          placeholder="Adicionar website..."
                          readOnly={false}
                          icon={<Globe className="w-3 h-3 text-zinc-400 mr-1 flex-shrink-0" />}
                        />
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══ Body — Two columns ═══ */}
              <div className="flex flex-1 overflow-hidden">

                {/* ── Left: Main content ── */}
                <div className="flex-1 p-6 space-y-5 overflow-y-auto">

                  {/* ─── Dados da Empresa ─── */}
                  <div>
                    <SectionHeader icon={<Building2 className="w-3.5 h-3.5" />} label="Dados da Empresa" />
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <FieldCard
                        icon={<FileText className="w-3.5 h-3.5" />}
                        label="CNPJ"
                        value={lead.cnpj ? formatCnpj(lead.cnpj) : ''}
                        editable={editable}
                        onSave={(v) => handleFieldSave('cnpj', stripCnpj(v))}
                      />
                      <FieldCard
                        icon={<MapPin className="w-3.5 h-3.5" />}
                        label="Endereço"
                        value={lead.endereco || ''}
                        editable={editable}
                        onSave={(v) => handleFieldSave('endereco', v)}
                      />
                    </div>
                  </div>

                  {/* ─── Contatos ─── */}
                  <div>
                    <SectionHeader icon={<User className="w-3.5 h-3.5" />} label="Contatos" />
                    <div className="mt-2 space-y-3">
                      {/* Contact name (legacy field) */}
                      <div className="flex items-center gap-2 px-2">
                        <User className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                        <EditableText
                          value={lead.contact}
                          onSave={(v) => handleFieldSave('contact', v)}
                          className="text-sm text-zinc-700 dark:text-zinc-300"
                          placeholder="Nome do contato..."
                          readOnly={!editable}
                        />
                      </div>

                      {/* Emails */}
                      <MultiField
                        icon={<Mail className="w-3.5 h-3.5" />}
                        label="Emails"
                        items={lead.emails || []}
                        onUpdate={(items) => handleArraySave('emails', items)}
                        placeholder="email@empresa.com"
                        type="email"
                        editable={editable}
                      />

                      {/* Phones */}
                      <MultiField
                        icon={<Phone className="w-3.5 h-3.5" />}
                        label="Telefones"
                        items={allPhones}
                        onUpdate={(items) => {
                          // First phone stays in legacy 'phone' field, rest in phones[]
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
                            className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 transition-colors"
                            title="Abrir no WhatsApp"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <WhatsAppIcon className="w-3.5 h-3.5" />
                          </a>
                        )}
                      />
                    </div>
                  </div>

                  {/* ─── Informações ─── */}
                  <div>
                    <SectionHeader icon={<Tag className="w-3.5 h-3.5" />} label="Informações" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                      {/* Stage selector */}
                      <SelectFieldCard
                        icon={<ChevronDown className="w-3.5 h-3.5" />}
                        label="Etapa"
                        value={lead.stage}
                        displayValue={stageLabel}
                        options={funnelColumns.map(c => ({ id: c.id, label: c.label, color: c.color }))}
                        onSave={handleStageChange}
                        showDot
                      />
                      <FieldCard
                        icon={<DollarSign className="w-3.5 h-3.5" />}
                        label="Valor"
                        value={formattedValue}
                        editable={editable}
                        onSave={(v) => handleFieldSave('estimatedValue', v)}
                      />
                      {/* Origin selector */}
                      <SelectFieldCard
                        icon={<Tag className="w-3.5 h-3.5" />}
                        label="Origem"
                        value={lead.origin || ''}
                        displayValue={lead.origin || '—'}
                        options={LEAD_ORIGINS.map(o => ({ id: o, label: o }))}
                        onSave={(v) => handleFieldSave('origin', v)}
                      />
                      <OwnerFieldCard
                        ownerId={lead.ownerId}
                        users={users}
                        getUserById={getUserById}
                        onSave={(id) => handleFieldSave('ownerId', id)}
                      />
                      {/* Next contact date */}
                      <DateFieldCard
                        icon={<Calendar className="w-3.5 h-3.5" />}
                        label="Próx. contato"
                        value={lead.nextContactDate || ''}
                        alert={!!isOverdue}
                        editable={editable}
                        onSave={(v) => handleFieldSave('nextContactDate', v)}
                      />
                      <BillingFieldCard
                        billingType={lead.billingType}
                        billingCycle={lead.billingCycle}
                        onSaveBillingType={(v) => handleFieldSave('billingType', v)}
                        onSaveBillingCycle={(v) => handleFieldSave('billingCycle', v)}
                      />
                    </div>
                  </div>

                  {/* Solution type — always visible */}
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1">Tipo de solução</span>
                    <EditableText
                      value={lead.solutionType || ''}
                      onSave={(v) => handleFieldSave('solutionType', v)}
                      className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                      placeholder="Ex: SaaS, App mobile, Dashboard..."
                      readOnly={!editable}
                    />
                  </div>

                  {/* Description / Notes */}
                  <div>
                    <SectionHeader icon={<Edit3 className="w-3.5 h-3.5" />} label="Observações" />
                    <div className="mt-2">
                      <EditableTextArea
                        value={lead.notes || ''}
                        placeholder="Adicione uma descrição mais detalhada..."
                        onSave={(v) => handleFieldSave('notes', v)}
                        readOnly={!editable}
                      />
                    </div>
                  </div>

                  {/* Loss Reason — editable */}
                  {(lead.lossReason || lead.stage === 'lost') && (
                    <div className="rounded-lg p-3 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-red-500 block mb-1">Motivo da Perda</span>
                      <EditableText
                        value={lead.lossReason || ''}
                        onSave={(v) => handleFieldSave('lossReason', v)}
                        className="text-sm text-zinc-700 dark:text-zinc-300"
                        placeholder="Descreva o motivo da perda..."
                        readOnly={!editable}
                      />
                    </div>
                  )}

                  {/* ─── Delete Lead ─── */}
                  {canDeleteLead && (
                    <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800">
                      {!confirmDelete ? (
                        <button
                          onClick={() => setConfirmDelete(true)}
                          className="flex items-center gap-2 text-xs text-zinc-400 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer py-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Excluir lead
                        </button>
                      ) : (
                        <div className="rounded-lg p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 space-y-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            <span className="text-xs font-semibold text-red-600 dark:text-red-400">Excluir permanentemente?</span>
                          </div>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            Esta ação não pode ser desfeita. Todas as interações vinculadas também serão removidas.
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setConfirmDelete(false)}
                              className="flex-1 px-3 py-1.5 text-xs font-medium rounded-md border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={handleDelete}
                              disabled={deleting}
                              className="flex-1 px-3 py-1.5 text-xs font-medium rounded-md bg-red-500 hover:bg-red-600 text-white transition-colors cursor-pointer disabled:opacity-50"
                            >
                              {deleting ? 'Excluindo...' : 'Sim, excluir'}
                            </button>
                          </div>
                        </div>
                      )}
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

/* ═══ Logo Section ═══ */
function LogoSection({ name, logoUrl, editable, onSave }: {
  name: string;
  logoUrl?: string;
  editable: boolean;
  onSave: (url: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(logoUrl || '');
  const [imgError, setImgError] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(logoUrl || ''); setImgError(false); }, [logoUrl]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  const commit = () => {
    setEditing(false);
    if (draft.trim() !== (logoUrl || '')) onSave(draft.trim());
  };

  const showImage = logoUrl && !imgError;

  return (
    <div className="relative flex-shrink-0">
      <div
        className={cn(
          'w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden transition-all',
          showImage
            ? 'bg-white dark:bg-zinc-800'
            : 'bg-primary/10 dark:bg-primary/20',
          editable && 'cursor-pointer group',
        )}
        onClick={() => editable && setEditing(true)}
        title={editable ? 'Clique para alterar a logo' : undefined}
      >
        {showImage ? (
          <img
            src={logoUrl}
            alt={name}
            className="w-full h-full object-contain p-1"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-lg font-bold text-primary">{initials}</span>
        )}
        {editable && (
          <div className="absolute inset-0 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <ImageIcon className="w-4 h-4 text-white" />
          </div>
        )}
      </div>

      {/* URL input popover */}
      {editing && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl p-3 w-64">
          <label className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1">URL da Logo</label>
          <input
            ref={ref}
            type="url"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(logoUrl || ''); setEditing(false); } }}
            className="w-full text-xs px-2 py-1.5 rounded-md bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 outline-none focus:ring-1 focus:ring-primary/30 text-zinc-700 dark:text-zinc-300"
            placeholder="https://example.com/logo.png"
          />
        </div>
      )}
    </div>
  );
}

/* ═══ Section Header ═══ */
function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 pb-1 border-b border-zinc-100 dark:border-zinc-800">
      <span className="text-zinc-400">{icon}</span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">{label}</span>
    </div>
  );
}

/* ═══ Multi Field (emails / phones) ═══ */
function MultiField({ icon, label, items, onUpdate, placeholder, type, editable, renderAction }: {
  icon: React.ReactNode;
  label: string;
  items: string[];
  onUpdate: (items: string[]) => void;
  placeholder: string;
  type?: 'email' | 'tel' | 'text';
  editable: boolean;
  renderAction?: (item: string, index: number) => React.ReactNode;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (adding) inputRef.current?.focus(); }, [adding]);

  const handleAdd = () => {
    if (draft.trim()) {
      onUpdate([...items, draft.trim()]);
      setDraft('');
      setAdding(false);
    }
  };

  const handleRemove = (index: number) => {
    onUpdate(items.filter((_, i) => i !== index));
  };

  return (
    <div className="rounded-lg border border-zinc-100 dark:border-zinc-800 p-2.5">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-zinc-400">{icon}</span>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{label}</span>
        <span className="text-[9px] text-zinc-400 ml-auto bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full font-medium">{items.length}</span>
      </div>

      {/* Existing items */}
      {items.length > 0 && (
        <div className="space-y-0.5">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 py-1 px-2 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800/50 group transition-colors">
              <span className="text-sm text-zinc-700 dark:text-zinc-300 flex-1 min-w-0 truncate">{item}</span>
              {renderAction?.(item, idx)}
              {editable && (
                <button
                  onClick={() => handleRemove(idx)}
                  className="flex-shrink-0 p-0.5 rounded text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 hover:text-red-500 dark:hover:text-red-400 transition-all cursor-pointer"
                  title="Remover"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add new */}
      {editable && (
        adding ? (
          <div className="flex items-center gap-2 mt-1 px-2">
            <input
              ref={inputRef}
              type={type || 'text'}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={() => { if (!draft.trim()) setAdding(false); else handleAdd(); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') { setDraft(''); setAdding(false); } }}
              className="flex-1 text-sm bg-transparent border-b border-primary/40 outline-none py-1 text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400"
              placeholder={placeholder}
            />
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 mt-1 px-2 py-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3" />
            Adicionar
          </button>
        )
      )}
    </div>
  );
}

/* ═══ CNPJ Format Helpers ═══ */
function formatCnpj(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 14) return value;
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

function stripCnpj(value: string): string {
  return value.replace(/\D/g, '');
}

/* ═══ Inline Editable Text ═══ */
function EditableText({ value, onSave, className, placeholder, readOnly, icon }: {
  value: string;
  onSave: (value: string) => void;
  className?: string;
  placeholder?: string;
  readOnly?: boolean;
  icon?: React.ReactNode;
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
    return (
      <div className="flex items-center">
        {icon}
        <p className={className}>{value || <span className="text-zinc-400 italic">{placeholder || '—'}</span>}</p>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="flex items-center">
        {icon}
        <input
          ref={ref}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
          className={cn(className, 'bg-transparent outline-none border-b-2 border-violet-400 w-full')}
          placeholder={placeholder}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center">
      {icon}
      <p
        onClick={() => setEditing(true)}
        className={cn(className, 'cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded px-1 -mx-1 transition-colors')}
        title="Clique para editar"
      >
        {value || <span className="text-zinc-400 italic">{placeholder || 'Clique para editar'}</span>}
      </p>
    </div>
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

/* ═══ Select Field Card — dropdown selector ═══ */
function SelectFieldCard({ icon, label, value, displayValue, options, onSave, showDot }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  displayValue: string;
  options: { id: string; label: string; color?: string }[];
  onSave: (value: string) => void;
  showDot?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const currentOption = options.find(o => o.id === value);

  return (
    <div ref={ref} className="relative">
      <div
        className="rounded-lg p-2.5 border transition-colors bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800 hover:border-violet-200 dark:hover:border-violet-700 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-zinc-400">{icon}</span>
          <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {showDot && currentOption?.color && (
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: currentOption.color }} />
          )}
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">{displayValue}</p>
        </div>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-xl z-50 py-1 max-h-52 overflow-y-auto">
          {options.map((o) => (
            <button
              key={o.id}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors cursor-pointer',
                o.id === value && 'bg-violet-50 dark:bg-violet-950/20 font-medium',
              )}
              onClick={() => { onSave(o.id); setOpen(false); }}
            >
              {showDot && o.color && (
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: o.color }} />
              )}
              <span className="text-zinc-700 dark:text-zinc-300 truncate">{o.label}</span>
              {o.id === value && <Check className="w-3.5 h-3.5 text-violet-500 ml-auto flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══ Date Field Card — date picker ═══ */
function DateFieldCard({ icon, label, value, alert, editable, onSave }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  alert?: boolean;
  editable?: boolean;
  onSave?: (value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const displayDate = value
    ? new Date(value).toLocaleDateString('pt-BR')
    : '—';

  // Format to YYYY-MM-DD for input[type=date]
  const inputValue = value
    ? new Date(value).toISOString().split('T')[0]
    : '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSave && e.target.value) {
      onSave(new Date(e.target.value).toISOString());
    }
    setEditing(false);
  };

  return (
    <div
      className={cn(
        'rounded-lg p-2.5 border transition-colors relative',
        alert
          ? 'bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30'
          : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-100 dark:border-zinc-800',
        editable && !editing && 'hover:border-violet-200 dark:hover:border-violet-700 cursor-pointer',
      )}
      onClick={() => { if (editable && !editing) setEditing(true); }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className={alert ? 'text-red-500' : 'text-zinc-400'}>{icon}</span>
        <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{label}</span>
      </div>
      {editing ? (
        <input
          ref={ref}
          type="date"
          defaultValue={inputValue}
          onChange={handleChange}
          onBlur={() => setEditing(false)}
          className="text-sm font-medium bg-transparent outline-none border-b border-violet-400 w-full text-zinc-800 dark:text-zinc-200 dark:[color-scheme:dark]"
        />
      ) : (
        <p className={cn('text-sm font-medium truncate', alert ? 'text-red-600 dark:text-red-400' : 'text-zinc-800 dark:text-zinc-200')}>
          {displayDate}
        </p>
      )}
    </div>
  );
}

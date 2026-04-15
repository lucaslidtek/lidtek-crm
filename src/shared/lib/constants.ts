import type { ProjectStage, TaskStatus, TaskPriority, TaskType, ProjectType, BillingType, BillingCycle, FunnelColumn } from '@/shared/types/models';

// ============================================
// CONSTANTS — Labels, cores e configurações
// ============================================

export interface StageConfig {
  id: string;
  label: string;
  color: string;
}

// --- Funil de Vendas — Defaults (fallback quando tabela está vazia) ---
export const FUNNEL_STAGES: StageConfig[] = [
  { id: 'prospecting', label: 'Prospecção', color: '#A3A3A3' },
  { id: 'first_meeting', label: '1ª Reunião', color: '#6580E1' },
  { id: 'briefing', label: 'Briefing', color: '#5A4FFF' },
  { id: 'proposal_sent', label: 'Proposta Enviada', color: '#7B73FF' },
  { id: 'negotiation', label: 'Negociação', color: '#F59E0B' },
  { id: 'contract_sent', label: 'Contrato Enviado', color: '#10B981' },
  { id: 'contract_signed', label: 'Contrato Assinado', color: '#059669' },
  { id: 'lost', label: 'Perdido', color: '#EF4444' },
];

export const DEFAULT_FUNNEL_COLUMNS: FunnelColumn[] = FUNNEL_STAGES.map((s, i) => ({
  ...s,
  position: i,
  isDefault: true,
  behavior: s.id === 'contract_signed' ? 'won' as const : s.id === 'lost' ? 'lost' as const : 'active' as const,
}));

// --- Etapas de Projeto (M2) ---
export const PROJECT_STAGES: (StageConfig & { id: ProjectStage })[] = [
  { id: 'onboarding', label: 'Onboarding', color: '#A3A3A3' },
  { id: 'architecture', label: 'Arquitetura', color: '#6580E1' },
  { id: 'development', label: 'Desenvolvimento', color: '#5A4FFF' },
  { id: 'review', label: 'Revisão', color: '#F59E0B' },
  { id: 'homologation', label: 'Homologação', color: '#7B73FF' },
  { id: 'deploy', label: 'Deploy', color: '#10B981' },
  { id: 'support', label: 'Suporte', color: '#059669' },
];

// --- Status de Tarefa (M3) ---
export const TASK_STATUSES: (StageConfig & { id: TaskStatus })[] = [
  { id: 'todo', label: 'A Fazer', color: '#A3A3A3' },
  { id: 'in_progress', label: 'Em Andamento', color: '#5A4FFF' },
  { id: 'done', label: 'Concluída', color: '#10B981' },
  { id: 'blocked', label: 'Bloqueada', color: '#EF4444' },
];

// --- Prioridades ---
export const TASK_PRIORITIES: (StageConfig & { id: TaskPriority })[] = [
  { id: 'high', label: 'Alta', color: '#EF4444' },
  { id: 'medium', label: 'Média', color: '#F59E0B' },
  { id: 'low', label: 'Baixa', color: '#A3A3A3' },
];

// --- Tipos de Tarefa ---
export const TASK_TYPES: (StageConfig & { id: TaskType })[] = [
  { id: 'project', label: 'Projeto', color: '#5A4FFF' },
  { id: 'sales', label: 'Vendas', color: '#6580E1' },
  { id: 'standalone', label: 'Avulsa', color: '#A3A3A3' },
];

// --- Tipos de Projeto ---
export const PROJECT_TYPES: (StageConfig & { id: ProjectType })[] = [
  { id: 'recurring', label: 'Recorrente', color: '#10B981' },
  { id: 'oneshot', label: 'Único', color: '#6580E1' },
];

// --- Tipos de Cobrança ---
export const BILLING_TYPES: (StageConfig & { id: BillingType })[] = [
  { id: 'one_time', label: 'Único', color: '#6580E1' },
  { id: 'recurring', label: 'Recorrente', color: '#10B981' },
];

// --- Ciclos de Cobrança ---
export const BILLING_CYCLES: (StageConfig & { id: BillingCycle })[] = [
  { id: 'monthly', label: 'Mensal', color: '#10B981' },
  { id: 'semiannual', label: 'Semestral', color: '#F59E0B' },
  { id: 'annual', label: 'Anual', color: '#5A4FFF' },
];

// --- Origens de Lead ---
export const LEAD_ORIGINS = [
  'Indicação',
  'Site',
  'LinkedIn',
  'Evento',
  'Google',
  'Parceiro',
  'Outros',
] as const;

// --- Helpers ---
export function getStageLabel(stages: StageConfig[], id: string): string {
  return stages.find(s => s.id === id)?.label ?? id;
}

export function getStageColor(stages: StageConfig[], id: string): string {
  return stages.find(s => s.id === id)?.color ?? '#A3A3A3';
}

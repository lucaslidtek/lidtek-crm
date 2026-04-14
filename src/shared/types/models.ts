// ============================================
// MODELS — Lidtek CRM & Gestão de Projetos
// Fonte: BUSINESS_RULES.md
// ============================================

// --- Enums / Union Types ---

export type FunnelStage = string;

export interface FunnelColumn {
  id: string;
  label: string;
  color: string;
  position: number;
  isDefault: boolean;
}

export type ProjectType = 'recurring' | 'oneshot';

export type BillingType = 'one_time' | 'recurring';

export type BillingCycle = 'monthly' | 'semiannual' | 'annual';

export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived';

export type ProjectStage =
  | 'onboarding'
  | 'architecture'
  | 'development'
  | 'review'
  | 'homologation'
  | 'deploy'
  | 'support';

export type TaskType = 'project' | 'sales' | 'standalone';

export type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';

export type TaskPriority = 'high' | 'medium' | 'low';

export type UserRole = 'admin' | 'gestor' | 'manager' | 'collaborator' | 'readonly' | 'leitura';

// --- Models ---

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  initials: string;
  avatarUrl?: string;
  phone?: string;
  position?: string;
  status?: 'active' | 'inactive';
}

export interface Interaction {
  id: string;
  leadId: string;
  type: 'note' | 'meeting' | 'email' | 'call';
  content: string;
  date: string; // ISO string
  userId: string;
}

export interface Lead {
  id: string;
  name: string;
  contact: string;
  phone?: string;
  origin: string;
  ownerId: string;
  notes: string;
  stage: FunnelStage;
  nextContactDate?: string;
  estimatedValue?: number;
  billingType?: BillingType;
  billingCycle?: BillingCycle;
  solutionType?: string;
  lossReason?: string;
  cnpj?: string;
  emails: string[];
  phones: string[];
  logoUrl?: string;
  website?: string;
  razaoSocial?: string;
  endereco?: string;
  interactions: Interaction[];
  taskIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type SprintPriority = 'high' | 'medium' | 'low';

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  stage: ProjectStage;
  priority: SprintPriority;
  startDate: string;
  dueDate?: string;
  endDate?: string;
  status: 'active' | 'completed';
  taskIds: string[];
}

export interface Project {
  id: string;
  clientName: string;
  clientContact: string;
  clientPhone?: string;
  type: ProjectType;
  status: ProjectStatus;
  ownerIds: string[];
  currentSprintId?: string;
  sprints: Sprint[];
  taskIds: string[];
  nextDeliveryDate?: string;
  leadId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  ownerIds: string[];
  dueDate?: string;
  tags: string[];
  projectId?: string;
  sprintId?: string;
  leadId?: string;
  createdAt: string;
  updatedAt: string;
}

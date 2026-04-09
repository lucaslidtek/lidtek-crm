# Plan 003 — Mock Data e API Layer

## Descrição
Criar dados mock realistas e API layer com interface Promise-based + persistência localStorage. A interface da API é idêntica a uma API real — quando o backend for implementado, basta trocar a implementação interna.

## Módulo
Infraestrutura — alimenta F01-F07

## Arquivos

#### [NEW] `src/shared/types/models.ts`
Interfaces TypeScript baseadas no BUSINESS_RULES.md:

```typescript
// Enums
type FunnelStage = 'prospecting' | 'first_meeting' | 'briefing' | 'proposal_sent' | 'negotiation' | 'contract_sent' | 'contract_signed' | 'lost';
type ProjectType = 'recurring' | 'oneshot';
type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived';
type ProjectStage = 'onboarding' | 'architecture' | 'development' | 'review' | 'homologation' | 'deploy' | 'support';
type TaskType = 'project' | 'sales' | 'standalone';
type TaskStatus = 'todo' | 'in_progress' | 'done' | 'blocked';
type TaskPriority = 'high' | 'medium' | 'low';
type UserRole = 'admin' | 'manager' | 'collaborator' | 'readonly';

// Models
interface User { id, name, email, role, initials, avatarUrl? }
interface Interaction { id, leadId, type, content, date, userId }
interface Lead { id, name, contact, origin, ownerId, notes, stage, nextContactDate?, estimatedValue?, solutionType?, lossReason?, interactions, taskIds, createdAt, updatedAt }
interface Sprint { id, projectId, name, stage, startDate, endDate?, status, taskIds }
interface Project { id, clientName, clientContact, type, status, ownerId, currentSprintId?, sprints, taskIds, nextDeliveryDate?, leadId, createdAt, updatedAt }
interface Task { id, title, description?, type, status, priority, ownerId, dueDate?, tags, projectId?, sprintId?, leadId?, createdAt, updatedAt }
```

#### [NEW] `src/shared/data/mockUsers.ts`
4 usuários mock (um por persona):
- Lucas Ribeiro (Admin/Sócio)
- Ana Torres (Gestora Comercial)
- Rafael Mendes (Gerente de Projetos)
- Marina Costa (Desenvolvedora)

#### [NEW] `src/shared/data/mockLeads.ts`
12-15 leads distribuídos pelas 8 etapas:
- Nomes empresas brasileiras: "Grupo Vértice", "Indústria Paraná", "Clínica Saúde+", etc.
- Mix de origens: indicação, site, evento, LinkedIn
- Valores estimados: R$ 5k - R$ 80k
- Alguns com follow-up vencido (para testar alertas visuais)
- 2-3 interações por lead

#### [NEW] `src/shared/data/mockProjects.ts`
8 projetos:
- 4 recorrentes (manutenção contínua)
- 4 únicos (escopo definido)
- Cada um com 2-4 sprints (algumas concluídas, uma ativa)
- Datas de entrega variadas (algumas nos próximos 7 dias)

#### [NEW] `src/shared/data/mockTasks.ts`
20 tarefas:
- 8 de projeto (vinculadas a sprints)
- 6 de vendas (vinculadas a leads)
- 6 avulsas
- Mix de status: 5 todo, 6 in_progress, 5 done, 4 blocked
- Mix de prioridade: 5 high, 10 medium, 5 low
- 3-4 vencidas, 3-4 vencendo em 48h

#### [NEW] `src/shared/lib/mockApi.ts`
```typescript
const api = {
  leads: { list, getById, create, update, updateStage, delete },
  projects: { list, getById, create, update },
  sprints: { list, getById, create, update, complete },
  tasks: { list, getById, create, update, updateStatus, delete },
  users: { list, getById, getCurrent },
}
```
- Todas retornam `Promise<T>` (simulando async)
- CRUD opera sobre dados em memória
- Sync com localStorage a cada mutação
- Inicializa com mock data se localStorage vazio

#### [NEW] `src/shared/lib/store.ts`
- Context API com `useStore()` hook
- Estado: `{ leads, projects, tasks, users, currentUser }`
- Actions: dispatch para CRUD (wrapppers over mockApi)
- Inicialização: carrega de localStorage ou mock data

## Dados — Constantes de Referência

#### [NEW] `src/shared/lib/constants.ts`
```typescript
export const FUNNEL_STAGES = [
  { id: 'prospecting', label: 'Prospecção', color: '#A3A3A3' },
  { id: 'first_meeting', label: '1ª Reunião', color: '#6580E1' },
  { id: 'briefing', label: 'Briefing', color: '#5A4FFF' },
  { id: 'proposal_sent', label: 'Proposta Enviada', color: '#7B73FF' },
  { id: 'negotiation', label: 'Negociação', color: '#F59E0B' },
  { id: 'contract_sent', label: 'Contrato Enviado', color: '#10B981' },
  { id: 'contract_signed', label: 'Contrato Assinado', color: '#10B981' },
  { id: 'lost', label: 'Perdido', color: '#EF4444' },
];

export const TASK_STATUSES = [...];
export const TASK_PRIORITIES = [...];
export const PROJECT_STAGES = [...];
```

## Checklist
- [ ] Criar `models.ts` com todas as interfaces
- [ ] Criar `constants.ts` com enums e labels
- [ ] Criar `mockUsers.ts` (4 personas)
- [ ] Criar `mockLeads.ts` (12-15 leads)
- [ ] Criar `mockProjects.ts` (8 projetos + sprints)
- [ ] Criar `mockTasks.ts` (20 tarefas)
- [ ] Criar `mockApi.ts` (CRUD + localStorage)
- [ ] Criar `store.ts` (Context API)

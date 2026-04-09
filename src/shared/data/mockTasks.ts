import type { Task } from '@/shared/types/models';

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();
const daysFromNow = (d: number) => new Date(now.getTime() + d * 86400000).toISOString();
const today = () => new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

export const mockTasks: Task[] = [
  // === TAREFAS DE PROJETO (8) ===
  { id: 'task-p1', title: 'Corrigir bug no relatório de vendas', type: 'project', status: 'in_progress', priority: 'high', ownerId: 'user-4', dueDate: daysFromNow(1), tags: ['bug', 'urgente'], projectId: 'proj-1', sprintId: 'spr-1b', createdAt: daysAgo(3), updatedAt: daysAgo(1) },
  { id: 'task-p2', title: 'Atualizar API de integração com estoque', type: 'project', status: 'todo', priority: 'medium', ownerId: 'user-4', dueDate: daysFromNow(5), tags: ['api'], projectId: 'proj-1', sprintId: 'spr-1b', createdAt: daysAgo(2), updatedAt: daysAgo(2) },
  { id: 'task-p3', title: 'Implementar módulo de agenda jurídica', type: 'project', status: 'in_progress', priority: 'high', ownerId: 'user-4', dueDate: daysFromNow(3), tags: ['feature'], projectId: 'proj-2', sprintId: 'spr-2c', createdAt: daysAgo(5), updatedAt: daysAgo(1) },
  { id: 'task-p4', title: 'Preparar apresentação de revisão', type: 'project', status: 'todo', priority: 'medium', ownerId: 'user-3', dueDate: today(), tags: ['reunião'], projectId: 'proj-3', sprintId: 'spr-3b', createdAt: daysAgo(2), updatedAt: daysAgo(2) },
  { id: 'task-p5', title: 'Ajustar layout do painel de consultas', type: 'project', status: 'done', priority: 'low', ownerId: 'user-4', dueDate: daysAgo(1), tags: ['ui'], projectId: 'proj-3', sprintId: 'spr-3b', createdAt: daysAgo(5), updatedAt: daysAgo(1) },
  { id: 'task-p6', title: 'Desenvolver tela de doações online', type: 'project', status: 'in_progress', priority: 'high', ownerId: 'user-4', dueDate: daysFromNow(7), tags: ['feature', 'frontend'], projectId: 'proj-5', sprintId: 'spr-5b', createdAt: daysAgo(10), updatedAt: daysAgo(2) },
  { id: 'task-p7', title: 'Testes de homologação com equipe do hotel', type: 'project', status: 'blocked', priority: 'high', ownerId: 'user-3', dueDate: daysAgo(1), tags: ['teste', 'bloqueado'], projectId: 'proj-6', sprintId: 'spr-6b', description: 'Aguardando acesso ao ambiente de staging do cliente.', createdAt: daysAgo(5), updatedAt: daysAgo(1) },
  { id: 'task-p8', title: 'Deploy final — configurar DNS e SSL', type: 'project', status: 'todo', priority: 'high', ownerId: 'user-4', dueDate: daysFromNow(1), tags: ['deploy', 'infra'], projectId: 'proj-7', sprintId: 'spr-7a', createdAt: daysAgo(3), updatedAt: daysAgo(1) },

  // === TAREFAS DE VENDAS (6) ===
  { id: 'task-s1', title: 'Ligar para Grupo Vértice — primeiro follow-up', type: 'sales', status: 'todo', priority: 'medium', ownerId: 'user-2', dueDate: daysFromNow(2), tags: ['follow-up'], leadId: 'lead-1', createdAt: daysAgo(3), updatedAt: daysAgo(3) },
  { id: 'task-s2', title: 'Reenviar e-mail para Construtora Horizonte', type: 'sales', status: 'todo', priority: 'high', ownerId: 'user-1', dueDate: daysAgo(1), tags: ['follow-up', 'atrasada'], leadId: 'lead-3', createdAt: daysAgo(4), updatedAt: daysAgo(1) },
  { id: 'task-s3', title: 'Preparar proposta técnica — Transportadora Rápida', type: 'sales', status: 'in_progress', priority: 'high', ownerId: 'user-2', dueDate: daysFromNow(3), tags: ['proposta'], leadId: 'lead-6', createdAt: daysAgo(2), updatedAt: daysAgo(1) },
  { id: 'task-s4', title: 'Cobrar resposta do questionário — Indústria Paraná', type: 'sales', status: 'todo', priority: 'medium', ownerId: 'user-1', dueDate: daysAgo(2), tags: ['follow-up', 'atrasada'], leadId: 'lead-7', createdAt: daysAgo(4), updatedAt: daysAgo(2) },
  { id: 'task-s5', title: 'Agendar call para tirar dúvidas — Imobiliária Progresso', type: 'sales', status: 'in_progress', priority: 'medium', ownerId: 'user-2', dueDate: daysFromNow(4), tags: ['follow-up'], leadId: 'lead-8', createdAt: daysAgo(3), updatedAt: daysAgo(1) },
  { id: 'task-s6', title: 'Revisar proposta com desconto — Agro Solutions', type: 'sales', status: 'in_progress', priority: 'high', ownerId: 'user-2', dueDate: daysFromNow(1), tags: ['proposta', 'negociação'], leadId: 'lead-10', createdAt: daysAgo(1), updatedAt: daysAgo(1) },

  // === TAREFAS AVULSAS (6) ===
  { id: 'task-a1', title: 'Atualizar portfólio no site da Lidtek', type: 'standalone', status: 'todo', priority: 'low', ownerId: 'user-1', dueDate: daysFromNow(10), tags: ['marketing'], createdAt: daysAgo(5), updatedAt: daysAgo(5) },
  { id: 'task-a2', title: 'Renovar certificado SSL do servidor', type: 'standalone', status: 'todo', priority: 'high', ownerId: 'user-4', dueDate: today(), tags: ['infra', 'urgente'], createdAt: daysAgo(7), updatedAt: daysAgo(1) },
  { id: 'task-a3', title: 'Confirmar presença no meetup de React', type: 'standalone', status: 'done', priority: 'low', ownerId: 'user-4', dueDate: daysAgo(3), tags: ['evento'], createdAt: daysAgo(10), updatedAt: daysAgo(3) },
  { id: 'task-a4', title: 'Preparar apresentação institucional atualizada', type: 'standalone', status: 'in_progress', priority: 'medium', ownerId: 'user-1', dueDate: daysFromNow(2), tags: ['marketing'], createdAt: daysAgo(4), updatedAt: daysAgo(1) },
  { id: 'task-a5', title: 'Organizar documentação de processos internos', type: 'standalone', status: 'blocked', priority: 'medium', ownerId: 'user-3', dueDate: daysFromNow(7), tags: ['processos'], description: 'Esperando feedback do Lucas sobre o novo modelo de documentação.', createdAt: daysAgo(6), updatedAt: daysAgo(2) },
  { id: 'task-a6', title: 'Backup mensal dos repositórios', type: 'standalone', status: 'done', priority: 'medium', ownerId: 'user-4', dueDate: daysAgo(5), tags: ['infra'], createdAt: daysAgo(8), updatedAt: daysAgo(5) },
];

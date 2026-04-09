import type { Lead, Project, Sprint, Task, User, FunnelStage, TaskStatus } from '@/shared/types/models';
import { mockUsers, DEFAULT_USER } from '@/shared/data/mockUsers';
import { mockLeads } from '@/shared/data/mockLeads';
import { mockProjects } from '@/shared/data/mockProjects';
import { mockTasks } from '@/shared/data/mockTasks';

// ============================================
// MOCK API — Lidtek CRM
// Interface Promise-based, persistência localStorage
// Swap para API real: trocar implementação interna
// ============================================

const STORAGE_KEY = 'lidtek-crm-data';

interface AppData {
  leads: Lead[];
  projects: Project[];
  tasks: Task[];
  users: User[];
}

// --- Persistence ---
function loadData(): AppData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // corrupted data, reset
  }
  const defaults: AppData = {
    leads: structuredClone(mockLeads),
    projects: structuredClone(mockProjects),
    tasks: structuredClone(mockTasks),
    users: structuredClone(mockUsers),
  };
  saveData(defaults);
  return defaults;
}

function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let data = loadData();

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// --- Simulated async ---
function resolve<T>(value: T): Promise<T> {
  return Promise.resolve(value);
}

// ============================================
// API
// ============================================

export const api = {
  // --- Users ---
  users: {
    list: () => resolve([...data.users]),
    getById: (id: string) => resolve(data.users.find(u => u.id === id)),
    getCurrent: () => resolve(DEFAULT_USER),
    create: (input: Omit<User, 'id'>) => {
      const user: User = {
        ...input,
        id: generateId('user'),
      };
      data.users.push(user);
      saveData(data);
      return resolve(user);
    },
    update: (id: string, updates: Partial<User>) => {
      const idx = data.users.findIndex(u => u.id === id);
      if (idx === -1) return Promise.reject(new Error('User not found'));
      data.users[idx] = { ...data.users[idx]!, ...updates };
      saveData(data);
      return resolve(data.users[idx]!);
    },
    delete: (id: string) => {
      data.users = data.users.filter(u => u.id !== id);
      saveData(data);
      return resolve(true);
    },
  },

  // --- Leads ---
  leads: {
    list: () => resolve([...data.leads]),
    getById: (id: string) => resolve(data.leads.find(l => l.id === id)),
    create: (input: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'interactions' | 'taskIds'>) => {
      const lead: Lead = {
        ...input,
        id: generateId('lead'),
        interactions: [],
        taskIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      data.leads.push(lead);
      saveData(data);
      return resolve(lead);
    },
    update: (id: string, updates: Partial<Lead>) => {
      const idx = data.leads.findIndex(l => l.id === id);
      if (idx === -1) return Promise.reject(new Error('Lead not found'));
      data.leads[idx] = { ...data.leads[idx]!, ...updates, updatedAt: new Date().toISOString() };
      saveData(data);
      return resolve(data.leads[idx]!);
    },
    updateStage: (id: string, stage: FunnelStage) => {
      return api.leads.update(id, { stage });
    },
    delete: (id: string) => {
      data.leads = data.leads.filter(l => l.id !== id);
      saveData(data);
      return resolve(true);
    },
  },

  // --- Projects ---
  projects: {
    list: () => resolve([...data.projects]),
    getById: (id: string) => resolve(data.projects.find(p => p.id === id)),
    create: (input: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'sprints' | 'taskIds'>) => {
      const project: Project = {
        ...input,
        id: generateId('proj'),
        sprints: [],
        taskIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      data.projects.push(project);
      saveData(data);
      return resolve(project);
    },
    update: (id: string, updates: Partial<Project>) => {
      const idx = data.projects.findIndex(p => p.id === id);
      if (idx === -1) return Promise.reject(new Error('Project not found'));
      data.projects[idx] = { ...data.projects[idx]!, ...updates, updatedAt: new Date().toISOString() };
      saveData(data);
      return resolve(data.projects[idx]!);
    },
  },

  // --- Sprints ---
  sprints: {
    create: (projectId: string, input: Omit<Sprint, 'id' | 'projectId' | 'taskIds'>) => {
      const sprint: Sprint = {
        ...input,
        id: generateId('spr'),
        projectId,
        taskIds: [],
      };
      const project = data.projects.find(p => p.id === projectId);
      if (!project) return Promise.reject(new Error('Project not found'));
      project.sprints.push(sprint);
      project.currentSprintId = sprint.id;
      project.updatedAt = new Date().toISOString();
      saveData(data);
      return resolve(sprint);
    },
    update: (sprintId: string, updates: Partial<Sprint>) => {
      for (const project of data.projects) {
        const idx = project.sprints.findIndex(s => s.id === sprintId);
        if (idx !== -1) {
          project.sprints[idx] = { ...project.sprints[idx]!, ...updates };
          project.updatedAt = new Date().toISOString();
          saveData(data);
          return resolve(project.sprints[idx]!);
        }
      }
      return Promise.reject(new Error('Sprint not found'));
    },
    complete: (sprintId: string) => {
      return api.sprints.update(sprintId, { status: 'completed', endDate: new Date().toISOString() });
    },
    delete: (sprintId: string) => {
      for (const project of data.projects) {
        const idx = project.sprints.findIndex(s => s.id === sprintId);
        if (idx !== -1) {
          project.sprints.splice(idx, 1);
          // If we deleted the current sprint, set to the latest active or null
          if (project.currentSprintId === sprintId) {
            const activeSprint = project.sprints.find(s => s.status === 'active');
            project.currentSprintId = activeSprint?.id;
          }
          project.updatedAt = new Date().toISOString();
          saveData(data);
          return resolve(undefined);
        }
      }
      return Promise.reject(new Error('Sprint not found'));
    },
  },

  // --- Tasks ---
  tasks: {
    list: () => resolve([...data.tasks]),
    getById: (id: string) => resolve(data.tasks.find(t => t.id === id)),
    create: (input: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
      const task: Task = {
        ...input,
        id: generateId('task'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      data.tasks.push(task);
      saveData(data);
      return resolve(task);
    },
    update: (id: string, updates: Partial<Task>) => {
      const idx = data.tasks.findIndex(t => t.id === id);
      if (idx === -1) return Promise.reject(new Error('Task not found'));
      data.tasks[idx] = { ...data.tasks[idx]!, ...updates, updatedAt: new Date().toISOString() };
      saveData(data);
      return resolve(data.tasks[idx]!);
    },
    updateStatus: (id: string, status: TaskStatus) => {
      return api.tasks.update(id, { status });
    },
    delete: (id: string) => {
      data.tasks = data.tasks.filter(t => t.id !== id);
      saveData(data);
      return resolve(true);
    },
  },

  // --- Utility ---
  reset: () => {
    localStorage.removeItem(STORAGE_KEY);
    data = loadData();
    return resolve(true);
  },
};

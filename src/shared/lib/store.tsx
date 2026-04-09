import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Lead, Project, Task, User, Sprint, FunnelStage, TaskStatus, ProjectType } from '@/shared/types/models';
import { api } from '@/shared/lib/supabaseApi';
import { supabase } from '@/shared/lib/supabase';

// ============================================
// STORE — Estado global do app
// Context API + mockApi
// ============================================

interface StoreState {
  leads: Lead[];
  projects: Project[];
  tasks: Task[];
  users: User[];
  loading: boolean;
}

interface StoreActions {
  // Leads
  refreshLeads: () => Promise<void>;
  createLead: (data: Parameters<typeof api.leads.create>[0]) => Promise<Lead>;
  updateLead: (id: string, data: Partial<Lead>) => Promise<Lead>;
  moveLeadStage: (id: string, stage: FunnelStage) => Promise<Lead>;
  deleteLead: (id: string) => Promise<void>;
  updateProject: (id: string, data: Partial<Project>) => Promise<Project>;
  // Projects
  refreshProjects: () => Promise<void>;
  // Tasks
  refreshTasks: () => Promise<void>;
  createTask: (data: Parameters<typeof api.tasks.create>[0]) => Promise<Task>;
  updateTask: (id: string, data: Partial<Task>) => Promise<Task>;
  moveTaskStatus: (id: string, status: TaskStatus) => Promise<Task>;
  // Sprints
  createSprint: (projectId: string, data: Parameters<typeof api.sprints.create>[1]) => Promise<void>;
  updateSprint: (sprintId: string, data: Partial<Sprint>) => Promise<void>;
  completeSprint: (sprintId: string) => Promise<void>;
  deleteSprint: (sprintId: string) => Promise<void>;
  // Users
  refreshUsers: () => Promise<void>;
  createUser: (data: Parameters<typeof api.users.create>[0]) => Promise<User>;
  updateUser: (id: string, data: Partial<User>) => Promise<User>;
  deleteUser: (id: string) => Promise<void>;
  // Utils
  refreshAll: () => Promise<void>;
  getUserById: (id: string) => User | undefined;
  // Sorting/Ordering
  reorderLeads: (leads: Lead[]) => void;
  reorderTasks: (tasks: Task[]) => void;
  reorderProjects: (projects: Project[]) => void;
  // Conversion
  convertLeadToProject: (leadId: string, projectType: ProjectType) => Promise<Project>;
}

type StoreContextType = StoreState & StoreActions;

const StoreContext = createContext<StoreContextType | null>(null);

export function useStore(): StoreContextType {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshLeads = useCallback(async () => {
    const fresh = await api.leads.list();
    setLeads(current => {
      if (current.length === 0) return fresh;
      const orderMap = new Map(current.map((item, idx) => [item.id, idx]));
      return fresh.sort((a, b) => {
        const orderA = orderMap.get(a.id) ?? 99999;
        const orderB = orderMap.get(b.id) ?? 99999;
        return orderA - orderB;
      });
    });
  }, []);

  const refreshProjects = useCallback(async () => {
    const fresh = await api.projects.list();
    setProjects(current => {
      if (current.length === 0) return fresh;
      const orderMap = new Map(current.map((item, idx) => [item.id, idx]));
      return fresh.sort((a, b) => {
        const orderA = orderMap.get(a.id) ?? 99999;
        const orderB = orderMap.get(b.id) ?? 99999;
        return orderA - orderB;
      });
    });
  }, []);

  const refreshTasks = useCallback(async () => {
    const fresh = await api.tasks.list();
    setTasks(current => {
      if (current.length === 0) return fresh;
      const orderMap = new Map(current.map((item, idx) => [item.id, idx]));
      return fresh.sort((a, b) => {
        const orderA = orderMap.get(a.id) ?? 99999;
        const orderB = orderMap.get(b.id) ?? 99999;
        return orderA - orderB;
      });
    });
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    // Wait for auth session to be ready before querying — prevents
    // empty results when the JWT token hasn't been restored yet.
    await supabase.auth.getSession();
    const [l, p, t, u] = await Promise.all([
      api.leads.list(),
      api.projects.list(),
      api.tasks.list(),
      api.users.list(),
    ]);
    setLeads(l);
    setProjects(p);
    setTasks(t);
    setUsers(u);
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshAll();

    // Re-fetch data whenever auth state changes (login, token refresh, etc.)
    // This guarantees data loads even if the initial refreshAll ran too early.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        refreshAll();
      }
    });

    return () => subscription.unsubscribe();
  }, [refreshAll]);

  const createLead = useCallback(async (data: Parameters<typeof api.leads.create>[0]) => {
    const lead = await api.leads.create(data);
    await refreshLeads();
    return lead;
  }, [refreshLeads]);

  const updateLead = useCallback(async (id: string, data: Partial<Lead>) => {
    const lead = await api.leads.update(id, data);
    await refreshLeads();
    return lead;
  }, [refreshLeads]);

  const moveLeadStage = useCallback(async (id: string, stage: FunnelStage) => {
    const lead = await api.leads.updateStage(id, stage);
    await refreshLeads();
    return lead;
  }, [refreshLeads]);

  const deleteLead = useCallback(async (id: string) => {
    await api.leads.delete(id);
    await refreshLeads();
  }, [refreshLeads]);

  const createTask = useCallback(async (data: Parameters<typeof api.tasks.create>[0]) => {
    const task = await api.tasks.create(data);
    await refreshTasks();
    return task;
  }, [refreshTasks]);

  const updateTask = useCallback(async (id: string, data: Partial<Task>) => {
    const task = await api.tasks.update(id, data);
    await refreshTasks();
    return task;
  }, [refreshTasks]);

  const moveTaskStatus = useCallback(async (id: string, status: TaskStatus) => {
    const task = await api.tasks.updateStatus(id, status);
    await refreshTasks();
    return task;
  }, [refreshTasks]);

  const createSprint = useCallback(async (projectId: string, data: Parameters<typeof api.sprints.create>[1]) => {
    await api.sprints.create(projectId, data);
    await refreshProjects();
  }, [refreshProjects]);

  const updateSprint = useCallback(async (sprintId: string, data: Partial<Sprint>) => {
    await api.sprints.update(sprintId, data);
    await refreshProjects();
  }, [refreshProjects]);

  const completeSprint = useCallback(async (sprintId: string) => {
    await api.sprints.complete(sprintId);
    await refreshProjects();
  }, [refreshProjects]);

  const deleteSprint = useCallback(async (sprintId: string) => {
    await api.sprints.delete(sprintId);
    await refreshProjects();
  }, [refreshProjects]);

  const getUserById = useCallback((id: string) => {
    return users.find(u => u.id === id);
  }, [users]);

  const updateProject = useCallback(async (id: string, data: Partial<Project>) => {
    const project = await api.projects.update(id, data);
    await refreshProjects();
    return project;
  }, [refreshProjects]);

  const refreshUsers = useCallback(async () => {
    setUsers(await api.users.list());
  }, []);

  const createUser = useCallback(async (data: Parameters<typeof api.users.create>[0]) => {
    const user = await api.users.create(data);
    await refreshUsers();
    return user;
  }, [refreshUsers]);

  const updateUser = useCallback(async (id: string, data: Partial<User>) => {
    const user = await api.users.update(id, data);
    await refreshUsers();
    return user;
  }, [refreshUsers]);

  const deleteUser = useCallback(async (id: string) => {
    await api.users.delete(id);
    await refreshUsers();
  }, [refreshUsers]);

  const convertLeadToProject = useCallback(async (leadId: string, projectType: ProjectType) => {
    // 1. Find the lead
    const lead = leads.find(l => l.id === leadId);
    if (!lead) throw new Error('Lead not found');

    // 2. Move lead to contract_signed
    await api.leads.updateStage(leadId, 'contract_signed');

    // 3. Create a new project from the lead data
    const project = await api.projects.create({
      clientName: lead.name,
      clientContact: lead.contact,
      type: projectType,
      status: 'active',
      ownerId: lead.ownerId,
      leadId: lead.id,
    });

    // 4. Create initial onboarding sprint
    await api.sprints.create(project.id, {
      name: 'Onboarding — Setup inicial',
      stage: 'onboarding',
      startDate: new Date().toISOString(),
      status: 'active',
    });

    // 5. Refresh everything
    await refreshAll();

    return project;
  }, [leads, refreshAll]);

  const reorderLeads = useCallback((reorderedSubset: Lead[]) => {
    setLeads(current => {
      const subsetIds = new Set(reorderedSubset.map(i => i.id));
      const excluded = current.filter(i => !subsetIds.has(i.id));
      return [...reorderedSubset, ...excluded];
    });
  }, []);

  const reorderProjects = useCallback((reorderedSubset: Project[]) => {
    setProjects(current => {
      const subsetIds = new Set(reorderedSubset.map(i => i.id));
      const excluded = current.filter(i => !subsetIds.has(i.id));
      return [...reorderedSubset, ...excluded];
    });
  }, []);

  const reorderTasks = useCallback((reorderedSubset: Task[]) => {
    setTasks(current => {
      const subsetIds = new Set(reorderedSubset.map(i => i.id));
      const excluded = current.filter(i => !subsetIds.has(i.id));
      return [...reorderedSubset, ...excluded];
    });
  }, []);

  return (
    <StoreContext.Provider value={{
      leads, projects, tasks, users, loading,
      refreshLeads, refreshProjects, refreshTasks, refreshAll,
      createLead, updateLead, moveLeadStage, deleteLead,
      updateProject,
      createTask, updateTask, moveTaskStatus,
      createSprint,
      updateSprint,
      completeSprint,
      deleteSprint,
      refreshUsers, createUser, updateUser, deleteUser,
      getUserById,
      convertLeadToProject,
      reorderLeads,
      reorderProjects,
      reorderTasks,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

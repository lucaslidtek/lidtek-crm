import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { Lead, Project, Task, User, Sprint, FunnelStage, TaskStatus, ProjectType } from '@/shared/types/models';
import { api } from '@/shared/lib/supabaseApi';
import { useAuth } from '@/app/providers/AuthProvider';

// ============================================
// STORE — Estado global do app
// Context API + Supabase
// Data only loads when auth is confirmed (isAuthenticated === true)
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

// ────────────────────────────────────────────
// MODULE-LEVEL HMR CACHE
// Vite HMR remounts React components but does NOT re-execute modules that
// weren’t edited. This cache lives at module scope — it survives StoreProvider
// remounts and is used to hydrate useState instantly, so the UI never flashes
// empty while waiting for a Supabase round-trip.
// ────────────────────────────────────────────
let _cache: {
  leads: Lead[];
  projects: Project[];
  tasks: Task[];
  users: User[];
} | null = null;

const StoreContext = createContext<StoreContextType | null>(null);

export function useStore(): StoreContextType {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  // Initialize from module-level cache so HMR remounts show data instantly
  const [leads, setLeads] = useState<Lead[]>(() => _cache?.leads ?? []);
  const [projects, setProjects] = useState<Project[]>(() => _cache?.projects ?? []);
  const [tasks, setTasks] = useState<Task[]>(() => _cache?.tasks ?? []);
  const [users, setUsers] = useState<User[]>(() => _cache?.users ?? []);
  // Start loading=false if we have cached data (HMR) — true only on cold start
  const [loading, setLoading] = useState(() => _cache === null);
  const fetchedRef = useRef(false);

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
    try {
      const u = await api.users.list();
      const [l, p, t] = await Promise.all([
        api.leads.list(),
        api.projects.list(),
        api.tasks.list(),
      ]);
      setUsers(u);
      setLeads(l);
      setProjects(p);
      setTasks(t);
      // Populate module-level cache so HMR remounts restore data instantly
      _cache = { leads: l, projects: p, tasks: t, users: u };
    } catch (err) {
      console.error('[Store] refreshAll failed:', err);
    }
    setLoading(false);
  }, []);

  // ─── Auth-driven data loading ───
  // Only fetch data when auth confirms the user is logged in.
  // On logout, clear all data. On HMR, if auth is already confirmed
  // from localStorage cache, data loads immediately.
  useEffect(() => {
    if (authLoading) return; // Auth still initializing — wait

    if (isAuthenticated) {
      // If cache is populated (HMR scenario), skip fetch — data already in state
      if (_cache !== null) {
        fetchedRef.current = true;
        return;
      }
      // Cold start — fetch from Supabase
      if (!fetchedRef.current) {
        fetchedRef.current = true;
        refreshAll();
      }
    } else {
      // Logged out — clear everything including cache
      fetchedRef.current = false;
      _cache = null;
      setLeads([]);
      setProjects([]);
      setTasks([]);
      setUsers([]);
      setLoading(false);
    }
  }, [isAuthenticated, authLoading, refreshAll]);

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

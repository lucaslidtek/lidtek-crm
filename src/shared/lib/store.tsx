import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { Lead, Project, Task, User, Sprint, FunnelStage, FunnelColumn, TaskStatus, ProjectType } from '@/shared/types/models';
import { api } from '@/shared/lib/supabaseApi';
import { supabase } from '@/shared/lib/supabase';
import { useAuth } from '@/app/providers/AuthProvider';
import { DEFAULT_FUNNEL_COLUMNS } from '@/shared/lib/constants';

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
  funnelColumns: FunnelColumn[];
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
  deleteTask: (id: string) => Promise<void>;
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
  // Funnel Columns
  refreshFunnelColumns: () => Promise<void>;
  createFunnelColumn: (data: { label: string; color: string }) => Promise<FunnelColumn>;
  updateFunnelColumn: (id: string, data: Partial<Pick<FunnelColumn, 'label' | 'color'>>) => Promise<FunnelColumn>;
  deleteFunnelColumn: (id: string) => Promise<void>;
  reorderFunnelColumns: (columns: FunnelColumn[]) => Promise<void>;
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
  funnelColumns: FunnelColumn[];
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
  const [funnelColumns, setFunnelColumns] = useState<FunnelColumn[]>(() => _cache?.funnelColumns ?? DEFAULT_FUNNEL_COLUMNS);
  // Start loading=false if we have cached data (HMR) — true only on cold start
  const [loading, setLoading] = useState(() => _cache === null);
  const fetchedRef = useRef(false);

  // ── Enrich projects with lead data ──
  // Client fields (name, contact, phone) come from the lead relationship,
  // ensuring a single source of truth. When a lead is renamed, all project
  // and task references update automatically.
  const enrichProjectsWithLeads = useCallback((rawProjects: Project[], allLeads: Lead[]): Project[] => {
    const leadMap = new Map(allLeads.map(l => [l.id, l]));
    return rawProjects.map(p => {
      const lead = leadMap.get(p.leadId);
      if (lead) {
        return {
          ...p,
          clientName: lead.name,
          clientContact: lead.contact,
          clientPhone: lead.phone,
        };
      }
      return p;
    });
  }, []);

  const refreshLeads = useCallback(async () => {
    try {
      const fresh = await api.leads.list();
      setLeads(fresh);
      // Re-enrich projects with updated lead data
      setProjects(current => enrichProjectsWithLeads(current, fresh));
      // Update cache
      if (_cache) _cache.leads = fresh;
    } catch (err) {
      console.warn('[Store] refreshLeads failed - preserving existing state:', err);
    }
  }, [enrichProjectsWithLeads]);

  const refreshProjects = useCallback(async () => {
    try {
      const fresh = await api.projects.list();
      // Get current leads to enrich
      const currentLeads = await api.leads.list();
      const enriched = enrichProjectsWithLeads(fresh, currentLeads);
      setProjects(enriched);
      // Update cache
      if (_cache) _cache.projects = enriched;
    } catch (err) {
      console.warn('[Store] refreshProjects failed — preserving existing state:', err);
    }
  }, [enrichProjectsWithLeads]);

  const refreshTasks = useCallback(async () => {
    try {
      const fresh = await api.tasks.list();
      setTasks(fresh);
      // Update cache
      if (_cache) _cache.tasks = fresh;
    } catch (err) {
      console.warn('[Store] refreshTasks failed — preserving existing state:', err);
    }
  }, []);

  const refreshFunnelColumns = useCallback(async () => {
    try {
      const cols = await api.funnelColumns.list();
      const resolved = cols.length > 0 ? cols : DEFAULT_FUNNEL_COLUMNS;
      setFunnelColumns(resolved);
      // Update cache
      if (_cache) _cache.funnelColumns = resolved;
    } catch (err) {
      console.warn('[Store] refreshFunnelColumns failed:', err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      const [u, l, p, t, fc] = await Promise.all([
        api.users.list().catch(e => { console.error('[Store] users.list failed:', e.message); return [] as User[]; }),
        api.leads.list().catch(e => { console.error('[Store] leads.list failed:', e.message); return [] as Lead[]; }),
        api.projects.list().catch(e => { console.error('[Store] projects.list failed:', e.message); return [] as Project[]; }),
        api.tasks.list().catch(e => { console.error('[Store] tasks.list failed:', e.message); return [] as Task[]; }),
        api.funnelColumns.list().catch(e => { console.error('[Store] funnelColumns.list failed:', e.message); return [] as FunnelColumn[]; }),
      ]);


      // ── Zombie-session guard ──
      // If ALL collections came back empty but we already had data in cache,
      // something is wrong (most likely the JWT expired and RLS silently
      // returned empty arrays instead of an error). In this case, DON'T
      // overwrite state — preserve what we have and let the AuthProvider
      // handle the re-authentication cycle.
      const allEmpty = u.length === 0 && l.length === 0 && p.length === 0 && t.length === 0 && fc.length === 0;
      if (allEmpty && _cache && (_cache.leads.length > 0 || _cache.projects.length > 0 || _cache.users.length > 0 || _cache.tasks.length > 0)) {
        console.warn('[Store] All collections returned empty but cache has data — possible expired token. Preserving state and forcing session recheck.');
        // Force a session revalidation — if the token truly expired, AuthProvider
        // will catch it and redirect to login. If the token is fine (e.g. user
        // really has no data), the next refreshAll will succeed normally.
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (!user) {
            supabase.auth.signOut();
          } else {
            _cache = null;
            fetchedRef.current = false;
          }
        });
        setLoading(false);
        return;
      }

      // If users returned empty, the profile may still be being created (upsert race).
      // Retry once after 2s to catch the bootstrapped profile.
      const resolvedUsers = u.length > 0 ? u : await new Promise<typeof u>((resolve) => {
        setTimeout(async () => {
          try {
            resolve(await api.users.list());
          } catch {
            resolve(u); // Return original empty array on error
          }
        }, 2000);
      });

      // ── Backfill: create tasks for orphan sprints ──
      // Any sprint that has no linked task gets one auto-created.
      const taskSprintIds = new Set(t.filter(tk => tk.sprintId).map(tk => tk.sprintId));
      const orphanSprints: { sprint: { id: string; name: string; endDate?: string }; project: typeof p[number] }[] = [];
      for (const proj of p) {
        for (const sp of proj.sprints) {
          if (!taskSprintIds.has(sp.id)) {
            orphanSprints.push({ sprint: sp, project: proj });
          }
        }
      }

      let finalTasks = t;
      if (orphanSprints.length > 0) {
        console.log(`[Store] Backfilling ${orphanSprints.length} orphan sprint(s) with tasks...`);
        await Promise.all(orphanSprints.map(({ sprint, project }) =>
          api.tasks.create({
            title: sprint.name,
            type: 'project',
            status: 'todo',
            priority: 'medium',
            ownerId: project.ownerId || resolvedUsers[0]?.id || '',
            tags: [],
            projectId: project.id,
            sprintId: sprint.id,
            dueDate: sprint.endDate,
          })
        ));
        // Re-fetch tasks to include the newly created ones
        finalTasks = await api.tasks.list();
      }

      const resolvedColumns = fc.length > 0 ? fc : DEFAULT_FUNNEL_COLUMNS;
      // Enrich projects with lead data (single source of truth)
      const enrichedProjects = enrichProjectsWithLeads(p, l);
      setUsers(resolvedUsers);
      setLeads(l);
      setProjects(enrichedProjects);
      setTasks(finalTasks);
      setFunnelColumns(resolvedColumns);
      // Populate module-level cache so HMR remounts restore data instantly
      _cache = { leads: l, projects: enrichedProjects, tasks: finalTasks, users: resolvedUsers, funnelColumns: resolvedColumns };
    } catch (err) {
      // DON'T wipe state on error — preserve whatever is in state already.
      // The user sees stale data rather than an empty screen.
      console.error('[Store] refreshAll failed — preserving existing state:', err);
    }
    setLoading(false);
  }, []);


  // ─── Auth-driven data loading ───
  // Only fetch data when auth confirms the user is logged in.
  // On logout, clear all data. On HMR, cache provides instant hydration
  // via useState initializers, but we ALWAYS re-fetch from Supabase to
  // ensure data is fresh (cache is a UX optimization, not a data source).
  useEffect(() => {
    if (authLoading) return; // Auth still initializing — wait

    if (isAuthenticated) {
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
      setFunnelColumns(DEFAULT_FUNNEL_COLUMNS);
      setLoading(false);
    }
  }, [isAuthenticated, authLoading, refreshAll]);

  // ─── Visibility change: re-fetch data when returning to tab ───
  // When the user returns from a backgrounded tab, the auth token may have
  // been refreshed by the AuthProvider's visibilitychange handler. We
  // silently re-fetch all data to ensure the UI shows fresh state.
  // This runs WITHOUT setting loading=true to avoid a flash of loading UI.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      if (!isAuthenticated || authLoading) return;

      // Silent refresh — don't show loading spinner, just update data
      Promise.all([
        api.users.list(),
        api.leads.list(),
        api.projects.list(),
        api.tasks.list(),
        api.funnelColumns.list(),
      ]).then(([u, l, p, t, fc]) => {
        // Apply zombie-session guard here too
        const allEmpty = u.length === 0 && l.length === 0 && p.length === 0 && t.length === 0 && fc.length === 0;
        if (allEmpty && _cache && (_cache.leads.length > 0 || _cache.projects.length > 0 || _cache.users.length > 0 || _cache.tasks.length > 0)) {
          console.warn('[Store] Visibility refresh returned all empty — preserving cache');
          return;
        }

        const resolvedColumns = fc.length > 0 ? fc : DEFAULT_FUNNEL_COLUMNS;
        const enrichedProjects = enrichProjectsWithLeads(p, l);
        setUsers(u);
        setLeads(l);
        setProjects(enrichedProjects);
        setTasks(t);
        setFunnelColumns(resolvedColumns);
        _cache = { leads: l, projects: enrichedProjects, tasks: t, users: u, funnelColumns: resolvedColumns };
      }).catch(err => {
        console.warn('[Store] Visibility refresh failed — preserving existing state:', err);
      });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, authLoading, enrichProjectsWithLeads]);

  const createFunnelColumn = useCallback(async (data: { label: string; color: string }) => {
    const col = await api.funnelColumns.create(data);
    await refreshFunnelColumns();
    return col;
  }, [refreshFunnelColumns]);

  const updateFunnelColumn = useCallback(async (id: string, data: Partial<Pick<FunnelColumn, 'label' | 'color'>>) => {
    const col = await api.funnelColumns.update(id, data);
    await refreshFunnelColumns();
    return col;
  }, [refreshFunnelColumns]);

  const deleteFunnelColumn = useCallback(async (id: string) => {
    const firstColumn = funnelColumns[0];
    const fallbackId = firstColumn && firstColumn.id !== id ? firstColumn.id : (funnelColumns.find(c => c.id !== id)?.id ?? 'prospecting');
    await api.funnelColumns.delete(id, fallbackId);
    await Promise.all([refreshFunnelColumns(), refreshLeads()]);
  }, [funnelColumns, refreshFunnelColumns, refreshLeads]);

  const reorderFunnelColumns = useCallback(async (reordered: FunnelColumn[]) => {
    // Optimistic update
    setFunnelColumns(reordered);
    const positions = reordered.map((col, i) => ({ id: col.id, position: i }));
    await api.funnelColumns.reorder(positions);
  }, []);

  const createLead = useCallback(async (data: Parameters<typeof api.leads.create>[0]) => {
    const lead = await api.leads.create(data);
    await refreshLeads();
    return lead;
  }, [refreshLeads]);

  const updateLead = useCallback(async (id: string, data: Partial<Lead>) => {
    const lead = await api.leads.update(id, data);
    // refreshLeads also re-enriches projects with lead data,
    // so name/contact/phone changes propagate automatically.
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

  const deleteTask = useCallback(async (id: string) => {
    await api.tasks.delete(id);
    await refreshTasks();
  }, [refreshTasks]);

  const createSprint = useCallback(async (projectId: string, data: Parameters<typeof api.sprints.create>[1]) => {
    const sprint = await api.sprints.create(projectId, data);

    // Auto-create a task linked to this sprint so it appears on the Tasks board
    const project = projects.find(p => p.id === projectId);
    await api.tasks.create({
      title: data.name,
      type: 'project',
      status: 'in_progress',
      priority: data.priority ?? 'medium',
      ownerId: project?.ownerId || users[0]?.id || '',
      tags: [],
      projectId,
      sprintId: sprint.id,
      dueDate: data.dueDate,
    });

    await Promise.all([refreshProjects(), refreshTasks()]);
  }, [refreshProjects, refreshTasks, projects, users]);

  const updateSprint = useCallback(async (sprintId: string, data: Partial<Sprint>) => {
    await api.sprints.update(sprintId, data);
    await refreshProjects();
  }, [refreshProjects]);

  const completeSprint = useCallback(async (sprintId: string) => {
    await api.sprints.complete(sprintId);
    // Also mark the linked task as done
    const linkedTask = tasks.find(t => t.sprintId === sprintId);
    if (linkedTask && linkedTask.status !== 'done') {
      await api.tasks.updateStatus(linkedTask.id, 'done');
    }
    await Promise.all([refreshProjects(), refreshTasks()]);
  }, [refreshProjects, refreshTasks, tasks]);

  const deleteSprint = useCallback(async (sprintId: string) => {
    // Delete ALL linked tasks first (avoid FK constraint on sprint_id)
    const linkedTasks = tasks.filter(t => t.sprintId === sprintId);
    if (linkedTasks.length > 0) {
      await Promise.all(linkedTasks.map(t =>
        api.tasks.delete(t.id).catch(err =>
          console.warn(`[Store] Failed to delete linked task ${t.id}:`, err)
        )
      ));
    }
    await api.sprints.delete(sprintId);
    await Promise.all([refreshProjects(), refreshTasks()]);
  }, [refreshProjects, refreshTasks, tasks]);

  const getUserById = useCallback((id: string) => {
    return users.find(u => u.id === id);
  }, [users]);

  const updateProject = useCallback(async (id: string, data: Partial<Project>) => {
    const project = await api.projects.update(id, data);
    await refreshProjects();
    return project;
  }, [refreshProjects]);

  const refreshUsers = useCallback(async () => {
    const fresh = await api.users.list();
    setUsers(fresh);
    if (_cache) _cache.users = fresh;
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
      clientName: lead.name,       // Stored for DB queries; UI overrides from lead
      clientContact: lead.contact,  // Stored for DB queries; UI overrides from lead
      type: projectType,
      status: 'active',
      leadId: lead.id,
    });

    // 4. Create initial onboarding sprint + linked task
    const sprint = await api.sprints.create(project.id, {
      name: 'Onboarding — Setup inicial',
      stage: 'onboarding',
      priority: 'medium',
      startDate: new Date().toISOString(),
      status: 'active',
    });

    await api.tasks.create({
      title: 'Onboarding — Setup inicial',
      type: 'project',
      status: 'todo',
      priority: 'medium',
      ownerId: lead.ownerId || users[0]?.id || '',
      tags: [],
      projectId: project.id,
      sprintId: sprint.id,
    });

    // 5. Refresh everything
    await refreshAll();

    return project;
  }, [leads, users, refreshAll]);

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
      leads, projects, tasks, users, funnelColumns, loading,
      refreshLeads, refreshProjects, refreshTasks, refreshAll,
      createLead, updateLead, moveLeadStage, deleteLead,
      updateProject,
      createTask, updateTask, moveTaskStatus, deleteTask,
      createSprint,
      updateSprint,
      completeSprint,
      deleteSprint,
      refreshUsers, createUser, updateUser, deleteUser,
      refreshFunnelColumns, createFunnelColumn, updateFunnelColumn, deleteFunnelColumn, reorderFunnelColumns,
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

import type { Lead, Project, Sprint, Task, User, FunnelStage, FunnelColumn, TaskStatus } from '@/shared/types/models';
import { supabase } from '@/shared/lib/supabase';

// ============================================
// SUPABASE API — Lidtek CRM
// Same interface as mockApi.ts — drop-in replacement
// ============================================

// --- RLS error detection helper ---
function formatSupabaseError(operation: string, error: { message: string; code?: string; details?: string; hint?: string }): string {
  const msg = error.message?.toLowerCase() ?? '';
  const code = error.code ?? '';
  // RLS/permission errors
  if (msg.includes('row_level_security') || msg.includes('row-level security')
    || code === '42501'
    || msg.includes('new row violates row-level security')
    || msg.includes('policy')) {
    return `${operation}: Permissão negada. Verifique se seu perfil tem a role correta (admin/gestor). Detalhes: ${error.message}`;
  }
  // No rows returned after write — likely RLS blocking the SELECT after INSERT/UPDATE
  if (msg.includes('0 rows') || msg.includes('no rows') || msg.includes('json object requested, multiple (or no) rows returned')) {
    return `${operation}: Operação não retornou dados. Possível bloqueio de RLS — verifique as políticas de acesso no Supabase.`;
  }
  if (msg.includes('owner_ids') && msg.includes('does not exist')) {
    return `Erro de Banco de Dados: A coluna 'owner_ids' não existe na tabela. Por favor, rode a migração SQL informada no painel do Supabase.`;
  }
  return `${operation}: ${error.message}`;
}


// --- Row → Model mappers ---

function rowToUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    initials: row.initials,
    avatarUrl: row.avatar_url ?? undefined,
    phone: row.phone ?? undefined,
    position: row.position ?? undefined,
    status: row.status ?? 'active',
  };
}

function rowToInteraction(row: any) {
  return {
    id: row.id,
    leadId: row.lead_id,
    type: row.type,
    content: row.content,
    date: row.date,
    userId: row.user_id,
  };
}

function rowToLead(row: any, taskIds: string[] = []): Lead {
  return {
    id: row.id,
    name: row.name,
    contact: row.contact,
    phone: row.phone ?? undefined,
    origin: row.origin,
    ownerId: row.owner_id,
    notes: row.notes ?? '',
    stage: row.stage,
    nextContactDate: row.next_contact_date ?? undefined,
    estimatedValue: row.estimated_value != null ? Number(row.estimated_value) : undefined,
    billingType: row.billing_type ?? undefined,
    billingCycle: row.billing_cycle ?? undefined,
    solutionType: row.solution_type ?? undefined,
    lossReason: row.loss_reason ?? undefined,
    cnpj: row.cnpj ?? undefined,
    emails: row.emails ?? [],
    phones: row.phones ?? [],
    logoUrl: row.logo_url ?? undefined,
    website: row.website ?? undefined,
    razaoSocial: row.razao_social ?? undefined,
    endereco: row.endereco ?? undefined,
    interactions: (row.interactions ?? []).map(rowToInteraction),
    taskIds,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Normalize Postgres date strings ("2026-04-17 00:00:00+00" or ISO) to "YYYY-MM-DD"
function toDateStr(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  // Works for both Postgres format (space separator) and ISO format (T separator)
  return raw.replace('T', ' ').split(' ')[0];
}

function rowToSprint(row: any): Sprint {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    stage: row.stage,
    priority: row.priority ?? 'medium',
    startDate: toDateStr(row.start_date) ?? '',
    dueDate: toDateStr(row.due_date),
    endDate: toDateStr(row.end_date),
    status: row.status,
    taskIds: [], // Will be populated below
  };
}

function rowToProject(row: any, taskIds: string[] = []): Project {
  const sprints = (row.sprints ?? []).map(rowToSprint);
  // Support both owner_ids (array) and legacy owner_id (single)
  const ownerIds: string[] = row.owner_ids && row.owner_ids.length > 0
    ? row.owner_ids
    : row.owner_id ? [row.owner_id] : [];
  return {
    id: row.id,
    clientName: row.client_name,
    clientContact: row.client_contact,
    clientPhone: row.client_phone ?? undefined,
    type: row.type,
    status: row.status,
    ownerIds,
    currentSprintId: row.current_sprint_id ?? undefined,
    sprints,
    taskIds,
    nextDeliveryDate: row.next_delivery_date ?? undefined,
    leadId: row.lead_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToTask(row: any): Task {
  // Support both owner_ids (array) and legacy owner_id (single)
  const ownerIds: string[] = row.owner_ids && row.owner_ids.length > 0
    ? row.owner_ids
    : row.owner_id ? [row.owner_id] : [];
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    type: row.type,
    status: row.status,
    priority: row.priority,
    ownerIds,
    dueDate: toDateStr(row.due_date),
    tags: row.tags ?? [],
    projectId: row.project_id ?? undefined,
    sprintId: row.sprint_id ?? undefined,
    leadId: row.lead_id ?? undefined,
    position: row.position ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// --- Helper to build update payload ---
function buildLeadUpdate(updates: Partial<Lead>): Record<string, any> {
  const payload: Record<string, any> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.contact !== undefined) payload.contact = updates.contact;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.origin !== undefined) payload.origin = updates.origin;
  if (updates.ownerId !== undefined) payload.owner_id = updates.ownerId;
  if (updates.notes !== undefined) payload.notes = updates.notes;
  if (updates.stage !== undefined) payload.stage = updates.stage;
  if (updates.nextContactDate !== undefined) payload.next_contact_date = updates.nextContactDate;
  if (updates.estimatedValue !== undefined) payload.estimated_value = updates.estimatedValue;
  if (updates.billingType !== undefined) payload.billing_type = updates.billingType;
  if (updates.billingCycle !== undefined) payload.billing_cycle = updates.billingCycle;
  if (updates.solutionType !== undefined) payload.solution_type = updates.solutionType;
  if (updates.lossReason !== undefined) payload.loss_reason = updates.lossReason;
  if (updates.cnpj !== undefined) payload.cnpj = updates.cnpj;
  if (updates.emails !== undefined) payload.emails = updates.emails;
  if (updates.phones !== undefined) payload.phones = updates.phones;
  if (updates.logoUrl !== undefined) payload.logo_url = updates.logoUrl;
  if (updates.website !== undefined) payload.website = updates.website;
  if (updates.razaoSocial !== undefined) payload.razao_social = updates.razaoSocial;
  if (updates.endereco !== undefined) payload.endereco = updates.endereco;
  payload.updated_at = new Date().toISOString();
  return payload;
}

function buildProjectUpdate(updates: Partial<Project>): Record<string, any> {
  const payload: Record<string, any> = {};
  if (updates.clientName !== undefined) payload.client_name = updates.clientName;
  if (updates.clientContact !== undefined) payload.client_contact = updates.clientContact;
  if (updates.clientPhone !== undefined) payload.client_phone = updates.clientPhone;
  if (updates.type !== undefined) payload.type = updates.type;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.ownerIds !== undefined) {
    payload.owner_ids = updates.ownerIds;
    payload.owner_id = updates.ownerIds[0] ?? null;
  }
  if (updates.currentSprintId !== undefined) payload.current_sprint_id = updates.currentSprintId;
  if (updates.nextDeliveryDate !== undefined) payload.next_delivery_date = updates.nextDeliveryDate;
  if (updates.leadId !== undefined) payload.lead_id = updates.leadId;
  payload.updated_at = new Date().toISOString();
  return payload;
}

// Build payload without owner_ids for DBs that haven't migrated yet
function buildProjectUpdateLegacy(payload: Record<string, any>): Record<string, any> {
  const { owner_ids, ...rest } = payload;
  return rest;
}

function buildTaskUpdate(updates: Partial<Task>): Record<string, any> {
  const payload: Record<string, any> = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.type !== undefined) payload.type = updates.type;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.priority !== undefined) payload.priority = updates.priority;
  if (updates.ownerIds !== undefined) {
    payload.owner_ids = updates.ownerIds;
    payload.owner_id = updates.ownerIds[0] ?? null;
  }
  if (updates.dueDate !== undefined) payload.due_date = updates.dueDate;
  if (updates.tags !== undefined) payload.tags = updates.tags;
  if (updates.projectId !== undefined) payload.project_id = updates.projectId;
  if (updates.sprintId !== undefined) payload.sprint_id = updates.sprintId;
  if (updates.leadId !== undefined) payload.lead_id = updates.leadId;
  if (updates.position !== undefined) payload.position = updates.position;
  payload.updated_at = new Date().toISOString();
  return payload;
}

function buildUserUpdate(updates: Partial<User>): Record<string, any> {
  const payload: Record<string, any> = {};
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.email !== undefined) payload.email = updates.email;
  if (updates.role !== undefined) payload.role = updates.role;
  if (updates.initials !== undefined) payload.initials = updates.initials;
  if (updates.avatarUrl !== undefined) payload.avatar_url = updates.avatarUrl;
  if (updates.phone !== undefined) payload.phone = updates.phone;
  if (updates.position !== undefined) payload.position = updates.position;
  if (updates.status !== undefined) payload.status = updates.status;
  payload.updated_at = new Date().toISOString();
  return payload;
}

// ============================================
// API — Same interface as mockApi.ts
// ============================================

export const api = {
  // --- Users ---
  users: {
    list: async (): Promise<User[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name');
      if (error) throw new Error(formatSupabaseError('users.list', error));
      return (data ?? []).map(rowToUser);
    },

    getById: async (id: string): Promise<User | undefined> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error || !data) return undefined;
      return rowToUser(data);
    },

    getCurrent: async (): Promise<User> => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const profile = await api.users.getById(authUser.id);
        if (profile) return profile;
      }
      // Fallback: return first user (for seed data without auth)
      const users = await api.users.list();
      return users[0]!;
    },

    create: async (input: Omit<User, 'id'>): Promise<User> => {
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: crypto.randomUUID(),
          name: input.name,
          email: input.email,
          role: input.role,
          initials: input.initials,
          avatar_url: input.avatarUrl,
          phone: input.phone,
          position: input.position,
          status: input.status ?? 'active',
        })
        .select()
        .single();
      if (error) throw new Error(formatSupabaseError('users.create', error));
      return rowToUser(data);
    },

    update: async (id: string, updates: Partial<User>): Promise<User> => {
      const { data, error } = await supabase
        .from('profiles')
        .update(buildUserUpdate(updates))
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(formatSupabaseError('users.update', error));
      return rowToUser(data);
    },

    delete: async (id: string): Promise<boolean> => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);
      if (error) throw new Error(formatSupabaseError('users.delete', error));
      return true;
    },
  },

  // --- Leads ---
  leads: {
    list: async (): Promise<Lead[]> => {
      // Parallel fetch: leads + task IDs at the same time (eliminates waterfall)
      const [leadsResult, tasksResult] = await Promise.all([
        supabase
          .from('leads')
          .select('*, interactions(*)')
          .order('created_at', { ascending: false }),
        supabase
          .from('tasks')
          .select('id, lead_id')
          .not('lead_id', 'is', null),
      ]);
      if (leadsResult.error) throw new Error(formatSupabaseError('leads.list', leadsResult.error));

      const tasksByLead = new Map<string, string[]>();
      for (const t of tasksResult.data ?? []) {
        const arr = tasksByLead.get(t.lead_id) ?? [];
        arr.push(t.id);
        tasksByLead.set(t.lead_id, arr);
      }

      return (leadsResult.data ?? []).map((row) => rowToLead(row, tasksByLead.get(row.id) ?? []));
    },

    getById: async (id: string): Promise<Lead | undefined> => {
      const { data, error } = await supabase
        .from('leads')
        .select('*, interactions(*)')
        .eq('id', id)
        .maybeSingle();
      if (error || !data) return undefined;

      const { data: tasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('lead_id', id);

      return rowToLead(data, (tasks ?? []).map(t => t.id));
    },

    create: async (input: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'interactions' | 'taskIds'>): Promise<Lead> => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('leads')
        .insert({
          name: input.name,
          contact: input.contact,
          phone: input.phone,
          origin: input.origin,
          owner_id: input.ownerId,
          notes: input.notes ?? '',
          stage: input.stage,
          next_contact_date: input.nextContactDate,
          estimated_value: input.estimatedValue,
          billing_type: input.billingType,
          billing_cycle: input.billingCycle,
          solution_type: input.solutionType,
          loss_reason: input.lossReason,
          cnpj: input.cnpj,
          emails: input.emails ?? [],
          phones: input.phones ?? [],
          logo_url: input.logoUrl,
          website: input.website,
          razao_social: input.razaoSocial,
          endereco: input.endereco,
          created_at: now,
          updated_at: now,
        })
        .select('*, interactions(*)')
        .single();
      if (error) throw new Error(formatSupabaseError('leads.create', error));
      return rowToLead(data, []);
    },

    update: async (id: string, updates: Partial<Lead>): Promise<Lead> => {
      const { data, error } = await supabase
        .from('leads')
        .update(buildLeadUpdate(updates))
        .eq('id', id)
        .select('*, interactions(*)')
        .single();
      if (error) throw new Error(formatSupabaseError('leads.update', error));

      const { data: tasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('lead_id', id);

      return rowToLead(data, (tasks ?? []).map(t => t.id));
    },

    updateStage: async (id: string, stage: FunnelStage): Promise<Lead> => {
      return api.leads.update(id, { stage });
    },

    delete: async (id: string): Promise<boolean> => {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);
      if (error) throw new Error(formatSupabaseError('leads.delete', error));
      return true;
    },
  },

  // --- Projects ---
  projects: {
    list: async (): Promise<Project[]> => {
      // Parallel fetch: projects + task IDs at the same time (eliminates waterfall)
      const [projectsResult, tasksResult] = await Promise.all([
        supabase
          .from('projects')
          .select('*, sprints!sprints_project_id_fkey(*)')
          .order('created_at', { ascending: false }),
        supabase
          .from('tasks')
          .select('id, project_id, sprint_id')
          .not('project_id', 'is', null),
      ]);
      if (projectsResult.error) throw new Error(formatSupabaseError('projects.list', projectsResult.error));

      const tasksByProject = new Map<string, string[]>();
      const tasksBySprint = new Map<string, string[]>();
      for (const t of tasksResult.data ?? []) {
        // Per project
        const projArr = tasksByProject.get(t.project_id) ?? [];
        projArr.push(t.id);
        tasksByProject.set(t.project_id, projArr);
        // Per sprint
        if (t.sprint_id) {
          const sprArr = tasksBySprint.get(t.sprint_id) ?? [];
          sprArr.push(t.id);
          tasksBySprint.set(t.sprint_id, sprArr);
        }
      }

      return (projectsResult.data ?? []).map((row) => {
        const project = rowToProject(row, tasksByProject.get(row.id) ?? []);
        // Populate sprint taskIds
        project.sprints = project.sprints.map(s => ({
          ...s,
          taskIds: tasksBySprint.get(s.id) ?? [],
        }));
        return project;
      });
    },

    getById: async (id: string): Promise<Project | undefined> => {
      const { data, error } = await supabase
        .from('projects')
        .select('*, sprints!sprints_project_id_fkey(*)')
        .eq('id', id)
        .maybeSingle();
      if (error || !data) return undefined;

      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, sprint_id')
        .eq('project_id', id);

      const taskIds = (tasks ?? []).map(t => t.id);
      const tasksBySprint = new Map<string, string[]>();
      for (const t of tasks ?? []) {
        if (t.sprint_id) {
          const arr = tasksBySprint.get(t.sprint_id) ?? [];
          arr.push(t.id);
          tasksBySprint.set(t.sprint_id, arr);
        }
      }

      const project = rowToProject(data, taskIds);
      project.sprints = project.sprints.map(s => ({
        ...s,
        taskIds: tasksBySprint.get(s.id) ?? [],
      }));
      return project;
    },

    create: async (input: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'sprints' | 'taskIds'>): Promise<Project> => {
      const now = new Date().toISOString();
      const basePayload = {
        client_name: input.clientName,
        client_contact: input.clientContact,
        client_phone: input.clientPhone,
        type: input.type,
        status: input.status,
        owner_id: input.ownerIds?.[0] ?? null,
        current_sprint_id: input.currentSprintId,
        next_delivery_date: input.nextDeliveryDate,
        lead_id: input.leadId,
        created_at: now,
        updated_at: now,
      };

      // Try with owner_ids first, fall back to legacy if column doesn't exist
      let result = await supabase
        .from('projects')
        .insert({ ...basePayload, owner_ids: input.ownerIds ?? [] })
        .select('*, sprints!sprints_project_id_fkey(*)')
        .single();

      if (result.error?.message?.includes('owner_ids')) {
        console.warn('[API] owner_ids column not found, using legacy mode');
        result = await supabase
          .from('projects')
          .insert(basePayload)
          .select('*, sprints!sprints_project_id_fkey(*)')
          .single();
      }

      if (result.error) throw new Error(formatSupabaseError('projects.create', result.error));
      return rowToProject(result.data, []);
    },

    update: async (id: string, updates: Partial<Project>): Promise<Project> => {
      const payload = buildProjectUpdate(updates);
      let result = await supabase
        .from('projects')
        .update(payload)
        .eq('id', id)
        .select('*, sprints!sprints_project_id_fkey(*)')
        .single();

      // Retry without owner_ids if column doesn't exist
      if (result.error?.message?.includes('owner_ids')) {
        console.warn('[API] owner_ids column not found on update, using legacy mode');
        result = await supabase
          .from('projects')
          .update(buildProjectUpdateLegacy(payload))
          .eq('id', id)
          .select('*, sprints!sprints_project_id_fkey(*)')
          .single();
      }

      if (result.error) throw new Error(formatSupabaseError('projects.update', result.error));

      const { data: tasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('project_id', id);

      return rowToProject(result.data, (tasks ?? []).map(t => t.id));
    },

    delete: async (id: string): Promise<boolean> => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);
      if (error) throw new Error(formatSupabaseError('projects.delete', error));
      return true;
    },
  },

  // --- Sprints ---
  sprints: {
    create: async (projectId: string, input: Omit<Sprint, 'id' | 'projectId' | 'taskIds'>): Promise<Sprint> => {
      const { data, error } = await supabase
        .from('sprints')
        .insert({
          project_id: projectId,
          name: input.name,
          stage: input.stage,
          priority: input.priority ?? 'medium',
          start_date: input.startDate,
          due_date: input.dueDate,
          end_date: input.endDate,
          status: input.status,
        })
        .select()
        .single();
      if (error) throw new Error(formatSupabaseError('sprints.create', error));

      // Update project's current_sprint_id
      await supabase
        .from('projects')
        .update({ current_sprint_id: data.id, updated_at: new Date().toISOString() })
        .eq('id', projectId);

      return rowToSprint(data);
    },

    update: async (sprintId: string, updates: Partial<Sprint>): Promise<Sprint> => {
      const payload: Record<string, any> = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.stage !== undefined) payload.stage = updates.stage;
      if (updates.priority !== undefined) payload.priority = updates.priority;
      if (updates.startDate !== undefined) payload.start_date = updates.startDate;
      if (updates.dueDate !== undefined) payload.due_date = updates.dueDate;
      if (updates.endDate !== undefined) payload.end_date = updates.endDate;
      if (updates.status !== undefined) payload.status = updates.status;

      const { data, error } = await supabase
        .from('sprints')
        .update(payload)
        .eq('id', sprintId)
        .select()
        .single();
      if (error) throw new Error(formatSupabaseError('sprints.update', error));

      // Update parent project's updated_at
      await supabase
        .from('projects')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', data.project_id);

      return rowToSprint(data);
    },

    complete: async (sprintId: string): Promise<Sprint> => {
      return api.sprints.update(sprintId, { status: 'completed', endDate: new Date().toISOString() });
    },

    delete: async (sprintId: string): Promise<undefined> => {
      // Get the sprint's project_id before deleting
      const { data: sprint } = await supabase
        .from('sprints')
        .select('project_id')
        .eq('id', sprintId)
        .single();

      // Nullify sprint_id on any tasks referencing this sprint (avoids FK constraint)
      await supabase
        .from('tasks')
        .update({ sprint_id: null, updated_at: new Date().toISOString() })
        .eq('sprint_id', sprintId);

      const { error } = await supabase
        .from('sprints')
        .delete()
        .eq('id', sprintId);
      if (error) throw new Error(formatSupabaseError('sprints.delete', error));

      // Recalculate current_sprint_id for the parent project
      if (sprint) {
        const { data: remaining } = await supabase
          .from('sprints')
          .select('id')
          .eq('project_id', sprint.project_id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1);

        await supabase
          .from('projects')
          .update({
            current_sprint_id: remaining?.[0]?.id ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sprint.project_id);
      }

      return undefined;
    },
  },

  // --- Tasks ---
  tasks: {
    list: async (): Promise<Task[]> => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        // Order by explicit position first (drag-and-drop persisted order),
        // then fall back to created_at for tasks without a position set.
        .order('position', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });
      if (error) throw new Error(formatSupabaseError('tasks.list', error));
      return (data ?? []).map(rowToTask);
    },

    getById: async (id: string): Promise<Task | undefined> => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error || !data) return undefined;
      return rowToTask(data);
    },

    create: async (input: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: input.title,
          description: input.description,
          type: input.type,
          status: input.status,
          priority: input.priority,
          owner_ids: input.ownerIds,
          owner_id: input.ownerIds[0] ?? null,
          due_date: input.dueDate,
          tags: input.tags ?? [],
          project_id: input.projectId,
          sprint_id: input.sprintId,
          lead_id: input.leadId,
          position: input.position ?? 0,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();
      if (error) throw new Error(formatSupabaseError('tasks.create', error));
      return rowToTask(data);
    },

    update: async (id: string, updates: Partial<Task>): Promise<Task> => {
      const { data, error } = await supabase
        .from('tasks')
        .update(buildTaskUpdate(updates))
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(formatSupabaseError('tasks.update', error));
      return rowToTask(data);
    },

    updateStatus: async (id: string, status: TaskStatus): Promise<Task> => {
      return api.tasks.update(id, { status });
    },

    // Persist drag-and-drop order in bulk — fires after every reorder action.
    // Each item in the array carries its new position index.
    reorder: async (positions: { id: string; position: number }[]): Promise<void> => {
      await Promise.all(
        positions.map(({ id, position }) =>
          supabase
            .from('tasks')
            .update({ position, updated_at: new Date().toISOString() })
            .eq('id', id)
        )
      );
    },

    delete: async (id: string): Promise<boolean> => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      if (error) throw new Error(formatSupabaseError('tasks.delete', error));
      return true;
    },
  },

  // --- Funnel Columns ---
  funnelColumns: {
    list: async (): Promise<FunnelColumn[]> => {
      const { data, error } = await supabase
        .from('funnel_columns')
        .select('*')
        .order('position');
      if (error) throw new Error(formatSupabaseError('funnelColumns.list', error));
      return (data ?? []).map((row: any) => ({
        id: row.id,
        label: row.label,
        color: row.color,
        position: row.position,
        isDefault: row.is_default ?? false,
        behavior: row.behavior ?? 'active',
      }));
    },

    create: async (input: { label: string; color: string; behavior?: string }): Promise<FunnelColumn> => {
      // Get max position to append at end
      const { data: maxRow } = await supabase
        .from('funnel_columns')
        .select('position')
        .order('position', { ascending: false })
        .limit(1)
        .single();
      const nextPosition = (maxRow?.position ?? -1) + 1;

      const { data, error } = await supabase
        .from('funnel_columns')
        .insert({
          label: input.label,
          color: input.color,
          position: nextPosition,
          is_default: false,
          behavior: input.behavior ?? 'active',
        })
        .select()
        .single();
      if (error) throw new Error(formatSupabaseError('funnelColumns.create', error));
      return {
        id: data.id,
        label: data.label,
        color: data.color,
        position: data.position,
        isDefault: false,
        behavior: data.behavior ?? 'active',
      };
    },

    update: async (id: string, updates: Partial<Pick<FunnelColumn, 'label' | 'color' | 'behavior'>>): Promise<FunnelColumn> => {
      const payload: Record<string, any> = {};
      if (updates.label !== undefined) payload.label = updates.label;
      if (updates.color !== undefined) payload.color = updates.color;
      if (updates.behavior !== undefined) payload.behavior = updates.behavior;

      const { data, error } = await supabase
        .from('funnel_columns')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(formatSupabaseError('funnelColumns.update', error));
      return {
        id: data.id,
        label: data.label,
        color: data.color,
        position: data.position,
        isDefault: data.is_default ?? false,
        behavior: data.behavior ?? 'active',
      };
    },

    delete: async (id: string, fallbackColumnId: string): Promise<void> => {
      // Move all leads in this column to the fallback column
      await supabase
        .from('leads')
        .update({ stage: fallbackColumnId, updated_at: new Date().toISOString() })
        .eq('stage', id);

      const { error } = await supabase
        .from('funnel_columns')
        .delete()
        .eq('id', id);
      if (error) throw new Error(formatSupabaseError('funnelColumns.delete', error));
    },

    reorder: async (columns: { id: string; position: number }[]): Promise<void> => {
      // Batch update positions
      const promises = columns.map((col) =>
        supabase
          .from('funnel_columns')
          .update({ position: col.position })
          .eq('id', col.id)
      );
      await Promise.all(promises);
    },
  },

  // --- Utility ---
  reset: async (): Promise<boolean> => {
    // No-op for Supabase — data persists in the database
    console.warn('api.reset() is a no-op with Supabase backend');
    return true;
  },
};

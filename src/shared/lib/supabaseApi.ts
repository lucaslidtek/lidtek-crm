import type { Lead, Project, Sprint, Task, User, FunnelStage, FunnelColumn, TaskStatus } from '@/shared/types/models';
import { supabase } from '@/shared/lib/supabase';

// ============================================
// SUPABASE API — Lidtek CRM
// Same interface as mockApi.ts — drop-in replacement
// ============================================


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

function rowToSprint(row: any): Sprint {
  return {
    id: row.id,
    projectId: row.project_id,
    name: row.name,
    stage: row.stage,
    startDate: row.start_date,
    endDate: row.end_date ?? undefined,
    status: row.status,
    taskIds: [], // Will be populated below
  };
}

function rowToProject(row: any, taskIds: string[] = []): Project {
  const sprints = (row.sprints ?? []).map(rowToSprint);
  return {
    id: row.id,
    clientName: row.client_name,
    clientContact: row.client_contact,
    clientPhone: row.client_phone ?? undefined,
    type: row.type,
    status: row.status,
    ownerId: row.owner_id,
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
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    type: row.type,
    status: row.status,
    priority: row.priority,
    ownerId: row.owner_id,
    dueDate: row.due_date ?? undefined,
    tags: row.tags ?? [],
    projectId: row.project_id ?? undefined,
    sprintId: row.sprint_id ?? undefined,
    leadId: row.lead_id ?? undefined,
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
  if (updates.ownerId !== undefined) payload.owner_id = updates.ownerId;
  if (updates.currentSprintId !== undefined) payload.current_sprint_id = updates.currentSprintId;
  if (updates.nextDeliveryDate !== undefined) payload.next_delivery_date = updates.nextDeliveryDate;
  if (updates.leadId !== undefined) payload.lead_id = updates.leadId;
  payload.updated_at = new Date().toISOString();
  return payload;
}

function buildTaskUpdate(updates: Partial<Task>): Record<string, any> {
  const payload: Record<string, any> = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.type !== undefined) payload.type = updates.type;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.priority !== undefined) payload.priority = updates.priority;
  if (updates.ownerId !== undefined) payload.owner_id = updates.ownerId;
  if (updates.dueDate !== undefined) payload.due_date = updates.dueDate;
  if (updates.tags !== undefined) payload.tags = updates.tags;
  if (updates.projectId !== undefined) payload.project_id = updates.projectId;
  if (updates.sprintId !== undefined) payload.sprint_id = updates.sprintId;
  if (updates.leadId !== undefined) payload.lead_id = updates.leadId;
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
      if (error) throw new Error(`users.list: ${error.message}`);
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
      if (error) throw new Error(`users.create: ${error.message}`);
      return rowToUser(data);
    },

    update: async (id: string, updates: Partial<User>): Promise<User> => {
      const { data, error } = await supabase
        .from('profiles')
        .update(buildUserUpdate(updates))
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(`users.update: ${error.message}`);
      return rowToUser(data);
    },

    delete: async (id: string): Promise<boolean> => {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);
      if (error) throw new Error(`users.delete: ${error.message}`);
      return true;
    },
  },

  // --- Leads ---
  leads: {
    list: async (): Promise<Lead[]> => {
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*, interactions(*)')
        .order('created_at', { ascending: false });
      if (error) throw new Error(`leads.list: ${error.message}`);

      // Fetch task IDs per lead
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, lead_id')
        .not('lead_id', 'is', null);

      const tasksByLead = new Map<string, string[]>();
      for (const t of tasks ?? []) {
        const arr = tasksByLead.get(t.lead_id) ?? [];
        arr.push(t.id);
        tasksByLead.set(t.lead_id, arr);
      }

      return (leads ?? []).map((row) => rowToLead(row, tasksByLead.get(row.id) ?? []));
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
      if (error) throw new Error(`leads.create: ${error.message}`);
      return rowToLead(data, []);
    },

    update: async (id: string, updates: Partial<Lead>): Promise<Lead> => {
      const { data, error } = await supabase
        .from('leads')
        .update(buildLeadUpdate(updates))
        .eq('id', id)
        .select('*, interactions(*)')
        .single();
      if (error) throw new Error(`leads.update: ${error.message}`);

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
      if (error) throw new Error(`leads.delete: ${error.message}`);
      return true;
    },
  },

  // --- Projects ---
  projects: {
    list: async (): Promise<Project[]> => {
      const { data: projects, error } = await supabase
        .from('projects')
        .select('*, sprints!sprints_project_id_fkey(*)')
        .order('created_at', { ascending: false });
      if (error) throw new Error(`projects.list: ${error.message}`);

      // Fetch task IDs per project
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, project_id, sprint_id')
        .not('project_id', 'is', null);

      const tasksByProject = new Map<string, string[]>();
      const tasksBySprint = new Map<string, string[]>();
      for (const t of tasks ?? []) {
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

      return (projects ?? []).map((row) => {
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
      const { data, error } = await supabase
        .from('projects')
        .insert({
          client_name: input.clientName,
          client_contact: input.clientContact,
          client_phone: input.clientPhone,
          type: input.type,
          status: input.status,
          owner_id: input.ownerId,
          current_sprint_id: input.currentSprintId,
          next_delivery_date: input.nextDeliveryDate,
          lead_id: input.leadId,
          created_at: now,
          updated_at: now,
        })
        .select('*, sprints!sprints_project_id_fkey(*)')
        .single();
      if (error) throw new Error(`projects.create: ${error.message}`);
      return rowToProject(data, []);
    },

    update: async (id: string, updates: Partial<Project>): Promise<Project> => {
      const { data, error } = await supabase
        .from('projects')
        .update(buildProjectUpdate(updates))
        .eq('id', id)
        .select('*, sprints!sprints_project_id_fkey(*)')
        .single();
      if (error) throw new Error(`projects.update: ${error.message}`);

      const { data: tasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('project_id', id);

      return rowToProject(data, (tasks ?? []).map(t => t.id));
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
          start_date: input.startDate,
          end_date: input.endDate,
          status: input.status,
        })
        .select()
        .single();
      if (error) throw new Error(`sprints.create: ${error.message}`);

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
      if (updates.startDate !== undefined) payload.start_date = updates.startDate;
      if (updates.endDate !== undefined) payload.end_date = updates.endDate;
      if (updates.status !== undefined) payload.status = updates.status;

      const { data, error } = await supabase
        .from('sprints')
        .update(payload)
        .eq('id', sprintId)
        .select()
        .single();
      if (error) throw new Error(`sprints.update: ${error.message}`);

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

      const { error } = await supabase
        .from('sprints')
        .delete()
        .eq('id', sprintId);
      if (error) throw new Error(`sprints.delete: ${error.message}`);

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
        .order('created_at', { ascending: false });
      if (error) throw new Error(`tasks.list: ${error.message}`);
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
          owner_id: input.ownerId,
          due_date: input.dueDate,
          tags: input.tags ?? [],
          project_id: input.projectId,
          sprint_id: input.sprintId,
          lead_id: input.leadId,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();
      if (error) throw new Error(`tasks.create: ${error.message}`);
      return rowToTask(data);
    },

    update: async (id: string, updates: Partial<Task>): Promise<Task> => {
      const { data, error } = await supabase
        .from('tasks')
        .update(buildTaskUpdate(updates))
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(`tasks.update: ${error.message}`);
      return rowToTask(data);
    },

    updateStatus: async (id: string, status: TaskStatus): Promise<Task> => {
      return api.tasks.update(id, { status });
    },

    delete: async (id: string): Promise<boolean> => {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      if (error) throw new Error(`tasks.delete: ${error.message}`);
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
      if (error) throw new Error(`funnelColumns.list: ${error.message}`);
      return (data ?? []).map((row: any) => ({
        id: row.id,
        label: row.label,
        color: row.color,
        position: row.position,
        isDefault: row.is_default ?? false,
      }));
    },

    create: async (input: { label: string; color: string }): Promise<FunnelColumn> => {
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
        })
        .select()
        .single();
      if (error) throw new Error(`funnelColumns.create: ${error.message}`);
      return {
        id: data.id,
        label: data.label,
        color: data.color,
        position: data.position,
        isDefault: false,
      };
    },

    update: async (id: string, updates: Partial<Pick<FunnelColumn, 'label' | 'color'>>): Promise<FunnelColumn> => {
      const payload: Record<string, any> = {};
      if (updates.label !== undefined) payload.label = updates.label;
      if (updates.color !== undefined) payload.color = updates.color;

      const { data, error } = await supabase
        .from('funnel_columns')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(`funnelColumns.update: ${error.message}`);
      return {
        id: data.id,
        label: data.label,
        color: data.color,
        position: data.position,
        isDefault: data.is_default ?? false,
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
      if (error) throw new Error(`funnelColumns.delete: ${error.message}`);
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

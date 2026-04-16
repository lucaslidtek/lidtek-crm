import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { KanbanBoard } from '@/shared/components/kanban/KanbanBoard';
import { TaskCard } from '@/modules/tasks/components/TaskCard';
import { TaskFilters } from '@/modules/tasks/components/TaskFilters';
import { TaskCreateDialog } from '@/modules/tasks/components/TaskCreateDialog';
import { TaskEditDialog } from '@/modules/tasks/components/TaskEditDialog';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { useTasks } from '@/modules/tasks/hooks/useTasks';
import { useStore } from '@/shared/lib/store';
import { useIsMobile } from '@/shared/hooks/useIsMobile';
import { useAuth } from '@/app/providers/AuthProvider';
import { Button } from '@/shared/components/ui/Button';
import { FloatingActionButton } from '@/shared/components/ui/FloatingActionButton';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { cn } from '@/shared/utils/cn';
import { TASK_STATUSES } from '@/shared/lib/constants';
import type { Task, TaskType, TaskPriority } from '@/shared/types/models';

export function TasksKanban() {
  const [typeFilter, setTypeFilter] = useState<TaskType | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const { tasks, reorderTasks, deleteTask } = useStore();
  const isMobile = useIsMobile();

  const [ownerFilter, setOwnerFilter] = useState<string | 'all'>('all');

  const { tasksByStatus, moveTask } = useTasks({ type: typeFilter, priority: priorityFilter, ownerId: ownerFilter });

  // Mobile: selected status tab
  const [mobileStatus, setMobileStatus] = useState<string>('all');

  const filteredTasksByStatus = useMemo(() => {
    if (!search) return tasksByStatus;
    const q = search.toLowerCase();
    return Object.fromEntries(
      Object.entries(tasksByStatus).map(([status, statusTasks]) => [
        status,
        statusTasks.filter(t =>
          t.title.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
        ),
      ])
    );
  }, [tasksByStatus, search]);

  const allFilteredTasks = useMemo(() => {
    return Object.values(filteredTasksByStatus).flat();
  }, [filteredTasksByStatus]);

  const filteredCount = useMemo(() => {
    if (!search) return tasks.length;
    const q = search.toLowerCase();
    return tasks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q)
    ).length;
  }, [tasks, search]);

  const pendingTasks = useMemo(() => {
    return allFilteredTasks.filter(t => t.status !== 'done');
  }, [allFilteredTasks]);

  // Mobile: filtered tasks by selected status
  const mobileFilteredTasks = useMemo(() => {
    if (mobileStatus === 'all') return pendingTasks;
    return filteredTasksByStatus[mobileStatus] ?? [];
  }, [mobileStatus, pendingTasks, filteredTasksByStatus]);

  const n = filteredCount;

  const handleConfirmDelete = async () => {
    if (!deletingTask) return;
    try {
      await deleteTask(deletingTask.id);
      setDeletingTask(null);
    } catch (err) {
      console.error('[TasksKanban] deleteTask failed:', err);
    } finally {
      // Done
    }
  };

  return (
    <div className="animate-fade-in flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      <div className="flex-shrink-0">
        <PageHeader
          searchQuery={search}
          onSearchChange={setSearch}
          searchPlaceholder={search ? `${n} tarefa${n !== 1 ? 's' : ''} encontrada${n !== 1 ? 's' : ''}` : `Buscar entre ${tasks.length} tarefas...`}
          actions={
            <>
              {!isMobile && (
                <TaskFilters
                  type={typeFilter}
                  priority={priorityFilter}
                  ownerId={ownerFilter}
                  onTypeChange={setTypeFilter}
                  onPriorityChange={setPriorityFilter}
                  onOwnerChange={setOwnerFilter}
                />
              )}
              {!isMobile && (
                <Button onClick={() => setCreateOpen(true)} size="sm">
                  <Plus className="w-4 h-4" />
                  Nova Tarefa
                </Button>
              )}
            </>
          }
        />
      </div>

      {/* Mobile: Status tabs */}
      {isMobile && (
        <div className="flex-shrink-0 -mx-1 mb-3 overflow-x-auto hide-scrollbar">
          <div className="flex items-center gap-1.5 px-1 min-w-max">
            <button
              onClick={() => setMobileStatus('all')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all press-scale whitespace-nowrap',
                mobileStatus === 'all'
                  ? 'bg-primary/15 text-primary'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-foreground-muted',
              )}
            >
              Pendentes
              <span className="text-[10px] opacity-70">{pendingTasks.length}</span>
            </button>
            {TASK_STATUSES.map((status) => {
              const count = filteredTasksByStatus[status.id]?.length ?? 0;
              return (
                <button
                  key={status.id}
                  onClick={() => setMobileStatus(status.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all press-scale whitespace-nowrap',
                    mobileStatus === status.id
                      ? 'bg-primary/15 text-primary'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-foreground-muted',
                  )}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: status.color }}
                  />
                  {status.label}
                  <span className="text-[10px] opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Content */}
      <div className={cn(
        'flex-1 min-h-0 overflow-hidden',
        !isMobile && 'rounded-xl bg-zinc-50/50 dark:bg-zinc-800/20 border border-zinc-200/60 dark:border-zinc-700/40',
      )}>
        {isMobile ? (
          /* ── Mobile: card list filtered by status ── */
          <div className="h-full overflow-y-auto space-y-2">
            {mobileFilteredTasks.length > 0 ? (
              mobileFilteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="glass rounded-lg p-3 press-scale transition-all"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <TaskCard
                    task={task}
                    onEdit={setEditingTask}
                    onDelete={setDeletingTask}
                    showStatusChip
                  />
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-32 text-foreground-muted text-sm">
                Nenhuma tarefa encontrada
              </div>
            )}
          </div>
        ) : (
          <KanbanBoard<Task>
            columns={TASK_STATUSES}
            items={filteredTasksByStatus}
            onMoveItem={moveTask}
            renderCard={(task) => (
              <TaskCard
                task={task}
                onEdit={setEditingTask}
                onDelete={setDeletingTask}
              />
            )}
            onChangeOrder={(items) => reorderTasks(Object.values(items).flat())}
          />
        )}
      </div>

      {/* Create Dialog */}
      <TaskCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      {/* Edit Dialog */}
      <TaskEditDialog
        task={editingTask}
        open={!!editingTask}
        onOpenChange={(open) => { if (!open) setEditingTask(null); }}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deletingTask}
        onOpenChange={(open) => { if (!open) setDeletingTask(null); }}
        onConfirm={handleConfirmDelete}
        title="Excluir tarefa"
        description={`Tem certeza que deseja excluir "${deletingTask?.title}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="danger"
      />

      {/* Mobile FAB */}
      {isMobile && (
        <FloatingActionButton
          onClick={() => setCreateOpen(true)}
          icon={<Plus className="w-5 h-5" />}
          label="Nova Tarefa"
        />
      )}
    </div>
  );
}


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
import { Button } from '@/shared/components/ui/Button';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { TASK_STATUSES } from '@/shared/lib/constants';
import type { Task, TaskType, TaskPriority } from '@/shared/types/models';

export function TasksKanban() {
  const [typeFilter, setTypeFilter] = useState<TaskType | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { tasks, reorderTasks, deleteTask } = useStore();

  const { tasksByStatus, moveTask } = useTasks({ type: typeFilter, priority: priorityFilter });

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

  const filteredCount = useMemo(() => {
    if (!search) return tasks.length;
    const q = search.toLowerCase();
    return tasks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q)
    ).length;
  }, [tasks, search]);

  const n = filteredCount;

  const handleConfirmDelete = async () => {
    if (!deletingTask) return;
    setDeleteLoading(true);
    try {
      await deleteTask(deletingTask.id);
      setDeletingTask(null);
    } catch (err) {
      console.error('[TasksKanban] deleteTask failed:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder={search ? `${n} tarefa${n !== 1 ? 's' : ''} encontrada${n !== 1 ? 's' : ''}` : `Buscar entre ${tasks.length} tarefas...`}
        actions={
          <>
            <TaskFilters
              type={typeFilter}
              priority={priorityFilter}
              onTypeChange={setTypeFilter}
              onPriorityChange={setPriorityFilter}
            />
            <Button onClick={() => setCreateOpen(true)} size="sm">
              <Plus className="w-4 h-4" />
              Nova Tarefa
            </Button>
          </>
        }
      />

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
        loading={deleteLoading}
      />
    </div>
  );
}

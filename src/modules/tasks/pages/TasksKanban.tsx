import { useState } from 'react';
import { Plus } from 'lucide-react';
import { KanbanBoard } from '@/shared/components/kanban/KanbanBoard';
import { TaskCard } from '@/modules/tasks/components/TaskCard';
import { TaskFilters } from '@/modules/tasks/components/TaskFilters';
import { TaskCreateDialog } from '@/modules/tasks/components/TaskCreateDialog';
import { useTasks } from '@/modules/tasks/hooks/useTasks';
import { useStore } from '@/shared/lib/store';
import { Button } from '@/shared/components/ui/Button';
import { TASK_STATUSES } from '@/shared/lib/constants';
import type { Task, TaskType, TaskPriority } from '@/shared/types/models';

export function TasksKanban() {
  const [typeFilter, setTypeFilter] = useState<TaskType | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const { tasks } = useStore();

  const { tasksByStatus, moveTask } = useTasks({
    type: typeFilter,
    priority: priorityFilter,
  });

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-foreground">
            Tarefas
            <span className="text-foreground-muted/40 font-semibold text-lg ml-2">({tasks.length})</span>
          </h1>
          <p className="text-sm text-foreground-muted mt-0.5">Gestão de atividades</p>
        </div>
        <div className="flex items-center gap-4">
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
        </div>
      </div>

      {/* Kanban */}
      <KanbanBoard<Task>
        columns={TASK_STATUSES}
        items={tasksByStatus}
        onMoveItem={moveTask}
        renderCard={(task) => <TaskCard task={task} />}
      />

      {/* Create Dialog */}
      <TaskCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}

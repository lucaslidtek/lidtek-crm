import { useMemo, useCallback } from 'react';
import { useStore } from '@/shared/lib/store';
import type { Task, TaskStatus, TaskType, TaskPriority } from '@/shared/types/models';
import { TASK_STATUSES } from '@/shared/lib/constants';

interface TaskFiltersState {
  type: TaskType | 'all';
  priority: TaskPriority | 'all';
  ownerId?: string | 'all';
}

export function useTasks(filters?: TaskFiltersState) {
  const { tasks, createTask, updateTask, moveTaskStatus, getUserById } = useStore();

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (filters?.type && filters.type !== 'all') {
      result = result.filter(t => t.type === filters.type);
    }
    if (filters?.priority && filters.priority !== 'all') {
      result = result.filter(t => t.priority === filters.priority);
    }
    if (filters?.ownerId && filters.ownerId !== 'all') {
      result = result.filter(t => t.ownerIds?.includes(filters.ownerId as string));
    }
    return result;
  }, [tasks, filters?.type, filters?.priority, filters?.ownerId]);

  const tasksByStatus = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    for (const status of TASK_STATUSES) {
      grouped[status.id] = [];
    }
    for (const task of filteredTasks) {
      if (grouped[task.status]) {
        grouped[task.status]!.push(task);
      }
    }
    return grouped;
  }, [filteredTasks]);

  const moveTask = useCallback(
    (taskId: string, _fromStatus: string, toStatus: string) => {
      moveTaskStatus(taskId, toStatus as TaskStatus);
    },
    [moveTaskStatus],
  );

  return {
    tasks: filteredTasks,
    tasksByStatus,
    moveTask,
    createTask,
    updateTask,
    getUserById,
  };
}

import { useMemo } from 'react';
import { useStore } from '@/shared/lib/store';
import type { Project, ProjectType } from '@/shared/types/models';
import { PROJECT_STAGES } from '@/shared/lib/constants';

export function useProjects(filterType?: ProjectType | 'all') {
  const { projects, createSprint, getUserById } = useStore();

  const filteredProjects = useMemo(() => {
    let filtered = projects.filter(p => p.status === 'active');
    if (filterType && filterType !== 'all') {
      filtered = filtered.filter(p => p.type === filterType);
    }
    return filtered;
  }, [projects, filterType]);

  const projectsByStage = useMemo(() => {
    const grouped: Record<string, Project[]> = {};
    for (const stage of PROJECT_STAGES) {
      grouped[stage.id] = [];
    }
    for (const project of filteredProjects) {
      // Find current sprint stage
      const currentSprint = project.sprints.find(s => s.id === project.currentSprintId);
      const stageId = currentSprint?.stage ?? 'onboarding';
      if (grouped[stageId]) {
        grouped[stageId]!.push(project);
      }
    }
    return grouped;
  }, [filteredProjects]);

  return {
    projects: filteredProjects,
    projectsByStage,
    createSprint,
    getUserById,
  };
}

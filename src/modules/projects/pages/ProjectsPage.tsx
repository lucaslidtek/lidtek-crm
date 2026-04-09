import { useState } from 'react';
import { useStore } from '@/shared/lib/store';
import { KanbanBoard } from '@/shared/components/kanban/KanbanBoard';
import { ProjectCard } from '@/modules/projects/components/ProjectCard';
import { ProjectDetailDrawer } from '@/modules/projects/components/ProjectDetailDrawer';
import { useProjects } from '@/modules/projects/hooks/useProjects';
import { cn } from '@/shared/utils/cn';
import { ViewToggle, type ViewType } from '@/shared/components/ui/ViewToggle';
import { ProjectListView } from '@/modules/projects/components/ProjectListView';
import { ProjectCalendarView } from '@/modules/projects/components/ProjectCalendarView';
import { PROJECT_STAGES } from '@/shared/lib/constants';
import type { Project, ProjectType } from '@/shared/types/models';

type FilterType = 'all' | ProjectType;

const FILTER_OPTIONS: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'recurring', label: 'Recorrentes' },
  { id: 'oneshot', label: 'Únicos' },
];

export function ProjectsPage() {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const { projects, projectsByStage } = useProjects(filterType);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [view, setView] = useState<ViewType>('list');
  const { projects: allProjects } = useStore();

  // Always derive the selected project from the live store data
  const selectedProject = selectedProjectId ? allProjects.find(p => p.id === selectedProjectId) ?? null : null;

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-foreground">
            Projetos
            <span className="text-foreground-muted/40 font-semibold text-lg ml-2">({projects.length})</span>
          </h1>
          <p className="text-sm text-foreground-muted mt-0.5">Funil de desenvolvimento</p>
        </div>

        {/* Search / Filters / View */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 glass-subtle rounded-lg">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => setFilterType(option.id)}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-xs font-medium transition-all duration-300',
                  filterType === option.id
                    ? 'bg-primary/15 text-primary'
                    : 'text-foreground-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <ViewToggle view={view} onChange={setView} />
        </div>
      </div>

      {/* Content based on view */}
      {view === 'list' ? (
        <ProjectListView 
          projects={projects}
          onProjectClick={(project) => setSelectedProjectId(project.id)}
        />
      ) : view === 'calendar' ? (
        <ProjectCalendarView
          projects={projects}
          onProjectClick={(project) => setSelectedProjectId(project.id)}
        />
      ) : (
        <KanbanBoard<Project>
          columns={PROJECT_STAGES}
          items={projectsByStage}
          onMoveItem={() => {}} // Projects don't move by drag — they move by sprint updates
          renderCard={(project) => <ProjectCard project={project} />}
          onCardClick={(project) => setSelectedProjectId(project.id)}
        />
      )}

      {/* Detail Drawer */}
      <ProjectDetailDrawer
        project={selectedProject}
        onClose={() => setSelectedProjectId(null)}
      />
    </div>
  );
}

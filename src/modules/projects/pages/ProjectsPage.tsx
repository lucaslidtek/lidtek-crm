import { useState, useMemo } from 'react';
import { useStore } from '@/shared/lib/store';
import { KanbanBoard } from '@/shared/components/kanban/KanbanBoard';
import { ProjectCard } from '@/modules/projects/components/ProjectCard';
import { ProjectDetailDrawer } from '@/modules/projects/components/ProjectDetailDrawer';
import { useProjects } from '@/modules/projects/hooks/useProjects';
import { cn } from '@/shared/utils/cn';
import { ViewToggle, type ViewType } from '@/shared/components/ui/ViewToggle';
import { ProjectListView } from '@/modules/projects/components/ProjectListView';
import { ProjectCalendarView } from '@/modules/projects/components/ProjectCalendarView';
import { PageHeader } from '@/shared/components/ui/PageHeader';
import { useIsMobile } from '@/shared/hooks/useIsMobile';
import { useLocalStorage } from '@/shared/hooks/useLocalStorage';
import { PROJECT_STAGES } from '@/shared/lib/constants';
import type { Project, ProjectType, ProjectStatus } from '@/shared/types/models';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/DropdownMenu';
import { ChevronDown, Check } from 'lucide-react';

type FilterType = 'all' | ProjectType;
type StatusFilter = 'all' | ProjectStatus;

const FILTER_OPTIONS: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'recurring', label: 'Recorrentes' },
  { id: 'oneshot', label: 'Únicos' },
];

const STATUS_OPTIONS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'active', label: 'Ativos' },
  { id: 'paused', label: 'Pausados' },
  { id: 'completed', label: 'Concluídos' },
  { id: 'archived', label: 'Arquivados' },
];

function getProjectSortScore(project: Project): { rank: number; dueTimestamp: number } {
  const activeSprints = project.sprints.filter(s => s.status === 'active');

  if (activeSprints.length === 0) {
    return { rank: 1, dueTimestamp: Infinity };
  }

  const now = Date.now();
  let closestDue = Infinity;
  let hasAnyDueDate = false;

  for (const sprint of activeSprints) {
    if (sprint.dueDate) {
      hasAnyDueDate = true;
      const due = new Date(sprint.dueDate).getTime();
      if (Math.abs(due - now) < Math.abs(closestDue - now)) {
        closestDue = due;
      }
    }
  }

  if (!hasAnyDueDate) {
    return { rank: 0, dueTimestamp: Infinity };
  }

  if (closestDue < now) {
    return { rank: -2, dueTimestamp: closestDue };
  }

  return { rank: -1, dueTimestamp: closestDue };
}

export function ProjectsPage() {
  const [filterType, setFilterType] = useLocalStorage<FilterType>('projects-filterType', 'all');
  const [statusFilter, setStatusFilter] = useLocalStorage<StatusFilter>('projects-statusFilter', 'all');
  const [search, setSearch] = useState('');
  const { projects, projectsByStage } = useProjects(filterType);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const [view, setView] = useLocalStorage<ViewType>('projects-view', isMobile ? 'list' : 'list');
  const { projects: allProjects } = useStore();

  const selectedProject = selectedProjectId ? allProjects.find(p => p.id === selectedProjectId) ?? null : null;

  const filteredProjects = useMemo(() => {
    let result = projects;

    if (statusFilter === 'all') {
      // Default view: hide archived projects
      result = result.filter(p => p.status !== 'archived');
    } else {
      result = result.filter(p => p.status === statusFilter);
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.clientName.toLowerCase().includes(q)
      );
    }

    return [...result].sort((a, b) => {
      const scoreA = getProjectSortScore(a);
      const scoreB = getProjectSortScore(b);

      if (scoreA.rank !== scoreB.rank) return scoreA.rank - scoreB.rank;

      if (scoreA.dueTimestamp !== Infinity && scoreB.dueTimestamp !== Infinity) {
        return scoreA.dueTimestamp - scoreB.dueTimestamp;
      }

      return 0;
    });
  }, [projects, statusFilter, search]);

  const filteredProjectsByStage = useMemo(() => {
    let stageProjects = projectsByStage;

    if (statusFilter === 'all') {
      // Default view: hide archived projects
      stageProjects = Object.fromEntries(
        Object.entries(stageProjects).map(([stage, projects]) => [
          stage,
          projects.filter(p => p.status !== 'archived'),
        ])
      );
    } else {
      stageProjects = Object.fromEntries(
        Object.entries(stageProjects).map(([stage, projects]) => [
          stage,
          projects.filter(p => p.status === statusFilter),
        ])
      );
    }

    if (!search) return stageProjects;
    const q = search.toLowerCase();
    return Object.fromEntries(
      Object.entries(stageProjects).map(([stage, stageProjects]) => [
        stage,
        stageProjects.filter(p =>
          p.clientName.toLowerCase().includes(q)
        ),
      ])
    );
  }, [projectsByStage, statusFilter, search]);

  return (
    <div className="animate-fade-in flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Utility bar */}
      <div className="flex-shrink-0">
        <PageHeader
          searchQuery={search}
          onSearchChange={setSearch}
          searchPlaceholder={`Buscar entre ${filteredProjects.length} projeto${filteredProjects.length !== 1 ? 's' : ''}...`}
          actions={
            <>
              {isMobile ? (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="px-3 py-2 rounded-lg text-xs font-medium bg-black/5 dark:bg-white/5 text-foreground-muted hover:bg-black/10 transition-colors flex items-center gap-1.5 outline-none">
                      {filterType === 'all' ? 'Tipos (Todos)' : FILTER_OPTIONS.find(o => o.id === filterType)?.label}
                      <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {FILTER_OPTIONS.map((opt) => (
                        <DropdownMenuItem key={opt.id} onClick={() => setFilterType(opt.id)} className="justify-between min-w-[140px]">
                          {opt.label}
                          {filterType === opt.id && <Check className="w-4 h-4 text-primary" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger className="px-3 py-2 rounded-lg text-xs font-medium bg-black/5 dark:bg-white/5 text-foreground-muted hover:bg-black/10 transition-colors flex items-center gap-1.5 outline-none">
                      {statusFilter === 'all' ? 'Status (Todos)' : STATUS_OPTIONS.find(o => o.id === statusFilter)?.label}
                      <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {STATUS_OPTIONS.map((opt) => (
                        <DropdownMenuItem key={opt.id} onClick={() => setStatusFilter(opt.id)} className="justify-between min-w-[140px]">
                          {opt.label}
                          {statusFilter === opt.id && <Check className="w-4 h-4 text-primary" />}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  {/* Type filter chips */}
                  <div className="flex items-center gap-1 p-1 glass-subtle rounded-lg">
                    {FILTER_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setFilterType(option.id)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 cursor-pointer',
                          filterType === option.id
                            ? 'bg-primary/15 text-primary'
                            : 'text-foreground-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5',
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {/* Status filter chips */}
                  <div className="flex items-center gap-1 p-1 glass-subtle rounded-lg">
                    {STATUS_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setStatusFilter(option.id)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 cursor-pointer press-scale whitespace-nowrap',
                          statusFilter === option.id
                            ? 'bg-primary/15 text-primary'
                            : 'text-foreground-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5',
                        )}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {!isMobile && <ViewToggle view={view} onChange={setView} />}
            </>
          }
        />
      </div>

      {/* Content: Main + Detail Panel side by side */}
      <div className={cn('flex flex-1 min-h-0', !isMobile && 'gap-4')}>
        {/* Main content */}
        <div className={cn(
          "flex-1 min-w-0 h-full",
          !isMobile && 'rounded-xl bg-zinc-50/50 dark:bg-zinc-800/20 border border-zinc-200/60 dark:border-zinc-700/40',
          view === 'kanban' ? 'overflow-hidden' : 'overflow-y-auto',
          !isMobile && view !== 'kanban' && 'p-4',
        )}>
          {view === 'list' ? (
            <ProjectListView
              projects={filteredProjects}
              onProjectClick={(project) => setSelectedProjectId(project.id)}
            />
          ) : view === 'calendar' ? (
            <ProjectCalendarView
              projects={filteredProjects}
              onProjectClick={(project) => setSelectedProjectId(project.id)}
            />
          ) : (
            <KanbanBoard<Project>
              columns={PROJECT_STAGES}
              items={filteredProjectsByStage}
              onMoveItem={() => {}}
              renderCard={(project) => <ProjectCard project={project} />}
              onCardClick={(project) => setSelectedProjectId(project.id)}
            />
          )}
        </div>

        {/* Detail Side Panel */}
        <ProjectDetailDrawer
          project={selectedProject}
          onClose={() => setSelectedProjectId(null)}
        />
      </div>
    </div>
  );
}

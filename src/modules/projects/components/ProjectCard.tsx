import { Calendar } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { ProjectTypeBadge } from '@/shared/components/ui/Badge';
import { useStore } from '@/shared/lib/store';
import type { Project } from '@/shared/types/models';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { getUserById } = useStore();
  const owner = getUserById(project.ownerId);
  const currentSprint = project.sprints.find(s => s.id === project.currentSprintId);
  const isDeliverySoon = project.nextDeliveryDate && 
    (new Date(project.nextDeliveryDate).getTime() - Date.now()) < 7 * 86400000 &&
    (new Date(project.nextDeliveryDate).getTime() - Date.now()) > 0;

  return (
    <div className="space-y-3">
      {/* Client + Type */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-[family-name:var(--font-display)] text-sm font-semibold text-foreground leading-tight truncate">
          {project.clientName}
        </h4>
        <ProjectTypeBadge type={project.type} />
      </div>

      {/* Sprint */}
      {currentSprint && (
        <p className="text-[11px] text-foreground-muted truncate">
          🏃 {currentSprint.name}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        {owner && (
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-primary/15 flex items-center justify-center">
              <span className="text-[8px] font-bold text-primary">{owner.initials}</span>
            </div>
            <span className="text-[10px] text-foreground-muted">{owner.name.split(' ')[0]}</span>
          </div>
        )}

        {project.nextDeliveryDate && (
          <div className={cn(
            'flex items-center gap-1 text-[10px]',
            isDeliverySoon ? 'text-warning font-semibold' : 'text-foreground-muted',
          )}>
            <Calendar className="w-3 h-3" />
            {new Date(project.nextDeliveryDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
}

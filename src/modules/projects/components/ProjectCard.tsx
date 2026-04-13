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
  const owners = project.ownerIds.map(id => getUserById(id)).filter(Boolean);
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
        {owners.length > 0 ? (
          <div className="flex items-center -space-x-1.5">
            {owners.slice(0, 3).map((owner, i) => (
              <div key={i} className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center border-2 border-white dark:border-zinc-900 cursor-default" title={owner!.name}>
                {owner!.avatarUrl ? (
                  <img src={owner!.avatarUrl} className="w-6 h-6 rounded-full object-cover" alt="" />
                ) : (
                  <span className="text-[9px] font-bold text-primary">{owner!.initials}</span>
                )}
              </div>
            ))}
            {owners.length > 3 && (
              <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-[8px] font-bold text-foreground-muted border-2 border-white dark:border-zinc-900">
                +{owners.length - 3}
              </div>
            )}
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-dashed border-foreground-muted/30 flex items-center justify-center" title="Sem responsável">
            <span className="text-[9px] text-foreground-muted/50">?</span>
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

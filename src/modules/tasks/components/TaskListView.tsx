import { useMemo, useState } from 'react';
import type { Task } from '@/shared/types/models';
import { TASK_STATUSES } from '@/shared/lib/constants';
import { cn } from '@/shared/utils/cn';
import { ChevronDown, Pencil, Trash2, CalendarDays, Check, Briefcase, User } from 'lucide-react';
import { PriorityBadge, TaskTypeBadge } from '@/shared/components/ui/Badge';
import { UserAvatar } from '@/shared/components/ui/UserAvatar';
import { useStore } from '@/shared/lib/store';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/shared/components/ui/DropdownMenu';
import { DatePicker } from '@/shared/components/ui/DatePicker';

interface TaskListViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (task: Task) => void;
}

export function TaskListView({ tasks, onEditTask, onDeleteTask }: TaskListViewProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const { users, getUserById, updateTask, projects, leads } = useStore();

  const toggleGroup = (statusId: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(statusId)) next.delete(statusId);
      else next.add(statusId);
      return next;
    });
  };

  const tasksByStatus = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const status of TASK_STATUSES) {
      map.set(status.id, []);
    }
    for (const task of tasks) {
      if (map.has(task.status)) {
        map.get(task.status)!.push(task);
      }
    }
    return map;
  }, [tasks]);

  const toggleTaskCompletion = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    // Optimistically completes the task
    const nextStatus = task.status === 'done' ? 'in_progress' : 'done';
    try {
      await updateTask(task.id, { status: nextStatus });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto w-full space-y-8 animate-fade-in bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 md:p-6 pb-12">
      {TASK_STATUSES.map(status => {
        const groupTasks = tasksByStatus.get(status.id) ?? [];
        if (groupTasks.length === 0 && status.id !== 'todo') return null;
        
        const isCollapsed = collapsedGroups.has(status.id);

        return (
          <div key={status.id} className="flex flex-col">
            {/* ClickUp Style Group Header & Column Headers */}
            <div className="flex items-center gap-4 mb-2 border-b border-border-subtle pb-2">
              <div className="flex-1 min-w-0 flex items-center md:gap-4">
                <div 
                  className="flex items-center gap-2 cursor-pointer group flex-shrink-0"
                  onClick={() => toggleGroup(status.id)}
                >
                  <div 
                    className="w-5 h-5 flex items-center justify-center rounded transition-colors group-hover:bg-black/10 dark:group-hover:bg-white/10 text-foreground-muted"
                    style={{ color: status.color }}
                  >
                    <ChevronDown className={cn(
                      "w-4 h-4 transition-transform duration-200",
                      isCollapsed && "-rotate-90"
                    )} />
                  </div>
                  <div 
                    className="px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: status.color }}
                  >
                    {status.label}
                  </div>
                  <span className="text-[11px] text-foreground-muted font-medium ml-1 bg-black/5 dark:bg-white/5 px-1.5 rounded-md">
                    {groupTasks.length}
                  </span>
                </div>

                <div className="hidden md:block text-[10px] font-bold text-foreground-muted uppercase tracking-widest px-2">
                  Título da Tarefa
                </div>
              </div>

              {/* Column labels - Hidden on very small screens, shown as flex otherwise */}
              <div className="hidden md:flex items-center gap-4 text-[10px] font-bold text-foreground-muted uppercase tracking-widest px-2">
                <div className="w-[130px] shrink-0 text-center">Vínculo</div>
                <div className="w-[120px] shrink-0 text-center">Responsável</div>
                <div className="w-[110px] shrink-0 text-center">Previsão</div>
                <div className="w-[120px] shrink-0 text-center">Etapa</div>
                <div className="w-[100px] shrink-0 text-center">Prioridade</div>
                <div className="w-[80px] shrink-0 text-right pr-2">Ações</div>
              </div>
            </div>

            {/* Tasks list */}
            {!isCollapsed && (
              <div className="flex flex-col">
                {groupTasks.length > 0 ? (
                  groupTasks.map(task => {
                      const owners = (task.ownerIds ?? []).map(id => getUserById(id)).filter(Boolean);
                      const isDone = task.status === 'done';
                      
                      const dueTime = task.dueDate ? new Date(task.dueDate).getTime() : null;
                      const now = Date.now();
                      const isOverdue = !!(dueTime && dueTime < now && !isDone);

                      let linkedName = '';
                      let linkedType: 'project' | 'lead' | null = null;
                      if (task.projectId) {
                        const project = projects?.find(p => p.id === task.projectId);
                        linkedName = project?.clientName ?? '';
                        linkedType = 'project';
                      } else if (task.leadId) {
                        const lead = leads?.find(l => l.id === task.leadId);
                        linkedName = lead?.name ?? '';
                        linkedType = 'lead';
                      }

                    return (
                      <div 
                        key={task.id} 
                        onClick={() => onEditTask(task)}
                        className="group relative flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 w-full py-2.5 px-2 md:px-0 border-b border-border-subtle/50 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02] cursor-pointer"
                      >
                        {/* Title column */}
                        <div className="flex items-start md:items-center gap-3 flex-1 min-w-0 md:pl-8 py-0.5">
                           {/* Status toggle square */}
                           <button 
                             onClick={(e) => toggleTaskCompletion(task, e)}
                             className={cn(
                               "w-[14px] h-[14px] rounded-[3px] flex items-center justify-center transition-all flex-shrink-0 cursor-pointer shadow-sm hover:scale-110 border border-black/10 dark:border-white/10 mt-[3px] md:mt-0",
                               isDone ? "bg-emerald-500" : ""
                             )}
                             style={!isDone ? { backgroundColor: status.color } : undefined}
                             title={isDone ? "Desmarcar" : "Concluir"}
                           >
                             {isDone && <Check className="w-[10px] h-[10px] text-white" strokeWidth={3} />}
                           </button>
                           
                           <div className="flex flex-col min-w-0 flex-1">
                             {/* Title only */}
                             <span className={cn(
                               "text-sm font-medium leading-snug",
                               isDone ? "text-foreground-muted line-through" : "text-foreground",
                             )}>
                               {task.title}
                             </span>
                           </div>
                        </div>

                        {/* Flex columns for data */}
                        <div className="hidden md:flex items-center gap-4 px-2">

                           {/* Vínculo (Projeto ou Lead) */}
                           <div className="w-[130px] shrink-0 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                             {linkedName && linkedType ? (
                               <div className={cn(
                                 'flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold w-fit max-w-full',
                                 linkedType === 'project'
                                   ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                                   : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
                               )}>
                                 {linkedType === 'project'
                                   ? <Briefcase className="w-2.5 h-2.5 flex-shrink-0" />
                                   : <User className="w-2.5 h-2.5 flex-shrink-0" />
                                 }
                                 <span className="truncate uppercase tracking-wider max-w-[90px]">{linkedName}</span>
                               </div>
                             ) : (
                               <span className="text-[11px] text-foreground-muted/40">—</span>
                             )}
                           </div>

                           {/* Assignee */}
                           <div className="w-[120px] shrink-0 flex items-center justify-center">
                             <DropdownMenu>
                               <DropdownMenuTrigger asChild>
                                 <div 
                                   onClick={(e) => e.stopPropagation()} 
                                   className="flex items-center justify-center w-full h-8 cursor-pointer rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                                 >
                                   {owners.length > 0 ? (
                                     <div className="flex items-center -space-x-1.5 transition-all">
                                       {owners.slice(0, 3).map((owner) => (
                                         <UserAvatar
                                           key={owner!.id}
                                           name={owner!.name}
                                           initials={owner!.initials}
                                           avatarUrl={owner!.avatarUrl}
                                           size="sm"
                                           className="ring-2 ring-white dark:ring-zinc-900"
                                         />
                                       ))}
                                       {owners.length > 3 && (
                                         <div className="w-6 h-6 rounded-full bg-black/5 dark:bg-white/5 ring-2 ring-white dark:ring-zinc-900 flex items-center justify-center text-[9px] font-bold text-foreground-muted">
                                           +{owners.length - 3}
                                         </div>
                                       )}
                                     </div>
                                   ) : (
                                     <div className="w-6 h-6 rounded-full border border-dashed border-border-subtle flex items-center justify-center text-foreground-muted/50">
                                       <span className="text-[10px]">-</span>
                                     </div>
                                   )}
                                 </div>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent align="center" className="w-[200px] max-h-[300px] overflow-y-auto">
                                 {users.map(u => {
                                   const isSelected = (task.ownerIds ?? []).includes(u.id);
                                   return (
                                     <DropdownMenuItem
                                       key={u.id}
                                       onClick={(e) => {
                                         e.preventDefault();
                                         const newOwners = isSelected
                                           ? (task.ownerIds ?? []).filter(id => id !== u.id)
                                           : [...(task.ownerIds ?? []), u.id];
                                         updateTask(task.id, { ownerIds: newOwners });
                                       }}
                                     >
                                       <div className="flex items-center gap-2 flex-1">
                                         <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center border border-border-subtle rounded-sm">
                                           {isSelected && <Check className="w-3 h-3 text-primary" />}
                                         </div>
                                         <UserAvatar name={u.name} initials={u.initials} avatarUrl={u.avatarUrl} size="xs" />
                                         <span className="truncate">{u.name}</span>
                                       </div>
                                     </DropdownMenuItem>
                                   );
                                 })}
                               </DropdownMenuContent>
                             </DropdownMenu>
                           </div>

                           {/* Due Date */}
                           <div className="w-[110px] shrink-0 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                             <DatePicker 
                               value={task.dueDate} 
                               onChange={(val) => updateTask(task.id, { dueDate: val })}
                               placeholder="Não def."
                               variant={
                                 isOverdue 
                                   ? 'badge-overdue' 
                                   : task.dueDate && new Date(task.dueDate).getTime() < Date.now() + 86400000 && new Date(task.dueDate).getTime() > Date.now() 
                                     ? 'badge-today' 
                                     : 'badge-upcoming'
                               }
                               className={cn(
                                 "w-full flex justify-center !min-w-[80px]",
                                 isDone && "opacity-50 hover:opacity-80 mix-blend-luminosity grayscale"
                               )}
                             />
                           </div>

                           {/* Stage/Type */}
                           <div className="w-[120px] shrink-0 flex items-center justify-center">
                             <DropdownMenu>
                               <DropdownMenuTrigger asChild>
                                 <div onClick={(e) => e.stopPropagation()} className="cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 p-1 rounded transition-colors flex justify-center w-full">
                                   <TaskTypeBadge type={task.type} />
                                 </div>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent align="center" className="min-w-[120px]">
                                 <DropdownMenuItem className="justify-center py-1.5 focus:bg-black/5 dark:focus:bg-white/5" onClick={() => updateTask(task.id, { type: 'sales' })}>
                                   <TaskTypeBadge type="sales" />
                                 </DropdownMenuItem>
                                 <DropdownMenuItem className="justify-center py-1.5 focus:bg-black/5 dark:focus:bg-white/5" onClick={() => updateTask(task.id, { type: 'standalone' })}>
                                   <TaskTypeBadge type="standalone" />
                                 </DropdownMenuItem>
                                 <DropdownMenuItem className="justify-center py-1.5 focus:bg-black/5 dark:focus:bg-white/5" onClick={() => updateTask(task.id, { type: 'project' })}>
                                   <TaskTypeBadge type="project" />
                                 </DropdownMenuItem>
                               </DropdownMenuContent>
                             </DropdownMenu>
                           </div>

                           {/* Priority */}
                           <div className="w-[100px] shrink-0 flex items-center justify-center">
                             <DropdownMenu>
                               <DropdownMenuTrigger asChild>
                                 <div onClick={(e) => e.stopPropagation()} className="cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 p-1 rounded transition-colors flex justify-center w-full">
                                   <PriorityBadge priority={task.priority} />
                                 </div>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent align="center" className="min-w-[120px]">
                                 <DropdownMenuItem className="justify-center py-1.5 focus:bg-black/5 dark:focus:bg-white/5" onClick={() => updateTask(task.id, { priority: 'low' })}>
                                   <PriorityBadge priority="low" />
                                 </DropdownMenuItem>
                                 <DropdownMenuItem className="justify-center py-1.5 focus:bg-black/5 dark:focus:bg-white/5" onClick={() => updateTask(task.id, { priority: 'medium' })}>
                                   <PriorityBadge priority="medium" />
                                 </DropdownMenuItem>
                                 <DropdownMenuItem className="justify-center py-1.5 focus:bg-black/5 dark:focus:bg-white/5" onClick={() => updateTask(task.id, { priority: 'high' })}>
                                   <PriorityBadge priority="high" />
                                 </DropdownMenuItem>
                               </DropdownMenuContent>
                             </DropdownMenu>
                           </div>

                           {/* Actions */}
                           <div className="w-[80px] shrink-0 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); onEditTask(task); }}
                                className="w-7 h-7 rounded-md flex items-center justify-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-primary hover:border-primary/40 transition-all shadow-sm"
                                title="Editar"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); onDeleteTask(task); }}
                                className="w-7 h-7 rounded-md flex items-center justify-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-red-500 hover:border-red-300 dark:hover:border-red-800 transition-all shadow-sm"
                                title="Excluir"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                           </div>
                        </div>

                        {/* Mobile supplementary info block (hidden on MD+) */}
                        <div className="flex md:hidden w-full items-center justify-between text-xs text-foreground-muted mt-1 px-1">
                          <div className="flex items-center gap-2">
                             {task.dueDate && (
                               <div className={cn("flex items-center gap-1", isOverdue && "text-red-500")}>
                                 <CalendarDays className="w-3 h-3" />
                                 {new Date(task.dueDate).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}
                               </div>
                             )}
                          </div>
                          <div className="flex items-center gap-2">
                             <PriorityBadge priority={task.priority} />
                          </div>
                        </div>

                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm text-foreground-muted py-4 pl-8 border-b border-border-subtle/50">
                    Nenhuma tarefa neste status.
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

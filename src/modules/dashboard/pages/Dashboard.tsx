import { useStore } from '@/shared/lib/store';
import { useAuth } from '@/app/providers/AuthProvider';
import { useLocation } from 'wouter';
import { cn } from '@/shared/utils/cn';
import { Button } from '@/shared/components/ui/Button';
import { PriorityBadge, TaskTypeBadge, Badge } from '@/shared/components/ui/Badge';
import { FUNNEL_STAGES } from '@/shared/lib/constants';
import {
  UserPlus, ListPlus, Calendar, AlertTriangle,
  TrendingUp, CheckCircle2, Clock, Zap,
  Briefcase, Target, ChevronRight,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { LeadCreateDialog } from '@/modules/crm/components/LeadCreateDialog';
import { TaskCreateDialog } from '@/modules/tasks/components/TaskCreateDialog';

export function Dashboard() {
  const { leads, projects, tasks, getUserById } = useStore();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [createLeadOpen, setCreateLeadOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  // ─── KPIs ───
  const activeLeads = leads.filter(l => l.stage !== 'lost' && l.stage !== 'contract_signed');
  const wonLeads = leads.filter(l => l.stage === 'contract_signed');
  const pipelineValue = activeLeads.reduce((sum, l) => sum + (l.estimatedValue ?? 0), 0);
  const activeProjects = projects.filter(p => p.status === 'active');
  const totalTasks = tasks.filter(t => t.status !== 'done');
  const blockedTasks = tasks.filter(t => t.status === 'blocked');

  // ─── Alertas urgentes ───
  const overdueFollowUps = leads.filter(l =>
    l.nextContactDate && new Date(l.nextContactDate) < now &&
    l.stage !== 'lost' && l.stage !== 'contract_signed'
  );
  const overdueTasks = tasks.filter(t =>
    t.dueDate && new Date(t.dueDate) < now && t.status !== 'done'
  );
  const deliveringSoon = activeProjects.filter(p =>
    p.nextDeliveryDate &&
    (new Date(p.nextDeliveryDate).getTime() - Date.now()) < 7 * 86400000 &&
    (new Date(p.nextDeliveryDate).getTime() - Date.now()) > 0
  );

  const totalAlerts = overdueFollowUps.length + overdueTasks.length;

  // ─── Minhas tarefas ───
  const myPendingTasks = useMemo(() =>
    tasks
      .filter(t => t.ownerId === user?.id && t.status !== 'done')
      .sort((a, b) => {
        // Overdue first, then by due date
        const aOver = a.dueDate && new Date(a.dueDate) < now ? -1 : 0;
        const bOver = b.dueDate && new Date(b.dueDate) < now ? -1 : 0;
        if (aOver !== bOver) return aOver - bOver;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      })
      .slice(0, 8),
    [tasks, user?.id, now]
  );

  // ─── Pipeline funnel visualization ───
  const funnelData = useMemo(() =>
    FUNNEL_STAGES
      .filter(s => s.id !== 'lost')
      .map(stage => ({
        ...stage,
        count: leads.filter(l => l.stage === stage.id).length,
      })),
    [leads]
  );
  const maxFunnelCount = Math.max(...funnelData.map(s => s.count), 1);

  // ─── Format currency ───
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="animate-fade-in space-y-6">
      {/* ═══════ Header Row ═══════ */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-foreground">
            {greeting}, {user?.name?.split(' ')[0] ?? 'Usuário'}
          </h1>
          <p className="text-sm text-foreground-muted mt-0.5">
            {now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })} — Visão geral do sistema
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setCreateLeadOpen(true)}>
            <UserPlus className="w-3.5 h-3.5" />
            Novo Lead
          </Button>
          <Button variant="primary" size="sm" onClick={() => setCreateTaskOpen(true)}>
            <ListPlus className="w-3.5 h-3.5" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      {/* ═══════ KPI Strip ═══════ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          icon={<Target className="w-4 h-4" />}
          iconColor="text-primary"
          label="Pipeline ativo"
          value={formatCurrency(pipelineValue)}
          sub={`${activeLeads.length} leads`}
          onClick={() => setLocation('/crm')}
        />
        <KpiCard
          icon={<Briefcase className="w-4 h-4" />}
          iconColor="text-blue-light"
          label="Projetos ativos"
          value={String(activeProjects.length)}
          sub={`${deliveringSoon.length} entrega${deliveringSoon.length !== 1 ? 's' : ''} próxima${deliveringSoon.length !== 1 ? 's' : ''}`}
          onClick={() => setLocation('/projects')}
        />
        <KpiCard
          icon={<CheckCircle2 className="w-4 h-4" />}
          iconColor="text-success"
          label="Tarefas pendentes"
          value={String(totalTasks.length)}
          sub={blockedTasks.length > 0 ? `${blockedTasks.length} bloqueada${blockedTasks.length > 1 ? 's' : ''}` : 'Nenhuma bloqueada'}
          alert={blockedTasks.length > 0}
          onClick={() => setLocation('/tasks')}
        />
        <KpiCard
          icon={<TrendingUp className="w-4 h-4" />}
          iconColor="text-success"
          label="Convertidos"
          value={String(wonLeads.length)}
          sub={`de ${leads.length} leads totais`}
        />
      </div>

      {/* ═══════ Alerts Banner ═══════ */}
      {totalAlerts > 0 && (
        <div className="glass rounded-lg p-4 border-l-[3px] border-destructive flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {totalAlerts} {totalAlerts > 1 ? 'atenções pendentes' : 'atenção pendente'}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
              {overdueFollowUps.length > 0 && (
                <button onClick={() => setLocation('/crm')} className="text-xs text-destructive hover:underline cursor-pointer">
                  {overdueFollowUps.length} follow-up{overdueFollowUps.length > 1 ? 's' : ''} vencido{overdueFollowUps.length > 1 ? 's' : ''}
                </button>
              )}
              {overdueTasks.length > 0 && (
                <button onClick={() => setLocation('/tasks')} className="text-xs text-destructive hover:underline cursor-pointer">
                  {overdueTasks.length} tarefa{overdueTasks.length > 1 ? 's' : ''} atrasada{overdueTasks.length > 1 ? 's' : ''}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════ Main Grid ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ─── Col 1+2: Pipeline + Minhas Tarefas ─── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Pipeline Visual */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold text-foreground">
                Pipeline de Vendas
              </h3>
              <button
                onClick={() => setLocation('/crm')}
                className="flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer"
              >
                Ver funil <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-2">
              {funnelData.map(stage => (
                <div key={stage.id} className="flex items-center gap-3">
                  <span className="text-[11px] text-foreground-muted w-28 truncate text-right">{stage.label}</span>
                  <div className="flex-1 h-6 bg-black/5 dark:bg-white/5 rounded-sm overflow-hidden relative">
                    <div
                      className="h-full rounded-sm transition-all duration-700 ease-out"
                      style={{
                        width: `${Math.max((stage.count / maxFunnelCount) * 100, stage.count > 0 ? 8 : 0)}%`,
                        backgroundColor: stage.color,
                        opacity: 0.8,
                      }}
                    />
                    {stage.count > 0 && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-foreground">
                        {stage.count}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Minhas Tarefas */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold text-foreground">
                Minhas Tarefas
              </h3>
              <button
                onClick={() => setLocation('/tasks')}
                className="flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer"
              >
                Ver todas <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            {myPendingTasks.length > 0 ? (
              <div className="space-y-1">
                {myPendingTasks.map(task => {
                  const isOverdue = task.dueDate && new Date(task.dueDate) < now;
                  const linkedProject = task.projectId ? projects.find(p => p.id === task.projectId) : null;
                  const linkedLead = task.leadId ? leads.find(l => l.id === task.leadId) : null;

                  return (
                    <div
                      key={task.id}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                        'hover:bg-black/5 dark:hover:bg-white/5 group',
                        isOverdue && 'bg-destructive/5',
                      )}
                    >
                      {/* Status dot */}
                      <div className={cn(
                        'w-2 h-2 rounded-full flex-shrink-0',
                        task.status === 'blocked' ? 'bg-destructive' :
                          task.status === 'in_progress' ? 'bg-primary' :
                            isOverdue ? 'bg-destructive' : 'bg-foreground-muted/30',
                      )} />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <TaskTypeBadge type={task.type} />
                          {(linkedProject || linkedLead) && (
                            <span className="text-[10px] text-foreground-muted/50 truncate">
                              ↳ {linkedProject?.clientName ?? linkedLead?.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Priority + Date */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <PriorityBadge priority={task.priority} />
                        {task.dueDate && (
                          <span className={cn(
                            'text-[10px] font-medium flex items-center gap-0.5',
                            isOverdue ? 'text-destructive' : 'text-foreground-muted',
                          )}>
                            <Calendar className="w-3 h-3" />
                            {new Date(task.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-success/30 mx-auto mb-2" />
                <p className="text-sm text-foreground-muted">Nenhuma tarefa pendente</p>
              </div>
            )}
          </div>
        </div>

        {/* ─── Col 3: Sidebar cards ─── */}
        <div className="space-y-4">

          {/* Próximas Entregas */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold text-foreground">
                Próximas Entregas
              </h3>
              <Calendar className="w-4 h-4 text-foreground-muted/40" />
            </div>
            {deliveringSoon.length > 0 ? (
              <div className="space-y-3">
                {deliveringSoon.map(project => {
                  const owner = project.ownerId ? getUserById(project.ownerId) : undefined;
                  const daysLeft = Math.ceil(
                    (new Date(project.nextDeliveryDate!).getTime() - Date.now()) / 86400000
                  );
                  return (
                    <div
                      key={project.id}
                      className="flex items-start gap-3 cursor-pointer group"
                      onClick={() => setLocation('/projects')}
                    >
                      <div className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                        daysLeft <= 2 ? 'bg-destructive/10' : 'bg-warning/10',
                      )}>
                        <span className={cn(
                          'text-xs font-bold',
                          daysLeft <= 2 ? 'text-destructive' : 'text-warning',
                        )}>
                          {daysLeft}d
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {project.clientName}
                        </p>
                        <p className="text-[10px] text-foreground-muted">
                          {owner?.name?.split(' ')[0]} · {new Date(project.nextDeliveryDate!).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </p>
                      </div>
                      <Badge variant={project.type === 'recurring' ? 'recurring' : 'oneshot'}>
                        {project.type === 'recurring' ? 'Rec' : 'Único'}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center">
                <Zap className="w-6 h-6 text-success/30 mx-auto mb-1.5" />
                <p className="text-xs text-foreground-muted">Sem entregas urgentes</p>
              </div>
            )}
          </div>

          {/* Follow-ups Vencidos */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold text-foreground">
                Follow-ups Vencidos
              </h3>
              {overdueFollowUps.length > 0 && (
                <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                  {overdueFollowUps.length}
                </span>
              )}
            </div>
            {overdueFollowUps.length > 0 ? (
              <div className="space-y-3">
                {overdueFollowUps.slice(0, 5).map(lead => {
                  const owner = getUserById(lead.ownerId);
                  const daysSince = Math.floor(
                    (Date.now() - new Date(lead.nextContactDate!).getTime()) / 86400000
                  );
                  return (
                    <div
                      key={lead.id}
                      className="flex items-start gap-3 cursor-pointer group"
                      onClick={() => setLocation('/crm')}
                    >
                      <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-3.5 h-3.5 text-destructive" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {lead.name}
                        </p>
                        <p className="text-[10px] text-destructive">
                          {daysSince} dia{daysSince > 1 ? 's' : ''} em atraso · {owner?.name?.split(' ')[0]}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center">
                <CheckCircle2 className="w-6 h-6 text-success/30 mx-auto mb-1.5" />
                <p className="text-xs text-foreground-muted">Todos em dia ✓</p>
              </div>
            )}
          </div>

          {/* Resumo Rápido de Projetos */}
          <div className="glass rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold text-foreground">
                Projetos por Tipo
              </h3>
              <button
                onClick={() => setLocation('/projects')}
                className="flex items-center gap-1 text-xs text-primary hover:underline cursor-pointer"
              >
                Ver <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              {/* Mini ring chart placeholder */}
              <div className="relative w-16 h-16 flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                  <circle
                    cx="18" cy="18" r="15.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-border"
                  />
                  <circle
                    cx="18" cy="18" r="15.5"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="3"
                    strokeDasharray={`${activeProjects.length > 0 ? (activeProjects.filter(p => p.type === 'recurring').length / activeProjects.length) * 97.4 : 0} 97.4`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="font-[family-name:var(--font-display)] text-lg font-bold text-foreground">
                    {activeProjects.length}
                  </span>
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-success" />
                    <span className="text-xs text-foreground-muted">Recorrentes</span>
                  </div>
                  <span className="text-xs font-semibold text-foreground">
                    {activeProjects.filter(p => p.type === 'recurring').length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-light" />
                    <span className="text-xs text-foreground-muted">Únicos</span>
                  </div>
                  <span className="text-xs font-semibold text-foreground">
                    {activeProjects.filter(p => p.type === 'oneshot').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <LeadCreateDialog open={createLeadOpen} onOpenChange={setCreateLeadOpen} />
      <TaskCreateDialog open={createTaskOpen} onOpenChange={setCreateTaskOpen} />
    </div>
  );
}

// ─── KPI Card Component ───
function KpiCard({
  icon, iconColor, label, value, sub, alert, onClick,
}: {
  icon: React.ReactNode;
  iconColor: string;
  label: string;
  value: string;
  sub: string;
  alert?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'glass rounded-xl p-4 transition-all duration-300',
        onClick && 'cursor-pointer hover:translate-y-[-2px] hover:glass-hover',
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={cn('w-7 h-7 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center', iconColor)}>
          {icon}
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">{label}</span>
      </div>
      <p className="font-[family-name:var(--font-display)] text-xl font-bold text-foreground tracking-tight">
        {value}
      </p>
      <p className={cn('text-[11px] mt-0.5', alert ? 'text-destructive font-medium' : 'text-foreground-muted')}>
        {sub}
      </p>
    </div>
  );
}

import { Route, Switch } from 'wouter';
import { lazy, Suspense } from 'react';
import { PageLayout } from '@/shared/components/layout/PageLayout';
import { PrivateRoute } from './PrivateRoute';
import { Login } from '@/modules/auth/pages/Login';
import { AccessDenied } from '@/modules/auth/pages/AccessDenied';
import { Dashboard } from '@/modules/dashboard/pages/Dashboard';

// Lazy-loaded routes — only downloaded when navigated to
const CrmKanban = lazy(() => import('@/modules/crm/pages/CrmKanban').then(m => ({ default: m.CrmKanban })));
const ProjectsPage = lazy(() => import('@/modules/projects/pages/ProjectsPage').then(m => ({ default: m.ProjectsPage })));
const TasksKanban = lazy(() => import('@/modules/tasks/pages/TasksKanban').then(m => ({ default: m.TasksKanban })));
const TeamPage = lazy(() => import('@/modules/team/pages/TeamPage').then(m => ({ default: m.TeamPage })));

function RouteFallback() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <svg className="animate-spin h-6 w-6 text-foreground/30" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    </div>
  );
}

export function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      <Route path="/access-denied" component={AccessDenied} />

      {/* Protected routes */}
      <Route>
        <PrivateRoute>
          <PageLayout>
            <Suspense fallback={<RouteFallback />}>
              <Switch>
                <Route path="/" component={Dashboard} />
                <Route path="/crm">{() => <CrmKanban />}</Route>
                <Route path="/projects">{() => <ProjectsPage />}</Route>
                <Route path="/tasks">{() => <TasksKanban />}</Route>
                <Route path="/team">{() => <TeamPage />}</Route>

                {/* 404 */}
                <Route>
                  <div className="animate-fade-in flex items-center justify-center h-[60vh]">
                    <div className="text-center">
                      <h2 className="font-[family-name:var(--font-display)] text-6xl font-bold text-foreground/10 mb-2">
                        404
                      </h2>
                      <p className="text-foreground-muted text-sm">
                        Página não encontrada
                      </p>
                    </div>
                  </div>
                </Route>
              </Switch>
            </Suspense>
          </PageLayout>
        </PrivateRoute>
      </Route>
    </Switch>
  );
}

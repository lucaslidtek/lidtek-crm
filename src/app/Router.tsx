import { Route, Switch } from 'wouter';
import { PageLayout } from '@/shared/components/layout/PageLayout';
import { PrivateRoute } from './PrivateRoute';
import { Login } from '@/modules/auth/pages/Login';
import { Dashboard } from '@/modules/dashboard/pages/Dashboard';
import { CrmKanban } from '@/modules/crm/pages/CrmKanban';
import { ProjectsPage } from '@/modules/projects/pages/ProjectsPage';
import { TasksKanban } from '@/modules/tasks/pages/TasksKanban';
import { TeamPage } from '@/modules/team/pages/TeamPage';

export function Router() {
  return (
    <Switch>
      {/* Public route */}
      <Route path="/login" component={Login} />

      {/* Protected routes */}
      <Route>
        <PrivateRoute>
          <PageLayout>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/crm" component={CrmKanban} />
              <Route path="/projects" component={ProjectsPage} />
              <Route path="/tasks" component={TasksKanban} />
              <Route path="/team" component={TeamPage} />

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
          </PageLayout>
        </PrivateRoute>
      </Route>
    </Switch>
  );
}


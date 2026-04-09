import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useStore } from '@/shared/lib/store';
import { KanbanBoard } from '@/shared/components/kanban/KanbanBoard';
import { LeadCard } from '@/modules/crm/components/LeadCard';
import { LeadDetailDrawer } from '@/modules/crm/components/LeadDetailDrawer';
import { LeadCreateDialog } from '@/modules/crm/components/LeadCreateDialog';
import { useLeads } from '@/modules/crm/hooks/useLeads';
import { Button } from '@/shared/components/ui/Button';
import { ViewToggle, type ViewType } from '@/shared/components/ui/ViewToggle';
import { LeadListView } from '@/modules/crm/components/LeadListView';
import { FUNNEL_STAGES } from '@/shared/lib/constants';
import type { Lead } from '@/shared/types/models';

export function CrmKanban() {
  const { leads, leadsByStage, moveLead } = useLeads();
  const { reorderLeads } = useStore();
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [view, setView] = useState<ViewType>('kanban');

  // Always derive the selected lead from the live store data
  const selectedLead = selectedLeadId ? leads.find(l => l.id === selectedLeadId) ?? null : null;

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-foreground">
            Funil de Vendas
            <span className="text-foreground-muted/40 font-semibold text-lg ml-2">({leads.length})</span>
          </h1>
          <p className="text-sm text-foreground-muted mt-0.5">Pipeline comercial</p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle view={view} onChange={setView} views={['kanban', 'list']} />
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="w-4 h-4" />
            Novo Lead
          </Button>
        </div>
      </div>

      {/* Content based on view */}
      {view === 'kanban' ? (
        <KanbanBoard<Lead>
          columns={FUNNEL_STAGES}
          items={leadsByStage}
          onMoveItem={moveLead}
          renderCard={(lead) => <LeadCard lead={lead} />}
          onCardClick={(lead) => setSelectedLeadId(lead.id)}
          onChangeOrder={(items) => reorderLeads(Object.values(items).flat())}
        />
      ) : (
        <LeadListView 
          leads={leads} 
          onLeadClick={(lead) => setSelectedLeadId(lead.id)} 
        />
      )}

      {/* Detail Drawer */}
      <LeadDetailDrawer
        lead={selectedLead}
        onClose={() => setSelectedLeadId(null)}
      />

      {/* Create Dialog */}
      <LeadCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}

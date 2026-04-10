import { useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { useStore } from '@/shared/lib/store';
import { KanbanBoard } from '@/shared/components/kanban/KanbanBoard';
import { LeadCard } from '@/modules/crm/components/LeadCard';
import { LeadDetailDrawer } from '@/modules/crm/components/LeadDetailDrawer';
import { LeadCreateDialog } from '@/modules/crm/components/LeadCreateDialog';
import { ColumnManagerDialog } from '@/modules/crm/components/ColumnManagerDialog';
import { useLeads } from '@/modules/crm/hooks/useLeads';
import { usePermissions } from '@/shared/hooks/usePermissions';
import { Button } from '@/shared/components/ui/Button';
import { ViewToggle, type ViewType } from '@/shared/components/ui/ViewToggle';
import { LeadListView } from '@/modules/crm/components/LeadListView';
import type { Lead, FunnelColumn } from '@/shared/types/models';

export function CrmKanban() {
  const { leads, leadsByStage, moveLead } = useLeads();
  const { funnelColumns, reorderLeads, createFunnelColumn, updateFunnelColumn, deleteFunnelColumn } = useStore();
  const { canEditAll } = usePermissions();

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [view, setView] = useState<ViewType>('kanban');

  // Column manager state
  const [columnDialogOpen, setColumnDialogOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<FunnelColumn | null>(null);

  // Always derive the selected lead from the live store data
  const selectedLead = selectedLeadId ? leads.find(l => l.id === selectedLeadId) ?? null : null;

  // Column management handlers (admin only)
  const handleAddColumn = useCallback(() => {
    setEditingColumn(null);
    setColumnDialogOpen(true);
  }, []);

  const handleEditColumn = useCallback((columnId: string) => {
    const col = funnelColumns.find(c => c.id === columnId);
    if (col) {
      setEditingColumn(col);
      setColumnDialogOpen(true);
    }
  }, [funnelColumns]);

  const handleDeleteColumn = useCallback((columnId: string) => {
    const col = funnelColumns.find(c => c.id === columnId);
    if (col) {
      setEditingColumn(col);
      setColumnDialogOpen(true);
    }
  }, [funnelColumns]);

  const handleColumnSave = useCallback(async (data: { label: string; color: string }) => {
    if (editingColumn) {
      await updateFunnelColumn(editingColumn.id, data);
    } else {
      await createFunnelColumn(data);
    }
  }, [editingColumn, updateFunnelColumn, createFunnelColumn]);

  const handleColumnDelete = useCallback(async () => {
    if (editingColumn && !editingColumn.isDefault) {
      await deleteFunnelColumn(editingColumn.id);
    }
  }, [editingColumn, deleteFunnelColumn]);

  // Convert funnelColumns to the format KanbanBoard expects
  const kanbanColumns = funnelColumns.map(col => ({
    id: col.id,
    label: col.label,
    color: col.color,
    isDefault: col.isDefault,
  }));

  const leadsInEditingColumn = editingColumn
    ? (leadsByStage[editingColumn.id]?.length ?? 0)
    : 0;

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
          columns={kanbanColumns}
          items={leadsByStage}
          onMoveItem={moveLead}
          renderCard={(lead) => <LeadCard lead={lead} />}
          onCardClick={(lead) => setSelectedLeadId(lead.id)}
          onChangeOrder={(items) => reorderLeads(Object.values(items).flat())}
          onAddColumn={canEditAll ? handleAddColumn : undefined}
          onEditColumn={canEditAll ? handleEditColumn : undefined}
          onDeleteColumn={canEditAll ? handleDeleteColumn : undefined}
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

      {/* Column Manager Dialog (admin only) */}
      {canEditAll && (
        <ColumnManagerDialog
          open={columnDialogOpen}
          onOpenChange={setColumnDialogOpen}
          column={editingColumn}
          onSave={handleColumnSave}
          onDelete={editingColumn && !editingColumn.isDefault ? handleColumnDelete : undefined}
          leadsInColumn={leadsInEditingColumn}
        />
      )}
    </div>
  );
}

import { useState, useCallback, useMemo } from 'react';
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
import { PageHeader } from '@/shared/components/ui/PageHeader';
import type { Lead, FunnelColumn } from '@/shared/types/models';

export function CrmKanban() {
  const { leads, leadsByStage, moveLead } = useLeads();
  const { funnelColumns, reorderLeads, createFunnelColumn, updateFunnelColumn, deleteFunnelColumn } = useStore();
  const { canEditAll } = usePermissions();

  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [view, setView] = useState<ViewType>('kanban');
  const [search, setSearch] = useState('');

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

  // Search filtering
  const filteredLeads = useMemo(() => {
    if (!search) return leads;
    const q = search.toLowerCase();
    return leads.filter(l =>
      l.name.toLowerCase().includes(q) ||
      l.contact?.toLowerCase().includes(q)
    );
  }, [leads, search]);

  const filteredLeadsByStage = useMemo(() => {
    if (!search) return leadsByStage;
    const q = search.toLowerCase();
    return Object.fromEntries(
      Object.entries(leadsByStage).map(([stage, stageLeads]) => [
        stage,
        stageLeads.filter(l =>
          l.name.toLowerCase().includes(q) ||
          l.contact?.toLowerCase().includes(q)
        ),
      ])
    );
  }, [leadsByStage, search]);

  const n = filteredLeads.length;

  return (
    <div className="animate-fade-in flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Utility bar */}
      <div className="flex-shrink-0">
        <PageHeader
          searchQuery={search}
          onSearchChange={setSearch}
          searchPlaceholder={search ? `${n} lead${n !== 1 ? 's' : ''} encontrado${n !== 1 ? 's' : ''}` : `Buscar entre ${leads.length} leads...`}
          actions={
            <>
              <ViewToggle view={view} onChange={setView} views={['kanban', 'list']} />
              <Button onClick={() => setCreateOpen(true)} size="sm">
                <Plus className="w-4 h-4" />
                Novo Lead
              </Button>
            </>
          }
        />
      </div>

      {/* Content: Main + Detail Panel side by side */}
      <div className="flex flex-1 min-h-0 gap-4">
        {/* Main content — container with rounded corners */}
        <div className="flex-1 min-w-0 overflow-hidden h-full rounded-xl bg-zinc-50/50 dark:bg-zinc-800/20 border border-zinc-200/60 dark:border-zinc-700/40">
          {view === 'kanban' ? (
            <KanbanBoard<Lead>
              columns={kanbanColumns}
              items={filteredLeadsByStage}
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
              leads={filteredLeads}
              onLeadClick={(lead) => setSelectedLeadId(lead.id)}
            />
          )}
        </div>

        {/* Detail Side Panel — inline, beside content */}
        <LeadDetailDrawer
          lead={selectedLead}
          onClose={() => setSelectedLeadId(null)}
        />
      </div>

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

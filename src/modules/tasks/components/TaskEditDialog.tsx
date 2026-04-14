import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/Dialog';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { Button } from '@/shared/components/ui/Button';
import { Input, Textarea } from '@/shared/components/ui/Input';
import { DatePicker } from '@/shared/components/ui/DatePicker';
import { Select, SelectItem } from '@/shared/components/ui/Select';
import { MultiUserSelect } from '@/shared/components/ui/MultiUserSelect';
import { useStore } from '@/shared/lib/store';
import type { Task, TaskType, TaskPriority } from '@/shared/types/models';
import { Trash2 } from 'lucide-react';

interface TaskEditDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskEditDialog({ task, open, onOpenChange }: TaskEditDialogProps) {
  const { updateTask, deleteTask, users, projects, leads } = useStore();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<TaskType>('standalone');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [ownerIds, setOwnerIds] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [leadId, setLeadId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Seed form with task data when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setType(task.type);
      setPriority(task.priority);
      setOwnerIds(task.ownerIds ?? []);
      setDueDate(task.dueDate ? task.dueDate.split('T')[0] ?? '' : '');
      setDescription(task.description ?? '');
      setProjectId(task.projectId ?? '');
      setLeadId(task.leadId ?? '');
      setError(null);
      setShowDeleteConfirm(false);
    }
  }, [task]);

  const isValid = title.trim();

  const handleSave = async () => {
    if (!task || !isValid) return;
    setLoading(true);
    setError(null);
    try {
      await updateTask(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        priority,
        ownerIds,
        dueDate: dueDate || undefined,
        projectId: type === 'project' && projectId ? projectId : undefined,
        leadId: type === 'sales' && leadId ? leadId : undefined,
      });
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao atualizar tarefa';
      console.error('[TaskEditDialog] updateTask failed:', err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!task) return;
    setDeleting(true);
    try {
      await deleteTask(task.id);
      setShowDeleteConfirm(false);
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir tarefa';
      console.error('[TaskEditDialog] deleteTask failed:', err);
      setError(msg);
    } finally {
      setDeleting(false);
    }
  };

  if (!task) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tarefa</DialogTitle>
            <DialogDescription>Altere os campos e salve as mudanças.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Input
              label="Título"
              placeholder="Ex: Revisar proposta comercial"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select label="Tipo" value={type} onValueChange={(v) => setType(v as TaskType)} placeholder="Tipo">
                <SelectItem value="project">Projeto</SelectItem>
                <SelectItem value="sales">Vendas</SelectItem>
                <SelectItem value="standalone">Avulsa</SelectItem>
              </Select>
              <Select label="Prioridade" value={priority} onValueChange={(v) => setPriority(v as TaskPriority)} placeholder="Prioridade">
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </Select>
            </div>

            <MultiUserSelect
              label="Responsáveis"
              users={users}
              selectedIds={ownerIds}
              onChange={setOwnerIds}
              placeholder="Selecione os responsáveis..."
            />

            {type === 'project' && (
              <Select label="Projeto" value={projectId} onValueChange={setProjectId} placeholder="Selecione o projeto...">
                {projects.filter(p => p.status === 'active').map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.clientName}</SelectItem>
                ))}
              </Select>
            )}
            {type === 'sales' && (
              <Select label="Lead" value={leadId} onValueChange={setLeadId} placeholder="Selecione o lead...">
                {leads.filter(l => l.stage !== 'lost').map((l) => (
                  <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                ))}
              </Select>
            )}

            <DatePicker
              label="Prazo"
              variant="field"
              value={dueDate}
              onChange={(v) => setDueDate(v ?? '')}
              placeholder="Selecionar data"
            />

            <Textarea
              label="Descrição"
              placeholder="Detalhes opcionais..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter>
            <div className="flex items-center gap-2 flex-1">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir
              </button>
              {error && (
                <p className="text-xs text-red-500 flex-1 mr-2">{error}</p>
              )}
            </div>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!isValid || loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleConfirmDelete}
        title="Excluir tarefa"
        description={`Tem certeza que deseja excluir "${task.title}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="danger"
        loading={deleting}
      />
    </>
  );
}

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/Dialog';
import { Button } from '@/shared/components/ui/Button';
import { Input, Textarea } from '@/shared/components/ui/Input';
import { DatePicker } from '@/shared/components/ui/DatePicker';
import { Select, SelectItem } from '@/shared/components/ui/Select';
import { MultiUserSelect } from '@/shared/components/ui/MultiUserSelect';
import { useStore } from '@/shared/lib/store';
import { useAuth } from '@/app/providers/AuthProvider';
import type { TaskType, TaskPriority, TaskStatus } from '@/shared/types/models';

interface TaskCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskCreateDialog({ open, onOpenChange }: TaskCreateDialogProps) {
  const { createTask, users, projects, leads } = useStore();
  const { user: currentUser } = useAuth();

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

  // Clear error when dialog opens
  useEffect(() => { if (open) setError(null); }, [open]);

  // Effective owners: selected, or current user
  const effectiveOwnerIds = ownerIds.length > 0
    ? ownerIds
    : currentUser?.id ? [currentUser.id] : users[0]?.id ? [users[0].id] : [];

  const isValid = title.trim();

  const handleSubmit = async () => {
    if (!isValid || effectiveOwnerIds.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        status: 'todo' as TaskStatus,
        priority,
        ownerIds: effectiveOwnerIds,
        dueDate: dueDate || undefined,
        tags: [],
        projectId: type === 'project' && projectId ? projectId : undefined,
        leadId: type === 'sales' && leadId ? leadId : undefined,
      });
      // Reset on success
      setTitle('');
      setDescription('');
      setOwnerIds([]);
      setDueDate('');
      setProjectId('');
      setLeadId('');
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar tarefa';
      console.error('[TaskCreateDialog] createTask failed:', err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Tarefa</DialogTitle>
          <DialogDescription>A tarefa será criada com status "A Fazer".</DialogDescription>
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
            selectedIds={effectiveOwnerIds}
            onChange={setOwnerIds}
            placeholder="Selecione os responsáveis..."
          />

          {/* Conditional: project or lead select */}
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
          {error && (
            <p className="text-xs text-red-500 text-left flex-1 mr-2">{error}</p>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || loading || effectiveOwnerIds.length === 0}>
            {loading ? 'Criando...' : 'Criar Tarefa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

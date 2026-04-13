import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/Dialog';
import { Button } from '@/shared/components/ui/Button';
import { Input, Textarea } from '@/shared/components/ui/Input';
import { Select, SelectItem } from '@/shared/components/ui/Select';
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
  const [ownerId, setOwnerId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [leadId, setLeadId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error when dialog opens
  useEffect(() => { if (open) setError(null); }, [open]);
  // Effective owner: selected, or current user, or first user in list
  const effectiveOwnerId = ownerId || currentUser?.id || users[0]?.id || '';
  const isValid = title.trim();

  const handleSubmit = async () => {
    if (!isValid || !effectiveOwnerId) return;
    setLoading(true);
    setError(null);
    try {
      await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        status: 'todo' as TaskStatus,
        priority,
        ownerId: effectiveOwnerId,
        dueDate: dueDate || undefined,
        tags: [],
        projectId: type === 'project' && projectId ? projectId : undefined,
        leadId: type === 'sales' && leadId ? leadId : undefined,
      });
      // Reset on success
      setTitle('');
      setDescription('');
      setOwnerId('');
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

          <div className="grid grid-cols-3 gap-4">
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
            <Select label="Responsável" value={effectiveOwnerId} onValueChange={setOwnerId} placeholder="Responsável">
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name.split(' ')[0]}</SelectItem>
              ))}
            </Select>
          </div>

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

          <Input
            label="Prazo"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
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
          <Button onClick={handleSubmit} disabled={!isValid || loading || !effectiveOwnerId}>
            {loading ? 'Criando...' : 'Criar Tarefa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

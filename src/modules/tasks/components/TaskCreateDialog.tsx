import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/Dialog';
import { Button } from '@/shared/components/ui/Button';
import { Input, Textarea } from '@/shared/components/ui/Input';
import { Select, SelectItem } from '@/shared/components/ui/Select';
import { useStore } from '@/shared/lib/store';
import type { TaskType, TaskPriority, TaskStatus } from '@/shared/types/models';

interface TaskCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskCreateDialog({ open, onOpenChange }: TaskCreateDialogProps) {
  const { createTask, users, projects, leads } = useStore();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<TaskType>('standalone');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [ownerId, setOwnerId] = useState('user-1');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [leadId, setLeadId] = useState('');
  const [loading, setLoading] = useState(false);

  const isValid = title.trim();

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    await createTask({
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      status: 'todo' as TaskStatus,
      priority,
      ownerId,
      dueDate: dueDate || undefined,
      tags: [],
      projectId: type === 'project' && projectId ? projectId : undefined,
      leadId: type === 'sales' && leadId ? leadId : undefined,
    });
    setLoading(false);
    // Reset
    setTitle('');
    setDescription('');
    setDueDate('');
    setProjectId('');
    setLeadId('');
    onOpenChange(false);
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
            <Select label="Responsável" value={ownerId} onValueChange={setOwnerId} placeholder="Responsável">
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
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || loading}>
            {loading ? 'Criando...' : 'Criar Tarefa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

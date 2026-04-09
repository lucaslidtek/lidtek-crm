import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/shared/components/ui/Dialog';
import { Input } from '@/shared/components/ui/Input';
import { Select, SelectItem } from '@/shared/components/ui/Select';
import { Button } from '@/shared/components/ui/Button';
import { useStore } from '@/shared/lib/store';
import type { UserRole } from '@/shared/types/models';

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'manager', label: 'Gestor' },
  { value: 'collaborator', label: 'Colaborador' },
  { value: 'readonly', label: 'Somente Leitura' },
];

function generateInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
  }
  return (name.slice(0, 2)).toUpperCase();
}

export function AddMemberDialog({ open, onOpenChange }: AddMemberDialogProps) {
  const { createUser } = useStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  const [role, setRole] = useState<UserRole>('collaborator');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  function resetForm() {
    setName('');
    setEmail('');
    setPhone('');
    setPosition('');
    setRole('collaborator');
    setErrors({});
    setSubmitError(null);
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'E-mail inválido';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setSubmitError(null);
    try {
      await createUser({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        position: position.trim() || undefined,
        role,
        initials: generateInitials(name),
        avatarUrl: undefined,
        status: 'active',
      });
      resetForm();
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao adicionar membro';
      setSubmitError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent size="default">
        <DialogHeader>
          <DialogTitle>
            <span className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-primary" />
              </div>
              Novo Membro
            </span>
          </DialogTitle>
          <DialogDescription>
            Adicione uma pessoa à equipe para vinculá-la como responsável em projetos, tarefas e clientes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nome completo"
              placeholder="Ex: João Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              autoFocus
            />
            <Input
              label="E-mail"
              type="email"
              placeholder="joao@lidtek.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Telefone"
              placeholder="(11) 99999-9999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              label="Cargo / Função"
              placeholder="Ex: Desenvolvedor Full Stack"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            />
          </div>

          <Select
            label="Perfil de acesso"
            value={role}
            onValueChange={(v) => setRole(v as UserRole)}
          >
            {ROLE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </Select>

          {submitError && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2 text-xs text-red-700 dark:text-red-400">
              {submitError}
            </div>
          )}

          <div className="pt-1 text-xs text-foreground-muted/70">
            <p>
              <strong className="text-foreground-muted">Nota:</strong> Futuramente, este membro receberá acesso ao sistema com base no perfil selecionado.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => { resetForm(); onOpenChange(false); }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Salvando...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

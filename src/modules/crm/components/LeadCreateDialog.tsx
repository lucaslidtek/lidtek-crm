import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/shared/components/ui/Dialog';
import { Button } from '@/shared/components/ui/Button';
import { Input, Textarea } from '@/shared/components/ui/Input';
import { Select, SelectItem } from '@/shared/components/ui/Select';
import { useLeads } from '@/modules/crm/hooks/useLeads';
import { useStore } from '@/shared/lib/store';
import { useAuth } from '@/app/providers/AuthProvider';
import { LEAD_ORIGINS, BILLING_TYPES, BILLING_CYCLES } from '@/shared/lib/constants';
import type { BillingType, BillingCycle } from '@/shared/types/models';

interface LeadCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadCreateDialog({ open, onOpenChange }: LeadCreateDialogProps) {
  const { createLead } = useLeads();
  const { users, funnelColumns } = useStore();
  const { user: currentUser } = useAuth();

  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [origin, setOrigin] = useState('');
  // Use the real authenticated user's ID as the default owner
  const [ownerId, setOwnerId] = useState('');
  const [notes, setNotes] = useState('');
  const [billingType, setBillingType] = useState<BillingType | ''>('');
  const [billingCycle, setBillingCycle] = useState<BillingCycle | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error when dialog opens
  useEffect(() => { if (open) setError(null); }, [open]);

  // Resolve the effective owner: the selected value, or fall back to current user, or first user
  const effectiveOwnerId = ownerId || currentUser?.id || users[0]?.id || '';

  const isValid = name.trim() && contact.trim();

  const handleBillingTypeChange = (value: string) => {
    setBillingType(value as BillingType);
    if (value !== 'recurring') {
      setBillingCycle('');
    }
  };

  const handleSubmit = async () => {
    if (!isValid || !effectiveOwnerId) return;
    setLoading(true);
    setError(null);
    try {
      await createLead({
        name: name.trim(),
        contact: contact.trim(),
        origin: origin || 'Outros',
        ownerId: effectiveOwnerId,
        notes: notes.trim(),
        stage: funnelColumns[0]?.id || 'prospecting',
        emails: [],
        phones: [],
        ...(billingType ? { billingType: billingType as BillingType } : {}),
        ...(billingType === 'recurring' && billingCycle ? { billingCycle: billingCycle as BillingCycle } : {}),
      });
      // Reset form on success
      setName('');
      setContact('');
      setOrigin('');
      setOwnerId('');
      setNotes('');
      setBillingType('');
      setBillingCycle('');
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao criar lead';
      console.error('[LeadCreateDialog] createLead failed:', err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Lead</DialogTitle>
          <DialogDescription>O lead será criado na etapa "{funnelColumns[0]?.label || 'Prospecção'}".</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            label="Nome / Empresa"
            placeholder="Ex: Grupo Vértice"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            label="Contato"
            placeholder="Ex: carlos@empresa.com.br"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Origem"
              value={origin}
              onValueChange={setOrigin}
              placeholder="Selecione..."
            >
              {LEAD_ORIGINS.map((o) => (
                <SelectItem key={o} value={o}>{o}</SelectItem>
              ))}
            </Select>
            <Select
              label="Responsável"
              value={effectiveOwnerId}
              onValueChange={setOwnerId}
              placeholder="Selecione..."
            >
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Tipo de Cobrança"
              value={billingType}
              onValueChange={handleBillingTypeChange}
              placeholder="Selecione..."
            >
              {BILLING_TYPES.map((bt) => (
                <SelectItem key={bt.id} value={bt.id}>{bt.label}</SelectItem>
              ))}
            </Select>
            {billingType === 'recurring' && (
              <Select
                label="Recorrência"
                value={billingCycle}
                onValueChange={(v) => setBillingCycle(v as BillingCycle)}
                placeholder="Selecione..."
              >
                {BILLING_CYCLES.map((bc) => (
                  <SelectItem key={bc.id} value={bc.id}>{bc.label}</SelectItem>
                ))}
              </Select>
            )}
          </div>
          <Textarea
            label="Observações"
            placeholder="Detalhes sobre o lead..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
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
            {loading ? 'Criando...' : 'Criar Lead'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

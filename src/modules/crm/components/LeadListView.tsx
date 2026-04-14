import { useState, useMemo } from 'react';
import { useStore } from '@/shared/lib/store';
import type { Lead } from '@/shared/types/models';
import { Badge } from '@/shared/components/ui/Badge';
import { BILLING_TYPES, BILLING_CYCLES, getStageLabel, getStageColor } from '@/shared/lib/constants';
import { Calendar, Building2, Phone, Repeat, Zap, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { cn } from '@/shared/utils/cn';

type SortKey = 'name' | 'contact' | 'stage' | 'estimatedValue' | 'billingType' | 'nextContactDate' | 'owner';
type SortDir = 'asc' | 'desc';

interface LeadListViewProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
}

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'name', label: 'Empresa / Lead' },
  { key: 'contact', label: 'Contato' },
  { key: 'stage', label: 'Estágio' },
  { key: 'estimatedValue', label: 'Valor Estimado' },
  { key: 'billingType', label: 'Cobrança' },
  { key: 'nextContactDate', label: 'Próximo Contato' },
  { key: 'owner', label: 'Responsável' },
];

export function LeadListView({ leads, onLeadClick }: LeadListViewProps) {
  const { getUserById, funnelColumns } = useStore();

  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedLeads = useMemo(() => {
    if (!sortKey) return leads;

    return [...leads].sort((a, b) => {
      let aVal: string | number | null = null;
      let bVal: string | number | null = null;

      switch (sortKey) {
        case 'name':
          aVal = a.name?.toLowerCase() ?? '';
          bVal = b.name?.toLowerCase() ?? '';
          break;
        case 'contact':
          aVal = a.contact?.toLowerCase() ?? '';
          bVal = b.contact?.toLowerCase() ?? '';
          break;
        case 'stage':
          aVal = getStageLabel(funnelColumns, a.stage)?.toLowerCase() ?? '';
          bVal = getStageLabel(funnelColumns, b.stage)?.toLowerCase() ?? '';
          break;
        case 'estimatedValue':
          aVal = a.estimatedValue ?? -Infinity;
          bVal = b.estimatedValue ?? -Infinity;
          break;
        case 'billingType':
          aVal = a.billingType ?? '';
          bVal = b.billingType ?? '';
          break;
        case 'nextContactDate':
          aVal = a.nextContactDate ? new Date(a.nextContactDate).getTime() : -Infinity;
          bVal = b.nextContactDate ? new Date(b.nextContactDate).getTime() : -Infinity;
          break;
        case 'owner': {
          const ownerA = getUserById(a.ownerId);
          const ownerB = getUserById(b.ownerId);
          aVal = ownerA?.name?.toLowerCase() ?? '';
          bVal = ownerB?.name?.toLowerCase() ?? '';
          break;
        }
      }

      if (aVal === bVal) return 0;
      if (aVal === '' || aVal === -Infinity) return 1;
      if (bVal === '' || bVal === -Infinity) return -1;

      const cmp = aVal < bVal ? -1 : 1;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [leads, sortKey, sortDir, funnelColumns, getUserById]);

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  const SortIcon = ({ colKey }: { colKey: SortKey }) => {
    if (sortKey !== colKey) {
      return <ArrowUpDown className="w-3 h-3 opacity-0 group-hover/th:opacity-50 transition-opacity" />;
    }
    return sortDir === 'asc'
      ? <ArrowUp className="w-3 h-3 text-primary" />
      : <ArrowDown className="w-3 h-3 text-primary" />;
  };

  return (
    <div className="glass rounded-xl overflow-hidden animate-fade-in">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-border-subtle bg-black/5 dark:bg-white/5 uppercase tracking-wider text-[10px] font-semibold text-foreground-muted">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={cn(
                    'px-6 py-4 cursor-pointer select-none group/th transition-colors hover:text-foreground',
                    sortKey === col.key && 'text-primary',
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    <SortIcon colKey={col.key} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {sortedLeads.map((lead) => {
              const owner = getUserById(lead.ownerId);
              const stageColor = getStageColor(funnelColumns, lead.stage);
              const stageLabel = getStageLabel(funnelColumns, lead.stage);
              const isOverdue = lead.nextContactDate && new Date(lead.nextContactDate) < new Date();

              const billingLabel = lead.billingType ? getStageLabel(BILLING_TYPES, lead.billingType) : null;
              const cycleLabel = lead.billingType === 'recurring' && lead.billingCycle
                ? getStageLabel(BILLING_CYCLES, lead.billingCycle)
                : null;

              return (
                <tr
                  key={lead.id}
                  onClick={() => onLeadClick(lead)}
                  className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center flex-shrink-0 text-foreground-muted group-hover:text-primary transition-colors">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">{lead.name}</p>
                        <p className="text-[11px] text-foreground-muted">{lead.solutionType ?? 'Sem solução definida'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-foreground-muted">
                      <Phone className="w-3.5 h-3.5" />
                      <span className="text-xs">{lead.contact}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge color={stageColor}>{stageLabel}</Badge>
                  </td>
                  <td className="px-6 py-4 text-foreground font-medium">
                    {lead.estimatedValue ? formatCurrency(lead.estimatedValue) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {billingLabel ? (
                      <div className="flex items-center gap-1.5">
                        {lead.billingType === 'recurring' ? (
                          <Repeat className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Zap className="w-3 h-3 text-blue-500" />
                        )}
                        <span className={cn(
                          'text-xs font-medium',
                          lead.billingType === 'recurring' ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400',
                        )}>
                          {billingLabel}{cycleLabel ? ` · ${cycleLabel}` : ''}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-foreground-muted/50">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {lead.nextContactDate ? (
                      <div className={cn(
                        'flex items-center gap-1.5 text-xs font-medium',
                        isOverdue ? 'text-destructive' : 'text-foreground-muted'
                      )}>
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(lead.nextContactDate).toLocaleDateString('pt-BR')}
                      </div>
                    ) : (
                      <span className="text-xs text-foreground-muted/50">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                        {owner?.initials ?? '?'}
                      </div>
                      <span className="text-xs text-foreground-muted">{owner?.name?.split(' ')[0]}</span>
                    </div>
                  </td>
                </tr>
              );
            })}

            {leads.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-sm text-foreground-muted">
                  Nenhum lead encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

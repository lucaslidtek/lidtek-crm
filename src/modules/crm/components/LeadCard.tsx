import { Calendar, Repeat, Zap } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import type { Lead } from '@/shared/types/models';
import { useStore } from '@/shared/lib/store';
import { BILLING_TYPES, BILLING_CYCLES, getStageLabel } from '@/shared/lib/constants';

interface LeadCardProps {
  lead: Lead;
}

export function LeadCard({ lead }: LeadCardProps) {
  const { getUserById } = useStore();
  const owner = getUserById(lead.ownerId);

  const isOverdue = lead.nextContactDate && new Date(lead.nextContactDate) < new Date();
  const formattedValue = lead.estimatedValue
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(lead.estimatedValue)
    : null;

  const billingLabel = lead.billingType
    ? getStageLabel(BILLING_TYPES, lead.billingType)
    : null;
  const cycleLabel = lead.billingType === 'recurring' && lead.billingCycle
    ? getStageLabel(BILLING_CYCLES, lead.billingCycle)
    : null;

  return (
    <div className={cn('space-y-3', isOverdue && 'border-l-[3px] border-destructive -ml-4 pl-[13px]')}>
      {/* Name */}
      <h4 className="font-[family-name:var(--font-display)] text-sm font-semibold text-foreground leading-tight truncate">
        {lead.name}
      </h4>

      {/* Contact */}
      <p className="text-xs text-foreground-muted truncate">
        {lead.contact}
      </p>

      {/* Value + Billing */}
      {formattedValue && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-primary">
            {formattedValue}
          </p>
          {billingLabel && (
            <div className="flex items-center gap-1">
              {lead.billingType === 'recurring' ? (
                <Repeat className="w-2.5 h-2.5 text-emerald-500" />
              ) : (
                <Zap className="w-2.5 h-2.5 text-blue-500" />
              )}
              <span className={cn(
                'text-[9px] font-semibold uppercase tracking-wider',
                lead.billingType === 'recurring' ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400',
              )}>
                {billingLabel}{cycleLabel ? ` · ${cycleLabel}` : ''}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        {/* Owner */}
        {owner && (
          <div className="relative" title={owner.name}>
            <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center cursor-default">
              {owner.avatarUrl ? (
                <img src={owner.avatarUrl} className="w-6 h-6 rounded-full object-cover" alt="" />
              ) : (
                <span className="text-[9px] font-bold text-primary">{owner.initials}</span>
              )}
            </div>
          </div>
        )}

        {/* Next Contact */}
        {lead.nextContactDate && (
          <div className={cn(
            'flex items-center gap-1 text-[10px]',
            isOverdue ? 'text-destructive font-semibold' : 'text-foreground-muted',
          )}>
            <Calendar className="w-3 h-3" />
            {new Date(lead.nextContactDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
          </div>
        )}
      </div>
    </div>
  );
}

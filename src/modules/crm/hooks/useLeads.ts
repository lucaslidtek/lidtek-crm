import { useMemo, useCallback } from 'react';
import { useStore } from '@/shared/lib/store';
import type { Lead, FunnelStage } from '@/shared/types/models';

export function useLeads() {
  const { leads, funnelColumns, moveLeadStage, createLead, updateLead, deleteLead, getUserById } = useStore();

  const leadsByStage = useMemo(() => {
    const grouped: Record<string, Lead[]> = {};
    for (const col of funnelColumns) {
      grouped[col.id] = [];
    }
    for (const lead of leads) {
      if (grouped[lead.stage]) {
        grouped[lead.stage]!.push(lead);
      } else {
        // Lead has a stage that no longer exists — put in first column
        const firstCol = funnelColumns[0];
        if (firstCol) {
          grouped[firstCol.id]?.push(lead);
        }
      }
    }
    return grouped;
  }, [leads, funnelColumns]);

  const moveLead = useCallback(
    (leadId: string, _fromStage: string, toStage: string) => {
      moveLeadStage(leadId, toStage as FunnelStage);
    },
    [moveLeadStage],
  );

  return {
    leads,
    leadsByStage,
    moveLead,
    createLead,
    updateLead,
    deleteLead,
    getUserById,
  };
}

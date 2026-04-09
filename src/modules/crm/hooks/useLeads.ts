import { useMemo, useCallback } from 'react';
import { useStore } from '@/shared/lib/store';
import type { Lead, FunnelStage } from '@/shared/types/models';
import { FUNNEL_STAGES } from '@/shared/lib/constants';

export function useLeads() {
  const { leads, moveLeadStage, createLead, updateLead, deleteLead, getUserById } = useStore();

  const leadsByStage = useMemo(() => {
    const grouped: Record<string, Lead[]> = {};
    for (const stage of FUNNEL_STAGES) {
      grouped[stage.id] = [];
    }
    for (const lead of leads) {
      if (grouped[lead.stage]) {
        grouped[lead.stage]!.push(lead);
      }
    }
    return grouped;
  }, [leads]);

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

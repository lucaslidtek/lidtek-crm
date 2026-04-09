# Issue 005 — Funil de Vendas / CRM (M1)

**Módulo:** M1 (CRM)
**Prioridade:** Alta
**Dependências:** 003, 004

## Descrição

Implementar a tela principal do CRM com Kanban funcional de 8 etapas (Prospecção → Contrato Assinado + Perdido). Inclui card customizado de lead, drawer de detalhes com timeline de interações, e modal de criação de novo lead. Drag-and-drop para mover leads entre etapas.

## Arquivos

- `[NEW]` `src/modules/crm/pages/CrmKanban.tsx` — instancia KanbanBoard com 8 etapas do funil
- `[NEW]` `src/modules/crm/components/LeadCard.tsx` — nome, contato, responsável, valor, próximo contato, badge de etapa
- `[NEW]` `src/modules/crm/components/LeadDetailDrawer.tsx` — drawer lateral com dados completos + timeline + tarefas
- `[NEW]` `src/modules/crm/components/LeadCreateDialog.tsx` — modal de criação (nome, contato, origem, responsável)
- `[NEW]` `src/modules/crm/hooks/useLeads.ts` — hook consumindo mockApi.leads
- `[MODIFY]` `src/app/Router.tsx` — substituir placeholder CRM pela página real

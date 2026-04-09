# Plan 005 — Funil de Vendas / CRM (M1)

## Descrição
Tela principal do CRM com Kanban de 8 etapas. Cada lead é um card arrastável. Drawer lateral para detalhes + histórico. Modal para criar novo lead.

## Módulo
M1 (CRM) — F01, F02

## Arquivos

#### [NEW] `src/modules/crm/pages/CrmKanban.tsx`
- Instancia `KanbanBoard` com `FUNNEL_STAGES` como colunas
- Barra de ação no topo: título + botão "Novo Lead"
- Agrupa leads por `stage`
- `onMoveItem` → chama `api.leads.updateStage()`
- Click no card → abre `LeadDetailDrawer`

#### [NEW] `src/modules/crm/components/LeadCard.tsx`
- Conteúdo dentro de `KanbanCard`:
  - **Nome/empresa** (h4 bold)
  - **Contato** (text-xs, truncado)
  - **Responsável** (avatar initials + nome, text-xs)
  - **Valor estimado** (se existir, Badge ou texto formatado R$)
  - **Próximo contato** (se existir, text-xs com ícone Calendar)
  - **Alerta vencido**: se `nextContactDate < hoje` → borda left vermelha

#### [NEW] `src/modules/crm/components/LeadDetailDrawer.tsx`
- Drawer lateral direito (via Radix Dialog com posição customizada ou div animada)
- Largura: `w-96` a `w-[420px]`
- Conteúdo:
  - Header: nome/empresa, badge de etapa, botão fechar
  - Seção dados: contato, origem, responsável, valor estimado
  - Seção "Histórico" (timeline vertical): interações do lead (notas, reuniões)
  - Seção "Tarefas" (lista simples): tarefas vinculadas ao lead
  - Footer: botão "Mover para..." (select com etapas)

#### [NEW] `src/modules/crm/components/LeadCreateDialog.tsx`
- Dialog (modal) com formulário:
  - Campos: Nome/empresa (obrigatório), Contato (obrigatório), Origem (select), Responsável (select), Observações (textarea)
  - Etapa inicial: sempre "Prospecção"
  - Botões: "Cancelar", "Criar Lead"
- Validação inline dos campos obrigatórios

#### [NEW] `src/modules/crm/hooks/useLeads.ts`
- `useLeads()` → retorna `{ leads, leadsByStage, moveLead, createLead, updateLead }`
- Consome `store` / `mockApi`

#### [MODIFY] `src/app/Router.tsx`
- Substituir placeholder `CrmPage` por `CrmKanban`

## Cenários
- **Happy path:** Abrir /crm → ver 12-15 leads no Kanban → arrastar lead de "Prospecção" pra "1ª Reunião" → card move de coluna
- **Criar lead:** Clicar "Novo Lead" → preencher form → clicar "Criar" → card aparece em "Prospecção"
- **Detalhes:** Clicar num card → drawer abre → ver dados + histórico + tarefas
- **Follow-up vencido:** Lead com `nextContactDate` no passado → borda vermelha no card

## Checklist
- [ ] CrmKanban com KanbanBoard + 8 colunas
- [ ] LeadCard com dados resumidos + alerta de vencimento
- [ ] LeadDetailDrawer com timeline + tarefas
- [ ] LeadCreateDialog com validação
- [ ] useLeads hook
- [ ] Substituir placeholder no Router

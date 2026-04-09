# Plan 008 — Dashboard Básico (M4)

## Descrição
Tela inicial com cards de resumo: funil de vendas, projetos ativos, "Minhas Tarefas do Dia", e atalhos rápidos. Todo card é clicável e navega para o módulo correspondente.

## Módulo
M4 (Dashboard) — F07

## Arquivos

#### [NEW] `src/modules/dashboard/pages/Dashboard.tsx`
- Grid responsivo: 2 colunas em desktop, 1 em mobile
- Saudação: "Bom dia, Lucas" (baseado no horário e currentUser)
- Row 1: FunnelSummaryCard + ProjectsSummaryCard
- Row 2: MyTasksCard (full width)
- Row 3: QuickActions

#### [NEW] `src/modules/dashboard/components/FunnelSummaryCard.tsx`
- Card glass com:
  - Título: "Funil de Vendas"
  - Total de leads por etapa (mini barras horizontais ou lista)
  - Destaque: leads com follow-up vencido (número em vermelho)
  - Novos leads nos últimos 7 dias
  - Click → navega para `/crm`

#### [NEW] `src/modules/dashboard/components/ProjectsSummaryCard.tsx`
- Card glass com:
  - Título: "Projetos Ativos"
  - Total: recorrentes (badge emerald) + únicos (badge blue)
  - Projetos com entrega nos próximos 7 dias (lista)
  - Click → navega para `/projects`

#### [NEW] `src/modules/dashboard/components/MyTasksCard.tsx`
- Card glass com:
  - Título: "Minhas Tarefas do Dia"
  - Lista de tarefas: vencimento hoje + atrasadas, do `currentUser`
  - Cada item: título, prioridade badge, prazo
  - Checkbox visual para marcar como concluída
  - Click no item → navega para `/tasks`

#### [NEW] `src/modules/dashboard/components/QuickActions.tsx`
- Row de 3 botões:
  - "Novo Lead" → abre LeadCreateDialog
  - "Nova Tarefa" → abre TaskCreateDialog
  - "Nova Sprint" → abre SprintDialog
- Ícones Lucide: `UserPlus`, `ListPlus`, `Play`

#### [MODIFY] `src/app/Router.tsx`
- Substituir placeholder `DashboardPage` por `Dashboard`

## Design
- Cards com glassmorphism, hover translate-y
- Números grandes e bold para métricas
- Cores semânticas para destaques (vermelho para vencidos, emerald para projetos recorrentes)
- Saudação com `font-display` grande

## Cenários
- **Happy path:** Abrir `/` → ver resumo do funil, projetos, tarefas do dia
- **Navegação:** Clicar num card → navega pro módulo correspondente
- **Atalho:** Clicar "Novo Lead" → abre modal de criação (reusa componente do M1)

## Checklist
- [ ] Dashboard page com grid responsivo
- [ ] FunnelSummaryCard com dados do CRM
- [ ] ProjectsSummaryCard com dados de projetos
- [ ] MyTasksCard com tarefas do dia do usuário
- [ ] QuickActions com 3 atalhos
- [ ] Substituir placeholder no Router

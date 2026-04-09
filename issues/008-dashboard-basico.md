# Issue 008 — Dashboard Básico (M4)

**Módulo:** M4 (Dashboard)
**Prioridade:** Média
**Dependências:** 005, 006, 007

## Descrição

Implementar dashboard inicial com cards de resumo: contagem do funil de vendas, projetos ativos por tipo, "Minhas Tarefas do Dia", e atalhos rápidos (novo lead, nova tarefa). Cada card é clicável e navega para o módulo correspondente.

## Arquivos

- `[NEW]` `src/modules/dashboard/pages/Dashboard.tsx` — grid de cards de resumo
- `[NEW]` `src/modules/dashboard/components/FunnelSummaryCard.tsx` — resumo do funil de vendas
- `[NEW]` `src/modules/dashboard/components/ProjectsSummaryCard.tsx` — resumo de projetos ativos
- `[NEW]` `src/modules/dashboard/components/MyTasksCard.tsx` — tarefas do dia do usuário logado
- `[NEW]` `src/modules/dashboard/components/QuickActions.tsx` — atalhos rápidos
- `[MODIFY]` `src/app/Router.tsx` — substituir placeholder Dashboard

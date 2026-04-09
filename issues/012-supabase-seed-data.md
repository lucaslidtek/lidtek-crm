# Issue 012 — Seed de Dados Demo

**Prioridade:** Alta
**Dependências:** 011
**Escopo:** Database

## Descrição

Converter todos os dados mock do projeto (`mockLeads.ts`, `mockProjects.ts`, `mockTasks.ts`, `mockUsers.ts`) para INSERTs SQL com UUIDs fixos. Isso permite ter dados de demonstração no Supabase desde o início. Os IDs antigos (`lead-1`, `proj-1`) serão mapeados para UUIDs determinísticos.

## Entregáveis

- `supabase/seed.sql` → INSERTs para todas as tabelas (profiles, leads, interactions, projects, sprints, tasks)
- Mapeamento de IDs documentado no topo do arquivo

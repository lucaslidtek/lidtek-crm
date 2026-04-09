-- ============================================
-- DISABLE RLS — Fase inicial de desenvolvimento
-- Executar DEPOIS do schema.sql
-- ============================================

alter table profiles disable row level security;
alter table leads disable row level security;
alter table interactions disable row level security;
alter table projects disable row level security;
alter table sprints disable row level security;
alter table tasks disable row level security;

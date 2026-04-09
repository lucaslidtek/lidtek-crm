# Issue 011 — Criação do Schema no Supabase

**Prioridade:** Alta (Bloqueante)
**Dependências:** 010
**Escopo:** Database

## Descrição

Gerar o script SQL completo com as 6 tabelas (`profiles`, `leads`, `interactions`, `projects`, `sprints`, `tasks`), FKs, defaults e trigger de auto-criação de profile no primeiro login. O script será executado no SQL Editor do Supabase Dashboard. RLS desabilitado nesta fase.

## Entregáveis

- `supabase/schema.sql` → DDL completa (CREATE TABLE, ALTER TABLE, triggers)
- `supabase/disable_rls.sql` → desabilitar RLS em todas as tabelas
- Execução do SQL no Supabase Dashboard (validação manual)

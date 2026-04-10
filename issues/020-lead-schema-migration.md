# 020 — Migration: Novos campos do Lead

## Descrição
Adicionar colunas na tabela `leads` do Supabase para suportar dados completos de empresa: CNPJ, múltiplos emails/telefones (arrays), logo, website, razão social e endereço.

## Módulo
M1 — Funil de Vendas (CRM) / F02 — Cadastro e edição de leads

## Prioridade
**Alta** — bloqueia todas as outras issues desta feature

## Dependências
Nenhuma

## Escopo
- **SQL Migration** no Supabase Dashboard (SQL Editor)
- 7 colunas novas: `cnpj`, `emails`, `phones`, `logo_url`, `website`, `razao_social`, `endereco`
- Arrays (`text[]`) para emails e phones

## SQL
```sql
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS cnpj text,
  ADD COLUMN IF NOT EXISTS emails text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS phones text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS razao_social text,
  ADD COLUMN IF NOT EXISTS endereco text;
```

## Checklist
- [ ] Executar SQL no Supabase Dashboard
- [ ] Verificar colunas criadas no Table Editor

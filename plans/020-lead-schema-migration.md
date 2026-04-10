# Plan 020 — Migration: Novos campos do Lead

## Descrição
Adicionar 7 colunas à tabela `leads` no Supabase para suportar ficha completa de empresa CRM.

## Módulo
M1 — Funil de Vendas (CRM) / F02 — Cadastro e edição de leads

## Arquivos
| Ação | Arquivo | O que muda |
|------|---------|------------|
| — | SQL no Supabase Dashboard | 7 colunas novas |

## Dados

### Novas colunas na tabela `leads`

| Coluna | Tipo | Default | Nullable | Justificativa |
|--------|------|---------|----------|---------------|
| `cnpj` | `text` | `null` | ✅ | Nem todo lead tem CNPJ (PF, internacional) |
| `emails` | `text[]` | `'{}'` | ❌ | Array vazio como default — evita null checks |
| `phones` | `text[]` | `'{}'` | ❌ | Array vazio como default — evita null checks |
| `logo_url` | `text` | `null` | ✅ | URL da logo (Supabase Storage ou externa) |
| `website` | `text` | `null` | ✅ | Site da empresa |
| `razao_social` | `text` | `null` | ✅ | Razão social pode não ser informada |
| `endereco` | `text` | `null` | ✅ | Endereço completo em texto livre |

### SQL Completo

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

### Migração de dados existentes

O campo `phone` (singular) existente continua no schema. Os novos `phones[]` serão array separado para telefones adicionais. Na UI, se `phone` existe e `phones` está vazio, exibiremos `phone` como primeiro item da lista.

## Cenários

| Cenário | Resultado Esperado |
|---------|-------------------|
| Lead existente sem dados novos | Campos null/array vazio, UI mostra "Adicionar..." |
| Lead novo com CNPJ | Salva e exibe formatado |
| Lead com 3 emails | Array com 3 strings, UI mostra todos |
| Lead com 2 phones + phone antigo | phone antigo = #1, array = extras |

## Checklist
- [ ] Executar SQL no Supabase SQL Editor
- [ ] Verificar colunas no Table Editor
- [ ] Confirmar que leads existentes não foram afetados

# 021 — Types & API: Novos campos do Lead

## Descrição
Atualizar o model `Lead` (TypeScript) e a camada Supabase API para mapear os 7 novos campos: cnpj, emails, phones, logoUrl, website, razaoSocial, endereco.

## Módulo
M1 — Funil de Vendas (CRM) / F02

## Prioridade
**Alta** — bloqueia a issue de UI (022)

## Dependências
- `020-lead-schema-migration` (colunas devem existir no banco)

## Arquivos
| Ação | Arquivo |
|------|---------|
| MODIFY | `src/shared/types/models.ts` — adicionar campos ao `interface Lead` |
| MODIFY | `src/shared/lib/supabaseApi.ts` — `rowToLead()`, `buildLeadUpdate()`, `leads.create()` |

## Checklist
- [ ] Atualizar `interface Lead` em `models.ts`
- [ ] Atualizar `rowToLead()` com mapeamento dos novos campos
- [ ] Atualizar `buildLeadUpdate()` com novos campos
- [ ] Atualizar `leads.create()` para enviar novos campos
- [ ] Verificar que `updateLead` no store já propaga corretamente (genérico via `Partial<Lead>`)

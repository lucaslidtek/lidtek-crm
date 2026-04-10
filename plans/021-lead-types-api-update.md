# Plan 021 — Types & API: Novos campos do Lead

## Descrição
Atualizar modelo TypeScript `Lead` e camada Supabase API para mapear os 7 novos campos do banco.

## Módulo
M1 — Funil de Vendas (CRM) / F02

## Arquivos

| Ação | Arquivo | O que muda |
|------|---------|------------|
| MODIFY | `src/shared/types/models.ts` | +7 campos no `interface Lead` |
| MODIFY | `src/shared/lib/supabaseApi.ts` | `rowToLead()` + `buildLeadUpdate()` + `leads.create()` |

## Dados

### Campos adicionados ao `interface Lead`

```typescript
// Após `lossReason` e antes de `interactions`:
cnpj?: string;
emails: string[];          // default [] — NUNCA undefined
phones: string[];          // default [] — NUNCA undefined  
logoUrl?: string;
website?: string;
razaoSocial?: string;
endereco?: string;
```

> **Regra:** `emails` e `phones` são arrays obrigatórios (nunca `undefined`), defaulting para `[]`. Isso simplifica a UI — sem null checks.

### Mudanças em `rowToLead()`

```typescript
// Novas linhas no mapper:
cnpj: row.cnpj ?? undefined,
emails: row.emails ?? [],
phones: row.phones ?? [],
logoUrl: row.logo_url ?? undefined,
website: row.website ?? undefined,
razaoSocial: row.razao_social ?? undefined,
endereco: row.endereco ?? undefined,
```

### Mudanças em `buildLeadUpdate()`

```typescript
// Novas linhas no builder:
if (updates.cnpj !== undefined) payload.cnpj = updates.cnpj;
if (updates.emails !== undefined) payload.emails = updates.emails;
if (updates.phones !== undefined) payload.phones = updates.phones;
if (updates.logoUrl !== undefined) payload.logo_url = updates.logoUrl;
if (updates.website !== undefined) payload.website = updates.website;
if (updates.razaoSocial !== undefined) payload.razao_social = updates.razaoSocial;
if (updates.endereco !== undefined) payload.endereco = updates.endereco;
```

### Mudanças em `leads.create()`

```typescript
// Novas linhas no insert:
cnpj: input.cnpj,
emails: input.emails ?? [],
phones: input.phones ?? [],
logo_url: input.logoUrl,
website: input.website,
razao_social: input.razaoSocial,
endereco: input.endereco,
```

## Cenários

| Cenário | Resultado |
|---------|-----------|
| `updateLead(id, { cnpj: '05.776.652/0001-36' })` | Salva CNPJ, refresh via store |
| `updateLead(id, { emails: ['a@b.com', 'c@d.com'] })` | Salva array de 2 emails |
| `updateLead(id, { phones: [] })` | Limpa todos os phones extras |
| `Lead` carregado sem dados novos no banco | `emails: []`, `phones: []`, demais `undefined` |

## Design
Nenhuma mudança visual nesta issue — apenas dados.

## Checklist
- [ ] Adicionar 7 campos ao `interface Lead` em `models.ts`
- [ ] Atualizar `rowToLead()` em `supabaseApi.ts`
- [ ] Atualizar `buildLeadUpdate()` em `supabaseApi.ts`
- [ ] Atualizar `leads.create()` em `supabaseApi.ts`
- [ ] Verificar que `handleFieldSave` no LeadDetailDrawer funciona para campos simples
- [ ] Verificar TypeScript sem erros (`npm run build`)

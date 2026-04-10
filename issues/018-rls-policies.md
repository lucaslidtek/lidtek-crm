# Issue 018 — RLS: Políticas de segurança por role e owner

## Descrição
O banco está com RLS desabilitado (`UNRESTRICTED`). Isso funciona para dev mas é tecnicamente inseguro. Precisamos criar políticas que:
- **Permitam leitura de tudo** para qualquer usuário autenticado (todos veem leads, projetos, tarefas)
- **Permitam escrita ampla** para `admin` e `gestor`
- **Restrinjam escrita** de `colaborador` e `leitura` apenas a registros onde são `owner_id`

## Módulo
Infraestrutura — Supabase/PostgreSQL

## Prioridade
🟡 **IMPORTANTE** — Necessário para segurança, mas não bloqueia funcionalidade atual (RLS desativado já funciona para todos)

## Dependências
- Depende de `017` (role real no AuthProvider) — as policies precisam do role real no JWT

## Arquivos Impactados
- `[NEW]` `supabase/rls_policies.sql` — Script de policies a ser executado no Supabase Dashboard
- `[MODIFY]` `supabase/disable_rls.sql` — Renomear/substituir por enable + policies

## Modelo de Permissões

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | Todos autenticados | Trigger/service role | Próprio ou admin | Somente admin |
| `leads` | Todos autenticados | admin, gestor, colaborador | admin, gestor OU owner_id | admin, gestor |
| `interactions` | Todos autenticados | admin, gestor, colaborador | admin, gestor OU user_id | admin, gestor |
| `projects` | Todos autenticados | admin, gestor | admin, gestor OU owner_id | admin, gestor |
| `sprints` | Todos autenticados | admin, gestor | admin, gestor OU project owner | admin, gestor |
| `tasks` | Todos autenticados | Todos | admin, gestor OU owner_id | admin, gestor |

## Implementação
As policies usam `auth.uid()` para `owner_id` checks, e buscam o `role` da tabela `profiles` para checagem de permissões elevadas.

## Edge Cases
- `service_role` key (usada em triggers) deve ter acesso irrestrito
- Trigger `handle_new_user` usa `SECURITY DEFINER` — não é afetado pelas policies
- Durante dev: manter um script fácil para re-executar policies

## Critério de Aceite
- [ ] Usuário autenticado consegue ler todos os leads/projetos/tarefas
- [ ] Admin consegue criar, editar e deletar qualquer registro
- [ ] Colaborador consegue editar task onde é `owner_id`; NÃO consegue editar task de outro
- [ ] Colaborador NÃO consegue deletar leads
- [ ] Script pode ser re-executado sem quebrar dados existentes

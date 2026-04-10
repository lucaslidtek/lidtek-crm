# Issue 016 — Fix: Store zera dados durante token refresh transitório

## Descrição
O `StoreProvider` escuta `isAuthenticated` do `AuthProvider`. Quando o Supabase faz o refresh automático do JWT (que expira a cada 1h), o SDK pode emitir brevemente um estado `SIGNED_OUT` antes de completar o `TOKEN_REFRESHED`. Isso faz o `useEffect` da store cair no `else → _cache = null, setLeads([])...` — zerando todos os dados da tela do usuário logado.

## Módulo
Infraestrutura transversal — afeta M1, M2, M3, M4 simultaneamente.

## Prioridade
🔴 **CRÍTICA** — É a causa raiz do bug "dados somem".

## Dependências
Nenhuma. Esta issue pode ser executada de forma isolada.

## Arquivos Impactados
- `[MODIFY]` `src/shared/lib/store.tsx`
- `[MODIFY]` `src/app/providers/AuthProvider.tsx`

## O que muda

### `AuthProvider.tsx`
- Adicionar flag `isRefreshing` ao contexto: `true` enquanto um `TOKEN_REFRESHED` estiver em andamento
- Não emitir `isAuthenticated = false` durante um refresh transitório — só emitir quando `SIGNED_OUT` definitivo

### `store.tsx`
- No `useEffect`, adicionar condição: **só limpar dados se `!isAuthenticated && !isLoading`** — nunca limpar enquanto auth ainda está resolvendo
- Adicionar debounce de ~500ms antes de limpar dados ao detectar logout, para absorver o "piscar" do token refresh
- Preservar `_cache` até que o logout seja confirmado como definitivo

## Edge Cases
- Usuário fecha aba e reabre: session deve ser restaurada normalmente
- Token genuinamente expirado (sem refresh): store deve limpar dados e redirecionar para login
- HMR durante token refresh: não deve disparar logout

## Critério de Aceite
- [ ] Dados NÃO desaparecem durante uso normal após 1h de sessão
- [ ] Logout manual ainda limpa dados corretamente
- [ ] HMR não provoca flash de dados vazios

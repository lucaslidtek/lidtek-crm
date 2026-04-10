# Issue 017 — Fix: Role hardcoded como 'admin' no AuthProvider

## Descrição
O `authUserToProfile()` em `AuthProvider.tsx` está com `role: 'admin'` fixo na linha 41 — todo usuário que faz login recebe `admin`, independente do valor real na coluna `role` da tabela `profiles`. Isso impede qualquer lógica de permissão futura e é uma falha de segurança (colaboradores aparecem como admins).

## Módulo
Auth & Segurança (M-Auth)

## Prioridade
🔴 **CRÍTICA** — Bloqueia toda implementação de permissões.

## Dependências
- Depende de `016` estar estável (não queremos mudanças em AuthProvider em paralelo)
- Depende de que a coluna `role` no banco tenha valores corretos (verificar)

## Arquivos Impactados
- `[MODIFY]` `src/app/providers/AuthProvider.tsx`

## O que muda

### `AuthProvider.tsx`
- `authUserToProfile()`: remover `role: 'admin'` hardcoded
- Usar `role: 'collaborator'` como fallback seguro (default menos privilegiado)
- O `loadProfile()` já busca o profile do banco com o role real — garantir que o role do banco seja aplicado sobre o fallback
- Ordem correta: JWT metadata (fallback 'collaborator') → banco (role real, sobrescreve)

## Edge Cases
- Usuário sem profile no banco ainda (primeiro login, trigger pendente): usar `'collaborator'` como fallback
- Token refresh: role não deve ser resetado para 'collaborator' se já foi carregado do banco
- Cache do localStorage: ao sair e entrar, o role do banco deve sobrescrever o cached

## Critério de Aceite
- [ ] Admin no banco → app reconhece como admin
- [ ] Colaborador no banco → app reconhece como colaborador (não admin)
- [ ] Primeiro login (sem profile ainda) → usa 'collaborator' como fallback
- [ ] `console.log(user.role)` retorna o valor real do banco, não 'admin'

# Issue 019 — Frontend: Guards de permissão por role e owner

## Descrição
Com o role real disponível (após issue 017), implementar guards no frontend que:
- Ocultam/desabilitam botões de edição/exclusão para usuários sem permissão
- Permitem a colaboradores editar registros onde são `owner_id`
- Mantêm leitura completa para todos (todos veem tudo)

## Módulo
M1 (CRM), M2 (Projetos), M3 (Tarefas) — shared/hooks

## Prioridade
🟡 **IMPORTANTE** — Necessário para o modelo de permissões correto

## Dependências
- Depende de `017` (role real) e `018` (RLS no banco)

## Arquivos Impactados
- `[NEW]` `src/shared/hooks/usePermissions.ts` — Hook central de permissões
- `[MODIFY]` Componentes de card de Lead, Project, Task (botões de editar/deletar)
- `[MODIFY]` Drawers/dialogs de edição (form fields disabled quando sem permissão)

## O que implementar

### `usePermissions.ts`
```typescript
export function usePermissions() {
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';
  const isGestor = user?.role === 'gestor';
  const canEditAll = isAdmin || isGestor;

  const canEdit = (ownerId?: string | null) =>
    canEditAll || (!!ownerId && ownerId === user?.id);

  const canDelete = () => canEditAll;
  const canCreate = () => user?.role !== 'leitura';

  return { isAdmin, isGestor, canEditAll, canEdit, canDelete, canCreate };
}
```

### Uso nos componentes
- Cards de Lead/Project/Task: `canEdit(item.ownerId)` para mostrar botão de editar
- Modal/Drawer de detalhes: campos em `disabled` quando `!canEdit(item.ownerId)`
- Botão de deletar: `canDelete()` — apenas admin/gestor

## Edge Cases
- `ownerId === null/undefined`: colaborador NÃO pode editar (precisa de owner explícito)
- Role `'leitura'`: apenas lê, nenhum botão de ação visível
- Admin vê e edita tudo, sem exceção
- Interface não deve mostrar mensagem de erro — apenas omitir os botões

## Critério de Aceite
- [ ] Admin: todos os botões visíveis em todos os registros
- [ ] Colaborador: botão de editar visível apenas nos registros onde é owner
- [ ] Colaborador: botão de deletar NUNCA visível
- [ ] Role 'leitura': nenhum botão de ação visível em lugar algum
- [ ] Visualização (kanban, lista) idêntica para todos os roles

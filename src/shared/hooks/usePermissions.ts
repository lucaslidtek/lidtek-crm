import { useAuth } from '@/app/providers/AuthProvider';

// ============================================
// usePermissions — Controle de acesso baseado em role + owner
//
// Modelo:
//   admin   → CRUD total em tudo
//   gestor  → CRUD total em tudo (exceto gerenciar usuários)
//   collaborator → SELECT (ver tudo) + editar/deletar apenas próprios (owner_id = user.id)
//   leitura → apenas SELECT
// ============================================

export function usePermissions() {
  const { user } = useAuth();

  const role = user?.role ?? 'leitura';
  const isAdmin = role === 'admin';
  const isGestor = role === 'gestor';

  /** Admin e Gestor têm acesso de escrita completo */
  const canEditAll = isAdmin || isGestor;

  /**
   * Verifica se o usuário pode editar um registro específico.
   * @param ownerId - O owner_id do registro a verificar
   * Admin/Gestor → sempre true
   * Colaborador → true apenas se for o owner
   * Leitura → sempre false
   */
  const canEdit = (ownerId?: string | null): boolean => {
    if (canEditAll) return true;
    if (role === 'collaborator' && ownerId && ownerId === user?.id) return true;
    return false;
  };

  /**
   * Verifica se o usuário pode deletar.
   * Somente admin e gestor podem deletar qualquer coisa.
   */
  const canDelete = (): boolean => canEditAll;

  /**
   * Verifica se o usuário pode criar novos registros.
   * Leitura não pode criar nada.
   */
  const canCreate = (): boolean => role !== 'leitura';

  /**
   * Verifica se o usuário pode gerenciar outros usuários.
   * Apenas admins.
   */
  const canManageUsers = (): boolean => isAdmin;

  return {
    role,
    isAdmin,
    isGestor,
    canEditAll,
    canEdit,
    canDelete,
    canCreate,
    canManageUsers,
  };
}

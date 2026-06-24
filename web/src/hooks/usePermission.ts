import { useAuthContext } from '@/contexts/AuthContext';

type PermissionLevel = 'staff' | 'public' | 'anonymous';

const RANK: Record<PermissionLevel, number> = {
  anonymous: 0,
  public: 1,
  staff: 2,
};

/**
 * Returns true if the authenticated user's role satisfies the required permission level.
 * Role hierarchy (per F03): anonymous(0) < public(1) < staff(2).
 *
 * usePermission('staff')    → true only for role='staff'
 * usePermission('public')   → true for role='public' or 'staff'
 * usePermission('anonymous')→ true for any authenticated user
 */
export const usePermission = (required: PermissionLevel): boolean => {
  const { user } = useAuthContext();
  if (!user) return required === 'anonymous' ? false : false;
  const userRank = RANK[user.role] ?? 0;
  const requiredRank = RANK[required] ?? 0;
  return userRank >= requiredRank;
};

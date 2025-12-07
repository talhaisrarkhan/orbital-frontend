'use client';

import { useAuthContext } from 'src/auth/hooks';
import { RoleBasedGuardV2, UserRole } from 'src/auth/rbac';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

export default function SuperAdminLayout({ children }: Props) {
  const { user } = useAuthContext();

  return (
    <RoleBasedGuardV2
      hasContent
      currentRole={user?.role}
      acceptRoles={[UserRole.SUPERADMIN]}
    >
      {children}
    </RoleBasedGuardV2>
  );
}

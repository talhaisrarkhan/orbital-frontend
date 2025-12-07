'use client';

import { useMemo } from 'react';

import { useAuthContext } from './use-auth-context';
import type { UserRole } from '../types/user-role';
import {
    hasRole,
    hasAnyRole,
    hasMinimumRole,
    isSuperAdmin,
    isAdmin,
    isDepartmentHead,
    isTeamLead,
    canManageUser,
    isRoleHigherThan,
} from '../utils/permissions';
import { canAccessRoute } from '../config/route-permissions';

// ----------------------------------------------------------------------

export function usePermissions() {
    const { user } = useAuthContext();

    const permissions = useMemo(() => {
        const userRole = user?.role;

        return {
            // Current user role
            role: userRole,

            // Role checks
            hasRole: (requiredRole: UserRole) => hasRole(userRole, requiredRole),
            hasAnyRole: (requiredRoles: UserRole[]) => hasAnyRole(userRole, requiredRoles),
            hasMinimumRole: (minRole: UserRole) => hasMinimumRole(userRole, minRole),
            isRoleHigherThan: (compareRole: UserRole) => isRoleHigherThan(userRole, compareRole),

            // Convenience role checks
            isSuperAdmin: isSuperAdmin(userRole),
            isAdmin: isAdmin(userRole),
            isDepartmentHead: isDepartmentHead(userRole),
            isTeamLead: isTeamLead(userRole),

            // Management permissions
            canManageUser: (targetRole: string) => canManageUser(userRole, targetRole),

            // Route permissions
            canAccessRoute: (path: string) => canAccessRoute(userRole, path),

            // User context
            companyId: user?.companyId,
            departmentId: user?.departmentId,
            teamId: user?.teamId,
        };
    }, [user]);

    return permissions;
}

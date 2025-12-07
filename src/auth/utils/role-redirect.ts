import { UserRole } from '../types/user-role';
import { paths } from 'src/routes/paths';

/**
 * Get the default home path for a specific role
 */
export function getRoleHomePath(role: string | undefined): string {
    switch (role) {
        case UserRole.SUPERADMIN:
            return '/dashboard/superadmin';
        case UserRole.ADMIN:
            return '/dashboard/admin';
        case UserRole.DEPARTMENT_HEAD:
            return '/dashboard/department';
        case UserRole.TEAM_LEAD:
            return '/dashboard/team';
        case UserRole.EMPLOYEE:
        default:
            return paths.dashboard.root;
    }
}

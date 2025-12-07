import { UserRole } from '../types/user-role';

// ----------------------------------------------------------------------
// Route Permissions Configuration
// ----------------------------------------------------------------------

/**
 * Define which roles can access which routes
 * Routes not listed here are accessible by all authenticated users
 */

export type RoutePermission = {
    path: string;
    allowedRoles: UserRole[];
    requiresAuth?: boolean;
    description?: string;
};

// ----------------------------------------------------------------------
// SuperAdmin Routes
// ----------------------------------------------------------------------

export const SUPERADMIN_ROUTES: RoutePermission[] = [
    {
        path: '/dashboard/superadmin',
        allowedRoles: [UserRole.SUPERADMIN],
        requiresAuth: true,
        description: 'SuperAdmin dashboard - platform-wide management',
    },
    {
        path: '/dashboard/companies',
        allowedRoles: [UserRole.SUPERADMIN],
        requiresAuth: true,
        description: 'Company management - create, edit, delete companies',
    },
    {
        path: '/dashboard/system-settings',
        allowedRoles: [UserRole.SUPERADMIN],
        requiresAuth: true,
        description: 'System-wide settings and configuration',
    },
    {
        path: '/dashboard/platform-analytics',
        allowedRoles: [UserRole.SUPERADMIN],
        requiresAuth: true,
        description: 'Platform-wide analytics and reporting',
    },
];

// ----------------------------------------------------------------------
// Admin (Company Admin) Routes
// ----------------------------------------------------------------------

export const ADMIN_ROUTES: RoutePermission[] = [
    {
        path: '/dashboard/admin',
        allowedRoles: [UserRole.SUPERADMIN, UserRole.ADMIN],
        requiresAuth: true,
        description: 'Company admin dashboard',
    },
    {
        path: '/dashboard/departments',
        allowedRoles: [UserRole.SUPERADMIN, UserRole.ADMIN],
        requiresAuth: true,
        description: 'Department management',
    },
    {
        path: '/dashboard/company-settings',
        allowedRoles: [UserRole.SUPERADMIN, UserRole.ADMIN],
        requiresAuth: true,
        description: 'Company settings and configuration',
    },
    {
        path: '/dashboard/user/new',
        allowedRoles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.DEPARTMENT_HEAD],
        requiresAuth: true,
        description: 'Create new users',
    },
    {
        path: '/dashboard/user/list',
        allowedRoles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.DEPARTMENT_HEAD, UserRole.TEAM_LEAD],
        requiresAuth: true,
        description: 'View user list',
    },
];

// ----------------------------------------------------------------------
// Department Head Routes
// ----------------------------------------------------------------------

export const DEPARTMENT_HEAD_ROUTES: RoutePermission[] = [
    {
        path: '/dashboard/department',
        allowedRoles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.DEPARTMENT_HEAD],
        requiresAuth: true,
        description: 'Department dashboard',
    },
    {
        path: '/dashboard/teams',
        allowedRoles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.DEPARTMENT_HEAD],
        requiresAuth: true,
        description: 'Team management within department',
    },
];

// ----------------------------------------------------------------------
// Team Lead Routes
// ----------------------------------------------------------------------

export const TEAM_LEAD_ROUTES: RoutePermission[] = [
    {
        path: '/dashboard/team',
        allowedRoles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.DEPARTMENT_HEAD, UserRole.TEAM_LEAD],
        requiresAuth: true,
        description: 'Team dashboard',
    },
    {
        path: '/dashboard/team-members',
        allowedRoles: [UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.DEPARTMENT_HEAD, UserRole.TEAM_LEAD],
        requiresAuth: true,
        description: 'Team member management',
    },
];

// ----------------------------------------------------------------------
// Employee Routes (All authenticated users)
// ----------------------------------------------------------------------

export const EMPLOYEE_ROUTES: RoutePermission[] = [
    {
        path: '/dashboard',
        allowedRoles: Object.values(UserRole),
        requiresAuth: true,
        description: 'Main dashboard',
    },
    {
        path: '/dashboard/profile',
        allowedRoles: Object.values(UserRole),
        requiresAuth: true,
        description: 'User profile',
    },
    {
        path: '/dashboard/user/account',
        allowedRoles: Object.values(UserRole),
        requiresAuth: true,
        description: 'User account settings',
    },
];

// ----------------------------------------------------------------------
// Combined Route Permissions
// ----------------------------------------------------------------------

export const ROUTE_PERMISSIONS: RoutePermission[] = [
    ...SUPERADMIN_ROUTES,
    ...ADMIN_ROUTES,
    ...DEPARTMENT_HEAD_ROUTES,
    ...TEAM_LEAD_ROUTES,
    ...EMPLOYEE_ROUTES,
];

// ----------------------------------------------------------------------
// Helper Functions
// ----------------------------------------------------------------------

/**
 * Get allowed roles for a specific route
 */
export function getAllowedRolesForRoute(path: string): UserRole[] | null {
    const permission = ROUTE_PERMISSIONS.find((p) => {
        // Exact match
        if (p.path === path) return true;

        // Check if path starts with the permission path (for nested routes)
        if (path.startsWith(p.path + '/')) return true;

        return false;
    });

    return permission?.allowedRoles || null;
}

/**
 * Check if a role can access a specific route
 */
export function canAccessRoute(userRole: UserRole | string | undefined, path: string): boolean {
    if (!userRole) return false;

    const allowedRoles = getAllowedRolesForRoute(path);

    // If no specific permissions defined, allow all authenticated users
    if (!allowedRoles) return true;

    return allowedRoles.includes(userRole as UserRole);
}

/**
 * Get all accessible routes for a specific role
 */
export function getAccessibleRoutes(userRole: UserRole): RoutePermission[] {
    return ROUTE_PERMISSIONS.filter((permission) =>
        permission.allowedRoles.includes(userRole)
    );
}

/**
 * Check if route requires authentication
 */
export function requiresAuthentication(path: string): boolean {
    const permission = ROUTE_PERMISSIONS.find((p) => p.path === path);
    return permission?.requiresAuth ?? true; // Default to requiring auth
}

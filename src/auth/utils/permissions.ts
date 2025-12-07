import { UserRole, ROLE_HIERARCHY } from '../types/user-role';

// ----------------------------------------------------------------------
// Permission Utilities
// ----------------------------------------------------------------------

/**
 * Check if a user has a specific role
 */
export function hasRole(userRole: string | undefined, requiredRole: UserRole): boolean {
    if (!userRole) return false;
    return userRole === requiredRole;
}

/**
 * Check if a user has any of the specified roles
 */
export function hasAnyRole(userRole: string | undefined, requiredRoles: UserRole[]): boolean {
    if (!userRole) return false;
    return requiredRoles.includes(userRole as UserRole);
}

/**
 * Check if a user has all of the specified roles (usually not needed, but included for completeness)
 */
export function hasAllRoles(userRole: string | undefined, requiredRoles: UserRole[]): boolean {
    if (!userRole) return false;
    // Since a user typically has one role, this checks if their role is in the list
    return requiredRoles.includes(userRole as UserRole);
}

/**
 * Check if a user's role is at least the minimum required role (based on hierarchy)
 * Example: If minRole is TEAM_LEAD, then TEAM_LEAD, DEPARTMENT_HEAD, ADMIN, and SUPERADMIN will pass
 */
export function hasMinimumRole(userRole: string | undefined, minRole: UserRole): boolean {
    if (!userRole) return false;

    const userRoleLevel = ROLE_HIERARCHY[userRole as UserRole];
    const minRoleLevel = ROLE_HIERARCHY[minRole];

    if (userRoleLevel === undefined || minRoleLevel === undefined) return false;

    return userRoleLevel >= minRoleLevel;
}

/**
 * Check if a user's role is higher than another role
 */
export function isRoleHigherThan(userRole: string | undefined, compareRole: UserRole): boolean {
    if (!userRole) return false;

    const userRoleLevel = ROLE_HIERARCHY[userRole as UserRole];
    const compareRoleLevel = ROLE_HIERARCHY[compareRole];

    if (userRoleLevel === undefined || compareRoleLevel === undefined) return false;

    return userRoleLevel > compareRoleLevel;
}

/**
 * Check if a user is a SuperAdmin
 */
export function isSuperAdmin(userRole: string | undefined): boolean {
    return hasRole(userRole, UserRole.SUPERADMIN);
}

/**
 * Check if a user is an Admin (Company Admin) or higher
 */
export function isAdmin(userRole: string | undefined): boolean {
    return hasMinimumRole(userRole, UserRole.ADMIN);
}

/**
 * Check if a user is a Department Head or higher
 */
export function isDepartmentHead(userRole: string | undefined): boolean {
    return hasMinimumRole(userRole, UserRole.DEPARTMENT_HEAD);
}

/**
 * Check if a user is a Team Lead or higher
 */
export function isTeamLead(userRole: string | undefined): boolean {
    return hasMinimumRole(userRole, UserRole.TEAM_LEAD);
}

/**
 * Get all roles that are equal to or higher than the specified role
 */
export function getRolesAtOrAbove(minRole: UserRole): UserRole[] {
    const minLevel = ROLE_HIERARCHY[minRole];
    return Object.entries(ROLE_HIERARCHY)
        .filter(([_, level]) => level >= minLevel)
        .map(([role]) => role as UserRole);
}

/**
 * Get all roles that are below the specified role
 */
export function getRolesBelow(maxRole: UserRole): UserRole[] {
    const maxLevel = ROLE_HIERARCHY[maxRole];
    return Object.entries(ROLE_HIERARCHY)
        .filter(([_, level]) => level < maxLevel)
        .map(([role]) => role as UserRole);
}

/**
 * Check if user can manage another user based on role hierarchy
 * A user can manage users with lower roles
 */
export function canManageUser(managerRole: string | undefined, targetRole: string): boolean {
    if (!managerRole) return false;

    const managerLevel = ROLE_HIERARCHY[managerRole as UserRole];
    const targetLevel = ROLE_HIERARCHY[targetRole as UserRole];

    if (managerLevel === undefined || targetLevel === undefined) return false;

    return managerLevel > targetLevel;
}

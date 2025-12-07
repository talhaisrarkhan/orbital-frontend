// ----------------------------------------------------------------------
// User Role Enum
// ----------------------------------------------------------------------

export enum UserRole {
    SUPERADMIN = 'superadmin',
    ADMIN = 'admin', // CEO/Company Admin
    DEPARTMENT_HEAD = 'departmentHead',
    TEAM_LEAD = 'teamLead',
    EMPLOYEE = 'employee',
}

// ----------------------------------------------------------------------
// Role Hierarchy
// Higher number = more permissions
// ----------------------------------------------------------------------

export const ROLE_HIERARCHY: Record<UserRole, number> = {
    [UserRole.SUPERADMIN]: 5,
    [UserRole.ADMIN]: 4,
    [UserRole.DEPARTMENT_HEAD]: 3,
    [UserRole.TEAM_LEAD]: 2,
    [UserRole.EMPLOYEE]: 1,
};

// ----------------------------------------------------------------------
// Role Display Names
// ----------------------------------------------------------------------

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
    [UserRole.SUPERADMIN]: 'Super Admin',
    [UserRole.ADMIN]: 'Admin',
    [UserRole.DEPARTMENT_HEAD]: 'Department Head',
    [UserRole.TEAM_LEAD]: 'Team Lead',
    [UserRole.EMPLOYEE]: 'Employee',
};

// ----------------------------------------------------------------------
// Role Descriptions
// ----------------------------------------------------------------------

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
    [UserRole.SUPERADMIN]: 'Full system access with platform-wide management capabilities',
    [UserRole.ADMIN]: 'Company administrator with full company management access',
    [UserRole.DEPARTMENT_HEAD]: 'Department-level management and oversight',
    [UserRole.TEAM_LEAD]: 'Team-level management and coordination',
    [UserRole.EMPLOYEE]: 'Standard employee access',
};

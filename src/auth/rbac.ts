// Export user role types and constants
export * from './types/user-role';

// Export permission utilities
export * from './utils/permissions';

// Export route permissions
export * from './config/route-permissions';

// Export hooks
export { usePermissions } from './hooks/use-permissions';

// Export guards
export { RoleBasedGuard as RoleBasedGuardV2 } from './guard/role-based-guard-v2';

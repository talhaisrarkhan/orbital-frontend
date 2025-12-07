import type { UserRole } from './types/user-role';

// ----------------------------------------------------------------------

/**
 * UserType - Represents an authenticated user
 * 
 * This type is intentionally flexible to support different auth providers (JWT, Supabase, Firebase, etc.)
 * The role field should be present for RBAC to work properly, but it's optional for compatibility.
 * 
 * For JWT authentication (which we're using for RBAC), the backend should return:
 * - id: string
 * - email: string
 * - role: UserRole (one of: 'superadmin', 'admin', 'departmentHead', 'teamLead', 'employee')
 * - companyId, departmentId, teamId (optional, based on role)
 */
export type UserType = Record<string, any> & {
  id?: string;
  email?: string | null;
  role?: UserRole | string;
  companyId?: string | null;
  departmentId?: string | null;
  teamId?: string | null;
} | null;

export type AuthState = {
  user: UserType;
  loading: boolean;
};

export type AuthContextValue = {
  user: UserType;
  loading: boolean;
  authenticated: boolean;
  unauthenticated: boolean;
  checkUserSession?: () => Promise<void>;
};

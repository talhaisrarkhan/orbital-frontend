import { UserRole } from 'src/auth/types/user-role';

// ----------------------------------------------------------------------

export type IUserManagementItem = {
    id: string | number;
    name: string;
    email: string;
    role: UserRole;
    isActive: boolean;
    profilePicture?: string | null;
    companyId?: string | number | null;
};

export type IUserCreatePayload = {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    companyId?: string | number;
};

export type IUserTableFilters = {
    name: string;
    role: UserRole[];
    status: string;
};

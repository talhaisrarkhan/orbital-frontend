// ----------------------------------------------------------------------

export type ICompanyUser = {
    id: string | number;
    name: string;
    email: string;
    role: string;
    profilePicture?: string | null;
    isActive: boolean;
    companyId: string | number;
};

export type ICompanyItem = {
    id: string;
    name: string;
    description?: string;
    website?: string | null;
    address?: string | null;
    logo?: string | null;
    users?: ICompanyUser[];
    // Derived fields for UI
    ceoName?: string | null;
    ceoEmail?: string | null;
    logoUrl?: string; // Keep for compatibility if needed, or map logo to logoUrl
    createdAt?: string | Date;
    updatedAt?: string | Date;
};

export type ICompanyTableFilters = {
    name: string;
};

export type ICompanyCreatePayload = {
    companyName: string;
    companyDescription?: string;
    companyWebsite?: string;
    companyAddress?: string;
    companyLogo?: File | string | null;
    ceoName: string;
    ceoEmail: string;
    ceoPassword: string;
};

export type ICompanyUpdatePayload = Partial<ICompanyCreatePayload>;

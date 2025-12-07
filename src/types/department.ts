import type { ITeam } from './team';

export type IDepartment = {
    id: string;
    name: string;
    headId: string;
    head?: {
        id: string;
        name: string;
        profilePicture: string;
        email: string;
    };
    teams?: ITeam[];
    companyId: string;
    createdAt: Date;
    updatedAt: Date;
};

export type IDepartmentCreatePayload = {
    name: string;
    headId: string;
};

export type IDepartmentUpdatePayload = {
    name?: string;
    headId?: string;
};

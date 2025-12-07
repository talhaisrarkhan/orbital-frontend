export type ITeam = {
    id: string;
    name: string;
    departmentId: string;
    department?: {
        id: string;
        name: string;
    };
    leadId: string;
    lead?: {
        id: string;
          name: string;
        profilePicture: string;
        email: string;
    };
    members?: {
        id: string;
           name: string;
        profilePicture: string;
        email: string;
    }[];
    createdAt: Date;
    updatedAt: Date;
};

export type ITeamCreatePayload = {
    name: string;
    departmentId: string;
    leadId: string;
};

export type ITeamUpdatePayload = {
    name?: string;
    departmentId?: string;
    leadId?: string;
};

export type ITeamMemberPayload = {
    userId: string;
};

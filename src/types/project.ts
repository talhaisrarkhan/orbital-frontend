import type { IUserItem } from './user';

// Enums
export type ProjectType = 'internal' | 'client' | 'hr' | 'research' | 'other';
export type ProjectStatus = 'planned' | 'active' | 'halted' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type ProjectMemberRole = 'project_manager' | 'team_lead' | 'developer' | 'designer' | 'qa' | 'member';

// Project
export type IProject = {
    id: string;
    companyId: number;
    name: string;
    code: string;
    description?: string;
    projectType: ProjectType;
    status: ProjectStatus;
    projectManagerId: number;
    projectManager?: {
        id: number;
        name: string;
        email: string;
        profilePicture?: string;
    };
    budget?: number;
    repoUrl?: string;
    gitIntegrationEnabled: boolean;
    startDate?: Date;
    endDate?: Date;
    createdAt: Date;
    updatedAt: Date;
    sprints?: ISprint[];
    boards?: IBoard[];
    tasks?: ITask[];
    members?: IProjectMember[];
};

export type IProjectCreatePayload = {

    name: string;
    code: string;
    description?: string;
    projectType: ProjectType;
    status: ProjectStatus;
    projectManagerId: number;
    budget?: number;
    repoUrl?: string;
    gitIntegrationEnabled?: boolean;
    startDate?: string;
    endDate?: string;
};

export type IProjectUpdatePayload = Partial<IProjectCreatePayload>;

// Sprint
export type ISprint = {
    id: string;
    projectId: string;
    name: string;
    goal?: string;
    startDate: Date;
    endDate: Date;
    velocity?: number;
    isActive: boolean;
    isCompleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    boards?: IBoard[];
    tasks?: ITask[];
};

export type ISprintCreatePayload = {
    projectId: string;
    name: string;
    goal?: string;
    startDate: string;
    endDate: string;
    velocity?: number;
    isActive?: boolean;
};

export type ISprintUpdatePayload = Partial<Omit<ISprintCreatePayload, 'projectId'>>;

// Board
export type IBoard = {
    id: string;
    projectId: string;
    sprintId?: string;
    name: string;
    description?: string;
    orderIndex: number;
    isCompleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    columns?: IBoardColumn[];
    tasks?: ITask[];
};

export type IBoardCreatePayload = {
    projectId: string;
    sprintId?: string;
    name: string;
    description?: string;
    orderIndex?: number;
    columns?: IBoardColumnCreatePayload[];
};

export type IBoardUpdatePayload = Partial<Omit<IBoardCreatePayload, 'projectId' | 'columns'>>;

// Board Column
export type IBoardColumn = {
    id: string;
    boardId: string;
    title: string;
    wipLimit?: number;
    orderIndex: number;
    createdAt: Date;
    updatedAt: Date;
    tasks?: ITask[];
};

export type IBoardColumnCreatePayload = {
    title: string;
    wipLimit?: number;
    orderIndex: number;
};

export type IBoardColumnUpdatePayload = Partial<IBoardColumnCreatePayload>;

// Task
export type ITask = {
    id: string;
    boardId?: string | null;
    boardColumnId?: string | null;
    sprintId?: string | null;
    projectId: string;
    createdBy: number;
    assignedTo?: number | null;
    title: string;
    description?: string | null;
    priority: TaskPriority;
    status: TaskStatus;
    storyPoints?: number | null;
    tags?: string[] | null;
    dueDate?: Date | null;
    startDate?: Date | null;
    isBacklog: boolean;
    archived: boolean;
    orderIndex: number;
    createdAt: Date;
    updatedAt: Date;
    creator?: {
        id: number;
        name: string;
        email: string;
        profilePicture?: string;
    };
    assignee?: {
        id: number;
        name: string;
        email: string;
        profilePicture?: string;
    };
    history?: ITaskHistory[];
};

export type ITaskCreatePayload = {
    boardId?: string;
    projectId: string;
    sprintId?: string;
    boardColumnId?: string;
    title: string;
    description?: string;
    priority: TaskPriority;
    storyPoints?: number;
    tags?: string[];
    assignedTo?: number;
    dueDate?: string;
    isBacklog?: boolean;
};

export type ITaskUpdatePayload = Partial<Omit<ITaskCreatePayload, 'boardId' | 'projectId'>>;

export type ITaskMovePayload = {
    boardColumnId: string;
    orderIndex?: number;
};

export type ITaskAssignPayload = {
    assignedTo: number;
};

// Task History
export type ITaskHistory = {
    id: string;
    taskId: string;
    updatedBy: number;
    field: string;
    oldValue?: string;
    newValue?: string;
    remark?: string;
    createdAt: Date;
    updater?: {
        id: number;
        name: string;
        email: string;
    };
};

// Project Member
export type IProjectMember = {
    id: string;
    projectId: string;
    userId: number;
    role: ProjectMemberRole;
    addedBy: number;
    joinedAt: Date;
    user?: IUserItem;
    addedByUser?: {
        id: number;
        name: string;
    };
};

export type IProjectMemberAddPayload = {
    userId: number;
    role: ProjectMemberRole;
};

export type IProjectMemberAddBulkPayload = {
    members: IProjectMemberAddPayload[];
};

export type IProjectMemberUpdatePayload = {
    role: ProjectMemberRole;
};

// Timeline
export type IProjectTimeline = {
    project: {
        id: string;
        name: string;
        startDate?: string;
    };
    sprints: {
        id: string;
        name: string;
        startDate: string;
        endDate: string;
        tasks: {
            id: string;
            title: string;
            startDate?: string;
            dueDate?: string;
            status: string;
            assignee?: number;
        }[];
    }[];
};

// Calendar
export type IProjectCalendarEvent = {
    id: string;
    title: string;
    start: string;
    end: string;
    type: 'sprint' | 'task';
    color: string;
    assignee?: any;
};

export type IProjectCalendarResponse = {
    sprints: IProjectCalendarEvent[];
    tasks: IProjectCalendarEvent[];
};

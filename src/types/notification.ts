// ----------------------------------------------------------------------

export enum NotificationType {
    TASK_ASSIGNED = 'task_assigned',
    TASK_UPDATED = 'task_updated',
    TASK_COMMENTED = 'task_commented',
    TASK_MENTIONED = 'task_mentioned',
    TASK_DUE_SOON = 'task_due_soon',
    TASK_OVERDUE = 'task_overdue',
    PROJECT_ASSIGNED = 'project_assigned',
    PROJECT_UPDATED = 'project_updated',
    SPRINT_STARTED = 'sprint_started',
    SPRINT_ENDED = 'sprint_ended',
    TEAM_MEMBER_ADDED = 'team_member_added',
    TEAM_MEMBER_REMOVED = 'team_member_removed',
    MENTION = 'mention',
    SYSTEM = 'system',
}

export enum NotificationPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    URGENT = 'urgent',
}

export interface Actor {
    id: number;
    name: string;
    email: string;
    profilePicture?: string;
}

export interface Project {
    id: string;
    name: string;
}

export interface Task {
    id: string;
    title: string;
}

export interface Notification {
    id: string;
    userId: number;
    type: NotificationType;
    title: string;
    message: string;
    priority: NotificationPriority;
    isRead: boolean;
    readAt: string | null;
    projectId: string | null;
    taskId: string | null;
    actorId: number | null;
    actor?: Actor;
    project?: Project;
    task?: Task;
    metadata: Record<string, any> | null;
    actionUrl: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface NotificationResponse {
    notifications: Notification[];
    total: number;
    unreadCount: number;
}

export interface NotificationState {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
}

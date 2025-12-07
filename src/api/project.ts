import type {
    IProject,
    IProjectCreatePayload,
    IProjectUpdatePayload,
    ISprint,
    ISprintCreatePayload,
    ISprintUpdatePayload,
    IBoard,
    IBoardCreatePayload,
    IBoardUpdatePayload,
    IBoardColumnCreatePayload,
    IBoardColumnUpdatePayload,
    ITask,
    ITaskCreatePayload,
    ITaskUpdatePayload,
    ITaskMovePayload,
    ITaskAssignPayload,
    ITaskHistory,
    IProjectMember,
    IProjectMemberAddPayload,
    IProjectMemberAddBulkPayload,
    IProjectMemberUpdatePayload,
    IProjectTimeline,
    IProjectCalendarResponse,
} from 'src/types/project';

import axiosInstance, { endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------
// PROJECTS
// ----------------------------------------------------------------------

export async function getProjects(companyId?: number): Promise<IProject[]> {
    const params = companyId ? { companyId } : {};
    const response = await axiosInstance.get(endpoints.project.list, { params });
    return response.data;
}

export async function getProject(id: string): Promise<IProject> {
    const response = await axiosInstance.get(endpoints.project.details(id));
    return response.data;
}

export async function createProject(data: IProjectCreatePayload): Promise<IProject> {
    const response = await axiosInstance.post(endpoints.project.create, data);
    return response.data;
}

export async function updateProject(id: string, data: IProjectUpdatePayload): Promise<IProject> {
    const response = await axiosInstance.patch(endpoints.project.update(id), data);
    return response.data;
}

export async function deleteProject(id: string): Promise<void> {
    await axiosInstance.delete(endpoints.project.delete(id));
}

export async function getProjectBacklog(id: string): Promise<ITask[]> {
    const response = await axiosInstance.get(endpoints.project.backlog(id));
    return response.data;
}

// ----------------------------------------------------------------------
// SPRINTS
// ----------------------------------------------------------------------

export async function getSprints(projectId?: string): Promise<ISprint[]> {
    const params = projectId ? { projectId } : {};
    const response = await axiosInstance.get(endpoints.sprint.list, { params });
    return response.data;
}

export async function getSprint(id: string): Promise<ISprint> {
    const response = await axiosInstance.get(endpoints.sprint.details(id));
    return response.data;
}

export async function createSprint(data: ISprintCreatePayload): Promise<ISprint> {
    const response = await axiosInstance.post(endpoints.sprint.create, data);
    return response.data;
}

export async function updateSprint(id: string, data: ISprintUpdatePayload): Promise<ISprint> {
    const response = await axiosInstance.patch(endpoints.sprint.update(id), data);
    return response.data;
}

export async function deleteSprint(id: string): Promise<void> {
    await axiosInstance.delete(endpoints.sprint.delete(id));
}

export async function completeSprint(id: string, moveToBacklog = true): Promise<ISprint> {
    const response = await axiosInstance.post(endpoints.sprint.complete(id), { moveToBacklog });
    return response.data;
}

export async function activateSprint(id: string): Promise<ISprint> {
    const response = await axiosInstance.post(endpoints.sprint.activate(id));
    return response.data;
}

export async function getSprintBacklog(id: string): Promise<ITask[]> {
    const response = await axiosInstance.get(endpoints.sprint.backlog(id));
    return response.data;
}

export async function addTaskToSprintBacklog(sprintId: string, taskId: string): Promise<void> {
    await axiosInstance.post(endpoints.sprint.addToBacklog(sprintId), { taskId });
}

export async function moveTaskToBoard(
    sprintId: string,
    data: { taskId: string; boardId: string; boardColumnId: string; orderIndex: number }
): Promise<void> {
    await axiosInstance.post(endpoints.sprint.moveToBoard(sprintId), data);
}

// ----------------------------------------------------------------------
// BOARDS
// ----------------------------------------------------------------------

export async function getBoards(projectId?: string, sprintId?: string): Promise<IBoard[]> {
    const params: any = {};
    if (projectId) params.projectId = projectId;
    if (sprintId) params.sprintId = sprintId;
    const response = await axiosInstance.get(endpoints.board.list, { params });
    return response.data;
}

export async function getBoard(id: string): Promise<IBoard> {
    const response = await axiosInstance.get(endpoints.board.details(id));
    return response.data;
}

export async function createBoard(data: IBoardCreatePayload): Promise<IBoard> {
    const response = await axiosInstance.post(endpoints.board.create, data);
    return response.data;
}

export async function updateBoard(id: string, data: IBoardUpdatePayload): Promise<IBoard> {
    const response = await axiosInstance.patch(endpoints.board.update(id), data);
    return response.data;
}

export async function deleteBoard(id: string): Promise<void> {
    await axiosInstance.delete(endpoints.board.delete(id));
}

export async function completeBoard(id: string): Promise<IBoard> {
    const response = await axiosInstance.post(endpoints.board.complete(id));
    return response.data;
}

export async function addBoardColumn(
    boardId: string,
    data: IBoardColumnCreatePayload
): Promise<IBoard> {
    const response = await axiosInstance.post(endpoints.board.addColumn(boardId), data);
    return response.data;
}

export async function updateBoardColumn(
    columnId: string,
    data: IBoardColumnUpdatePayload
): Promise<void> {
    await axiosInstance.patch(endpoints.board.updateColumn(columnId), data);
}

export async function deleteBoardColumn(columnId: string): Promise<void> {
    await axiosInstance.delete(endpoints.board.deleteColumn(columnId));
}

// ----------------------------------------------------------------------
// TASKS
// ----------------------------------------------------------------------

export async function getTasks(filters?: {
    projectId?: string;
    sprintId?: string;
    boardId?: string;
    assignedTo?: number;
    isBacklog?: boolean;
}): Promise<ITask[]> {
    const response = await axiosInstance.get(endpoints.task.list, { params: filters });
    return response.data;
}

export async function getTask(id: string): Promise<ITask> {
    const response = await axiosInstance.get(endpoints.task.details(id));
    return response.data;
}

export async function createTask(data: any): Promise<ITask> {
    const response = await axiosInstance.post(endpoints.task.create, data);
    return response.data;
}

export async function updateTask(id: string, data: any): Promise<ITask> {
    const response = await axiosInstance.patch(endpoints.task.update(id), data);
    return response.data;
}

export async function deleteTask(id: string): Promise<void> {
    await axiosInstance.delete(endpoints.task.delete(id));
}

export async function moveTask(id: string, data: ITaskMovePayload): Promise<ITask> {
    const response = await axiosInstance.post(endpoints.task.move(id), data);
    return response.data;
}

export async function assignTask(id: string, data: ITaskAssignPayload): Promise<ITask> {
    const response = await axiosInstance.post(endpoints.task.assign(id), data);
    return response.data;
}

export async function getTaskHistory(id: string): Promise<ITaskHistory[]> {
    const response = await axiosInstance.get(endpoints.task.history(id));
    return response.data;
}

// ----------------------------------------------------------------------
// PROJECT TIMELINE & CALENDAR
// ----------------------------------------------------------------------

export async function getProjectTimeline(id: string): Promise<IProjectTimeline> {
    const response = await axiosInstance.get(endpoints.project.timeline(id));
    return response.data;
}

export async function getProjectCalendar(
    id: string,
    params?: { start?: string; end?: string }
): Promise<IProjectCalendarResponse> {
    const response = await axiosInstance.get(endpoints.project.calendar(id), { params });
    return response.data;
}


// ----------------------------------------------------------------------
// PROJECT MEMBERS
// ----------------------------------------------------------------------

export async function getProjectMembers(projectId: string): Promise<IProjectMember[]> {
    const response = await axiosInstance.get(endpoints.project.members(projectId));
    return response.data;
}

export async function addProjectMember(projectId: string, data: IProjectMemberAddPayload): Promise<IProjectMember> {
    const response = await axiosInstance.post(endpoints.project.members(projectId), data);
    return response.data;
}

export async function addProjectMembersBulk(projectId: string, data: IProjectMemberAddBulkPayload): Promise<IProjectMember[]> {
    const response = await axiosInstance.post(endpoints.project.membersBulk(projectId), data);
    return response.data;
}

export async function updateProjectMemberRole(memberId: string, role: string): Promise<void> {
    const data: IProjectMemberUpdatePayload = { role: role as any };
    await axiosInstance.patch(endpoints.project.member(memberId), data);
}

export async function removeProjectMember(memberId: string): Promise<void> {
    await axiosInstance.delete(endpoints.project.member(memberId));
}

export async function removeProjectMemberByUser(projectId: string, userId: number): Promise<void> {
    await axiosInstance.delete(endpoints.project.memberByUser(projectId, userId));
}

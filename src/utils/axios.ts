import type { AxiosRequestConfig } from 'axios';

import axios from 'axios';

import { CONFIG } from 'src/config-global';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({ baseURL: CONFIG.serverUrl });

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject((error.response && error.response.data) || 'Something went wrong!')
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async (args: string | [string, AxiosRequestConfig]) => {
  try {
    const [url, config] = Array.isArray(args) ? args : [args];

    const res = await axiosInstance.get(url, { ...config });

    return res.data;
  } catch (error) {
    console.error('Failed to fetch:', error);
    throw error;
  }
};

// ----------------------------------------------------------------------

export const endpoints = {
  chat: {
    upload: '/chat/upload',
  },
  kanban: '/api/kanban',
  calendar: '/api/calendar',
  auth: {
    me: '/auth/me',
    signIn: '/auth/login',
    signUp: '/api/auth/sign-up',
  },
  mail: {
    list: '/api/mail/list',
    details: '/api/mail/details',
    labels: '/api/mail/labels',
  },
  post: {
    list: '/api/post/list',
    details: '/api/post/details',
    latest: '/api/post/latest',
    search: '/api/post/search',
  },
  product: {
    list: '/api/product/list',
    details: '/api/product/details',
    search: '/api/product/search',
  },
  company: {
    list: '/companies',
    create: '/companies/create-with-ceo',
    details: (id: string) => `/companies/${id}`,
    update: (id: string) => `/companies/${id}`,
    delete: (id: string) => `/companies/${id}`,
  },
  userManagement: {
    list: '/users',
    create: '/users',
    delete: (id: string) => `/users/${id}`,
    uploadCsv: '/users/upload-csv',
  },
  department: {
    list: '/departments',
    create: '/departments',
    details: (id: string) => `/departments/${id}`,
    delete: (id: string) => `/departments/${id}`,
    changeHead: (id: string) => `/departments/${id}/head`,
  },
  team: {
    list: '/teams',
    create: '/teams',
    details: (id: string) => `/teams/${id}`,
    delete: (id: string) => `/teams/${id}`,
    changeLead: (id: string) => `/teams/${id}/lead`,
    members: (id: string) => `/teams/${id}/members`,
    member: (id: string, userId: string) => `/teams/${id}/members/${userId}`,
  },
  project: {
    list: '/projects',
    create: '/projects',
    details: (id: string) => `/projects/${id}`,
    update: (id: string) => `/projects/${id}`,
    delete: (id: string) => `/projects/${id}`,
    backlog: (id: string) => `/projects/${id}/backlog`,
    members: (id: string) => `/projects/${id}/members`,
    membersBulk: (id: string) => `/projects/${id}/members/bulk`,
    member: (id: string) => `/projects/members/${id}`,
    memberByUser: (id: string, userId: number) => `/projects/${id}/members/${userId}`,
    timeline: (id: string) => `/projects/${id}/timeline`,
    calendar: (id: string) => `/projects/${id}/calendar`,
  },
  sprint: {
    list: '/sprints',
    create: '/sprints',
    details: (id: string) => `/sprints/${id}`,
    update: (id: string) => `/sprints/${id}`,
    delete: (id: string) => `/sprints/${id}`,
    complete: (id: string) => `/sprints/${id}/complete`,
    activate: (id: string) => `/sprints/${id}/activate`,
    backlog: (id: string) => `/sprints/${id}/backlog`,
    addToBacklog: (id: string) => `/sprints/${id}/backlog/tasks`,
    moveToBoard: (id: string) => `/sprints/${id}/tasks/move-to-board`,
  },
  board: {
    list: '/boards',
    create: '/boards',
    details: (id: string) => `/boards/${id}`,
    update: (id: string) => `/boards/${id}`,
    delete: (id: string) => `/boards/${id}`,
    complete: (id: string) => `/boards/${id}/complete`,
    addColumn: (id: string) => `/boards/${id}/columns`,
    updateColumn: (columnId: string) => `/boards/columns/${columnId}`,
    deleteColumn: (columnId: string) => `/boards/columns/${columnId}`,
  },
  task: {
    list: '/tasks',
    create: '/tasks',
    details: (id: string) => `/tasks/${id}`,
    update: (id: string) => `/tasks/${id}`,
    delete: (id: string) => `/tasks/${id}`,
    move: (id: string) => `/tasks/${id}/move`,
    assign: (id: string) => `/tasks/${id}/assign`,
    history: (id: string) => `/tasks/${id}/history`,
  },
  chatRoom: {
    list: '/chat/rooms',
    create: '/chat/rooms',
    details: (id: string) => `/chat/rooms/${id}`,
    messages: (id: string) => `/chat/rooms/${id}/messages`,
    unreadCount: (id: string) => `/chat/rooms/${id}/unread-count`,
    markAsRead: (id: string) => `/chat/rooms/${id}/read`,
  },
  chatMessage: {
    create: '/chat/messages',
    update: (id: string) => `/chat/messages/${id}`,
    delete: (id: string) => `/chat/messages/${id}`,
    markAsRead: (id: string) => `/chat/messages/${id}/read`,
  },
  taskChat: {
    room: (taskId: string) => `/chat/tasks/${taskId}/room`,
  },
  notification: {
    list: '/notifications',
    markRead: (id: string) => `/notifications/${id}/read`,
    markAllRead: '/notifications/mark-all-read',
  },
};

// ----------------------------------------------------------------------

// Enums
export enum ChatRoomType {
  DIRECT = 'direct',
  GROUP = 'group',
  PROJECT = 'project',
  TASK = 'task'
}

export enum MessageType {
  TEXT = 'text',
  FILE = 'file',
  IMAGE = 'image',
  SYSTEM = 'system'
}

// User Interface (from backend)
export interface User {
  id: number;
  name: string;
  email: string;
  profilePicture?: string;
  role: string;
  isActive: boolean;
}

// Chat Message
export interface IChatMessage {
  id: string;
  roomId: string;
  senderId: number;
  sender: User;
  content: string;
  type: MessageType;
  fileUrl: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  readBy: number[];
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
}

// Chat Room
export interface IChatRoom {
  id: string;
  type: ChatRoomType;
  name: string | null;
  projectId: string | null;
  taskId: string | null;
  participantIds: number[];
  participants?: User[];
  messages?: IChatMessage[];
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

// DTOs for API calls
export interface CreateRoomDto {
  type: ChatRoomType;
  name?: string;
  projectId?: string;
  taskId?: string;
  participantIds: number[];
}

export interface SendMessageDto {
  roomId: string;
  content: string;
  type?: MessageType;
  fileUrl?: string;
}

export interface EditMessageDto {
  content: string;
}

// Legacy types for backward compatibility
export type IChatRoomCreatePayload = CreateRoomDto;
export type IChatMessageCreatePayload = SendMessageDto;
export type IChatMessageUpdatePayload = EditMessageDto;

export type IChatAttachment = {
  name: string;
  preview: string;
  createdAt: Date | string | number;
  size?: number;
  type?: string;
  path?: string;
  modifiedAt?: Date | string | number;
};

export type IChatParticipant = {
  id: string;
  name: string;
  role: string;
  email: string;
  address?: string;
  avatarUrl: string;
  phoneNumber?: string;
  lastActivity: Date | string | number;
  status: 'online' | 'offline' | 'alway' | 'busy';
};

// Alias for backward compatibility
export type IChatConversation = IChatRoom;

export type IChatConversations = {
  byId: Record<string, IChatRoom>;
  allIds: string[];
};

// WebSocket event payloads
export interface JoinRoomPayload {
  roomId: string;
}

export interface LeaveRoomPayload {
  roomId: string;
}

export interface TypingPayload {
  roomId: string;
  isTyping: boolean;
}

export interface MarkAsReadPayload {
  messageId: string;
}

export interface MarkRoomAsReadPayload {
  roomId: string;
}

export interface DeleteMessagePayload {
  messageId: string;
}

// WebSocket response types
export interface SocketResponse {
  success: boolean;
  error?: string;
}

export interface SendMessageResponse extends SocketResponse {
  message?: IChatMessage;
}

export interface UserTypingEvent {
  userId: number;
  isTyping: boolean;
}

export interface MessagesReadEvent {
  userId: number;
  roomId: string;
}

export interface MessageDeletedEvent {
  messageId: string;
}


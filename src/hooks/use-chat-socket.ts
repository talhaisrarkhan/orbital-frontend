import { useEffect, useState, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

import { CONFIG } from 'src/config-global';

import type {
    JoinRoomPayload,
    LeaveRoomPayload,
    SendMessageDto,
    TypingPayload,
    MarkAsReadPayload,
    MarkRoomAsReadPayload,
    DeleteMessagePayload,
    EditMessageDto,
    SocketResponse,
    SendMessageResponse,
    IChatMessage,
    UserTypingEvent,
    MessagesReadEvent,
    MessageDeletedEvent,
} from 'src/types/chat';

// ----------------------------------------------------------------------

interface UseChatSocketReturn {
    socket: Socket | null;
    isConnected: boolean;
    emit: (event: string, ...args: any[]) => void;
    joinRoom: (payload: JoinRoomPayload, callback?: (response: SocketResponse) => void) => void;
    leaveRoom: (payload: LeaveRoomPayload) => void;
    sendMessage: (payload: SendMessageDto, callback?: (response: SendMessageResponse) => void) => void;
    setTyping: (payload: TypingPayload) => void;
    markAsRead: (payload: MarkAsReadPayload, callback?: (response: SocketResponse) => void) => void;
    markRoomAsRead: (payload: MarkRoomAsReadPayload, callback?: (response: SocketResponse) => void) => void;
    editMessage: (messageId: string, data: EditMessageDto, callback?: (response: SendMessageResponse) => void) => void;
    deleteMessage: (payload: DeleteMessagePayload, callback?: (response: SocketResponse) => void) => void;
    on: (event: string, handler: (...args: any[]) => void) => void;
    off: (event: string, handler?: (...args: any[]) => void) => void;
}

export function useChatSocket(namespace: string = '/chat'): UseChatSocketReturn {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        // Get token from sessionStorage (matches JWT auth implementation)
        const token = sessionStorage.getItem('jwt_access_token');

        if (!token) {
            console.error('No auth token found in sessionStorage');
            return;
        }

        // Create socket connection with authentication
        const socketUrl = `${CONFIG.serverUrl}${namespace}`;
        const newSocket = io(socketUrl, {
            auth: {
                token,
            },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        // Connection event handlers
        newSocket.on('connect', () => {
            console.log('Chat socket connected:', newSocket.id);
            setIsConnected(true);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('Chat socket disconnected:', reason);
            setIsConnected(false);

            if (reason === 'io server disconnect') {
                // Server disconnected, manual reconnection needed
                newSocket.connect();
            }
        });

        newSocket.on('connect_error', (error) => {
            console.error('Chat socket connection error:', error);
            setIsConnected(false);
        });

        newSocket.on('error', (error) => {
            console.error('Chat socket error:', error);
        });

        setSocket(newSocket);

        return () => {
            console.log('Cleaning up chat socket');
            newSocket.close();
        };
    }, [namespace]);

    // Generic emit function
    const emit = useCallback((event: string, ...args: any[]) => {
        if (socket?.connected) {
            socket.emit(event, ...args);
        } else {
            console.warn('Socket not connected, cannot emit:', event);
        }
    }, [socket]);

    // Typed emit functions
    const joinRoom = useCallback((payload: JoinRoomPayload, callback?: (response: SocketResponse) => void) => {
        if (socket?.connected) {
            socket.emit('joinRoom', payload, callback);
        }
    }, [socket]);

    const leaveRoom = useCallback((payload: LeaveRoomPayload) => {
        if (socket?.connected) {
            socket.emit('leaveRoom', payload);
        }
    }, [socket]);

    const sendMessage = useCallback((payload: SendMessageDto, callback?: (response: SendMessageResponse) => void) => {
        if (socket?.connected) {
            socket.emit('sendMessage', payload, callback);
        }
    }, [socket]);

    const setTyping = useCallback((payload: TypingPayload) => {
        if (socket?.connected) {
            socket.emit('typing', payload);
        }
    }, [socket]);

    const markAsRead = useCallback((payload: MarkAsReadPayload, callback?: (response: SocketResponse) => void) => {
        if (socket?.connected) {
            socket.emit('markAsRead', payload, callback);
        }
    }, [socket]);

    const markRoomAsRead = useCallback((payload: MarkRoomAsReadPayload, callback?: (response: SocketResponse) => void) => {
        if (socket?.connected) {
            socket.emit('markRoomAsRead', payload, callback);
        }
    }, [socket]);

    const editMessage = useCallback((messageId: string, data: EditMessageDto, callback?: (response: SendMessageResponse) => void) => {
        if (socket?.connected) {
            socket.emit('editMessage', { messageId, ...data }, callback);
        }
    }, [socket]);

    const deleteMessage = useCallback((payload: DeleteMessagePayload, callback?: (response: SocketResponse) => void) => {
        if (socket?.connected) {
            socket.emit('deleteMessage', payload, callback);
        }
    }, [socket]);

    // Event listener helpers
    const on = useCallback((event: string, handler: (...args: any[]) => void) => {
        if (socket) {
            socket.on(event, handler);
        }
    }, [socket]);

    const off = useCallback((event: string, handler?: (...args: any[]) => void) => {
        if (socket) {
            if (handler) {
                socket.off(event, handler);
            } else {
                socket.off(event);
            }
        }
    }, [socket]);

    return {
        socket,
        isConnected,
        emit,
        joinRoom,
        leaveRoom,
        sendMessage,
        setTyping,
        markAsRead,
        markRoomAsRead,
        editMessage,
        deleteMessage,
        on,
        off,
    };
}

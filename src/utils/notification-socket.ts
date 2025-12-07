import { io, Socket } from 'socket.io-client';

import type { Notification } from 'src/types/notification';

// ----------------------------------------------------------------------

const SOCKET_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5000';

export class NotificationSocket {
    private socket: Socket | null = null;

    private reconnectAttempts = 0;

    private maxReconnectAttempts = 5;

    constructor(private token: string) { }

    connect() {
        if (this.socket?.connected) {
            return this.socket;
        }

        this.socket = io(`${SOCKET_URL}/notifications`, {
            auth: {
                token: this.token,
            },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });

        this.setupListeners();
        return this.socket;
    }

    private setupListeners() {
        if (!this.socket) return;

        this.socket.on('connect', () => {
            console.log('[Notifications] Connected to notification server');
            this.reconnectAttempts = 0;
        });

        this.socket.on('disconnect', (reason) => {
            console.log('[Notifications] Disconnected:', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.error('[Notifications] Connection error:', error);
            this.reconnectAttempts += 1;

            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('[Notifications] Max reconnection attempts reached');
                this.disconnect();
            }
        });
    }

    onNewNotification(callback: (notification: Notification) => void) {
        this.socket?.on('notification:new', callback);
    }

    onUnreadCountUpdate(callback: (data: { count: number }) => void) {
        this.socket?.on('notification:unread-count', callback);
    }

    onNotificationUpdated(callback: (notification: Notification) => void) {
        this.socket?.on('notification:updated', callback);
    }

    onNotificationDeleted(callback: (data: { notificationId: string }) => void) {
        this.socket?.on('notification:deleted', callback);
    }

    subscribe(options?: { limit?: number; unreadOnly?: boolean }) {
        return new Promise((resolve, reject) => {
            this.socket?.emit(
                'notifications:subscribe',
                options || {},
                (response: any) => {
                    if (response.event === 'error') {
                        reject(response.data);
                    } else {
                        resolve(response.data);
                    }
                }
            );
        });
    }

    markAsRead(notificationId: string) {
        return new Promise((resolve, reject) => {
            this.socket?.emit(
                'notification:mark-read',
                { notificationId },
                (response: any) => {
                    if (response.event === 'error') {
                        reject(response.data);
                    } else {
                        resolve(response.data);
                    }
                }
            );
        });
    }

    markAllAsRead() {
        return new Promise((resolve, reject) => {
            this.socket?.emit('notifications:mark-all-read', {}, (response: any) => {
                if (response.event === 'error') {
                    reject(response.data);
                } else {
                    resolve(response.data);
                }
            });
        });
    }

    deleteNotification(notificationId: string) {
        return new Promise((resolve, reject) => {
            this.socket?.emit(
                'notification:delete',
                { notificationId },
                (response: any) => {
                    if (response.event === 'error') {
                        reject(response.data);
                    } else {
                        resolve(response.data);
                    }
                }
            );
        });
    }

    disconnect() {
        this.socket?.disconnect();
        this.socket = null;
    }

    isConnected() {
        return this.socket?.connected || false;
    }
}

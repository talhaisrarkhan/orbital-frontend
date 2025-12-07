'use client';

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';

import axios, { endpoints } from 'src/utils/axios';
import { useAuthContext } from 'src/auth/hooks';
import { NotificationSocket } from 'src/utils/notification-socket';

import type { Notification } from 'src/types/notification';

// ----------------------------------------------------------------------

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

type Props = {
  children: React.ReactNode;
};

export function NotificationProvider({ children }: Props) {
  const { authenticated } = useAuthContext();

  const [socket, setSocket] = useState<NotificationSocket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    if (!authenticated) return undefined;

    const token = sessionStorage.getItem('jwt_access_token');
    if (!token) return undefined;

    const notificationSocket = new NotificationSocket(token);
    const socketInstance = notificationSocket.connect();

    socketInstance.on('connect', () => {
      console.log('[NotificationProvider] Socket connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('[NotificationProvider] Socket disconnected');
      setIsConnected(false);
    });

    // Fetch initial notifications using HTTP REST API
    const fetchInitialNotifications = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(endpoints.notification.list);
        console.log('[NotificationProvider] Initial notifications:', response.data);
        
        // Backend might return different structures, handle both
        if (Array.isArray(response.data)) {
          setNotifications(response.data);
          setUnreadCount(response.data.filter((n: any) => !n.isRead).length);
        } else if (response.data.notifications) {
          setNotifications(response.data.notifications || []);
          setUnreadCount(response.data.unreadCount || 0);
        } else {
          setNotifications([]);
          setUnreadCount(0);
        }
      } catch (error) {
        console.error('[NotificationProvider] Failed to fetch notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialNotifications();

    // Listen for new notifications
    notificationSocket.onNewNotification((notification) => {
      console.log('[NotificationProvider] New notification:', notification);
      setNotifications((prev) => [notification, ...prev]);

      // Show toast notification
      toast(notification.title, {
        description: notification.message,
        action: notification.actionUrl
          ? {
              label: 'View',
              onClick: () => {
                window.location.href = notification.actionUrl!;
              },
            }
          : undefined,
      });
    });

    // Listen for unread count updates
    notificationSocket.onUnreadCountUpdate(({ count }) => {
      console.log('[NotificationProvider] Unread count updated:', count);
      setUnreadCount(count);
    });

    // Listen for notification updates
    notificationSocket.onNotificationUpdated((notification) => {
      console.log('[NotificationProvider] Notification updated:', notification);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notification.id ? notification : n))
      );
    });

    // Listen for notification deletions
    notificationSocket.onNotificationDeleted(({ notificationId }) => {
      console.log('[NotificationProvider] Notification deleted:', notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    });

    setSocket(notificationSocket);

    return () => {
      console.log('[NotificationProvider] Disconnecting socket');
      notificationSocket.disconnect();
    };
  }, [authenticated]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!socket) {
        console.warn('[NotificationProvider] Socket not connected');
        return;
      }

      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await socket.markAsRead(notificationId);
        console.log('[NotificationProvider] Marked as read:', notificationId);
      } catch (error) {
        console.error('[NotificationProvider] Failed to mark as read:', error);
        // Revert on error
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, isRead: false } : n))
        );
        setUnreadCount((prev) => prev + 1);
        toast.error('Failed to mark notification as read');
      }
    },
    [socket]
  );

  const markAllAsRead = useCallback(async () => {
    if (!socket) {
      console.warn('[NotificationProvider] Socket not connected');
      return;
    }

    // Optimistic update
    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await socket.markAllAsRead();
      console.log('[NotificationProvider] Marked all as read');
    } catch (error) {
      console.error('[NotificationProvider] Failed to mark all as read:', error);
      // Revert on error
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
      toast.error('Failed to mark all notifications as read');
    }
  }, [socket, notifications, unreadCount]);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      if (!socket) {
        console.warn('[NotificationProvider] Socket not connected');
        return;
      }

      // Optimistic update
      const deletedNotification = notifications.find((n) => n.id === notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      try {
        await socket.deleteNotification(notificationId);
        console.log('[NotificationProvider] Deleted notification:', notificationId);
      } catch (error) {
        console.error('[NotificationProvider] Failed to delete notification:', error);
        // Revert on error
        if (deletedNotification) {
          setNotifications((prev) => [deletedNotification, ...prev]);
          if (!deletedNotification.isRead) {
            setUnreadCount((prev) => prev + 1);
          }
        }
        toast.error('Failed to delete notification');
      }
    },
    [socket, notifications]
  );

  const refreshNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(endpoints.notification.list);
      console.log('[NotificationProvider] Refreshed notifications:', response.data);
      
      if (Array.isArray(response.data)) {
        setNotifications(response.data);
        setUnreadCount(response.data.filter((n: any) => !n.isRead).length);
      } else if (response.data.notifications) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('[NotificationProvider] Failed to refresh notifications:', error);
      toast.error('Failed to refresh notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isConnected,
      isLoading,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      refreshNotifications,
    }),
    [
      notifications,
      unreadCount,
      isConnected,
      isLoading,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      refreshNotifications,
    ]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

'use client';

import { useState } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';

import { useNotifications } from 'src/sections/notifications/notification-provider';
import { NotificationType, NotificationPriority } from 'src/types/notification';

// ----------------------------------------------------------------------

export default function NotificationTestPage() {
  const {
    notifications,
    unreadCount,
    isConnected,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  } = useNotifications();

  const [actionLog, setActionLog] = useState<string[]>([]);

  const logAction = (action: string) => {
    setActionLog((prev) => [`${new Date().toLocaleTimeString()}: ${action}`, ...prev.slice(0, 9)]);
  };

  const handleMarkAsRead = () => {
    if (notifications.length > 0) {
      const firstUnread = notifications.find((n) => !n.isRead);
      if (firstUnread) {
        markAsRead(firstUnread.id);
        logAction(`Marked notification "${firstUnread.title}" as read`);
      } else {
        logAction('No unread notifications to mark');
      }
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    logAction('Marked all notifications as read');
  };

  const handleDelete = () => {
    if (notifications.length > 0) {
      const first = notifications[0];
      deleteNotification(first.id);
      logAction(`Deleted notification "${first.title}"`);
    }
  };

  const handleRefresh = () => {
    refreshNotifications();
    logAction('Refreshed notifications');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom>
        Notification System Test Page
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        Use this page to test the notification system functionality.
      </Typography>

      {/* Connection Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Connection Status
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: isConnected ? 'success.main' : 'error.main',
              }}
            />
            <Typography variant="body2">
              {isConnected ? 'Connected to notification server' : 'Disconnected'}
            </Typography>
            {isLoading && (
              <Chip label="Loading..." size="small" color="info" />
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Stats */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h4" color="primary">
              {notifications.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Notifications
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h4" color="error">
              {unreadCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Unread Notifications
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h4" color="success">
              {notifications.filter((n) => n.isRead).length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Read Notifications
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* Actions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Actions
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <Button 
              variant="contained" 
              onClick={handleMarkAsRead}
              disabled={!isConnected || unreadCount === 0}
            >
              Mark First Unread as Read
            </Button>
            
            <Button 
              variant="contained" 
              color="secondary"
              onClick={handleMarkAllAsRead}
              disabled={!isConnected || unreadCount === 0}
            >
              Mark All as Read
            </Button>
            
            <Button 
              variant="outlined" 
              color="error"
              onClick={handleDelete}
              disabled={!isConnected || notifications.length === 0}
            >
              Delete First Notification
            </Button>
            
            <Button 
              variant="outlined"
              onClick={handleRefresh}
              disabled={!isConnected || isLoading}
            >
              Refresh Notifications
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Action Log */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Action Log (Last 10 actions)
          </Typography>
          <Box
            sx={{
              bgcolor: 'background.neutral',
              p: 2,
              borderRadius: 1,
              maxHeight: 200,
              overflow: 'auto',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
            }}
          >
            {actionLog.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No actions yet. Click an action button above.
              </Typography>
            ) : (
              actionLog.map((log, index) => (
                <Box key={index} sx={{ mb: 0.5 }}>
                  {log}
                </Box>
              ))
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Notification Types Reference */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Supported Notification Types
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {Object.values(NotificationType).map((type) => (
              <Chip key={type} label={type} size="small" variant="outlined" />
            ))}
          </Stack>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" gutterBottom>
            Supported Priority Levels
          </Typography>
          <Stack direction="row" spacing={1}>
            {Object.values(NotificationPriority).map((priority) => (
              <Chip 
                key={priority} 
                label={priority} 
                size="small" 
                color={
                  priority === 'urgent' ? 'error' :
                  priority === 'high' ? 'warning' :
                  priority === 'medium' ? 'info' : 'default'
                }
              />
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Notification List Preview */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Notifications (First 5)
          </Typography>
          {notifications.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No notifications available
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {notifications.slice(0, 5).map((notification) => (
                <Card key={notification.id} variant="outlined">
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: notification.isRead ? 'grey.400' : 'primary.main',
                        }}
                      />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2">
                          {notification.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {notification.message}
                        </Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                          <Chip label={notification.type} size="small" variant="outlined" />
                          <Chip 
                            label={notification.priority} 
                            size="small" 
                            color={
                              notification.priority === 'urgent' ? 'error' :
                              notification.priority === 'high' ? 'warning' :
                              notification.priority === 'medium' ? 'info' : 'default'
                            }
                          />
                          {notification.isRead && (
                            <Chip label="Read" size="small" color="success" variant="outlined" />
                          )}
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card sx={{ mt: 3, bgcolor: 'info.lighter' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Testing Instructions
          </Typography>
          <Typography variant="body2" component="div">
            <ol style={{ margin: 0, paddingLeft: '1.5rem' }}>
              <li>Check the connection status indicator (should be green when connected)</li>
              <li>Open the notification bell in the header to see the notification drawer</li>
              <li>Trigger notifications from the backend to test real-time updates</li>
              <li>Use the action buttons above to test mark as read, delete, and refresh</li>
              <li>Check the browser console for detailed logs with [Notifications] and [NotificationProvider] prefixes</li>
              <li>Test toast notifications by having the backend emit new notifications</li>
            </ol>
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}

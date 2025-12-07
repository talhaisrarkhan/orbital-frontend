'use client';

import type { IconButtonProps } from '@mui/material/IconButton';

import { m } from 'framer-motion';
import { useState, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Drawer from '@mui/material/Drawer';
import Button from '@mui/material/Button';
import SvgIcon from '@mui/material/SvgIcon';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { useBoolean } from 'src/hooks/use-boolean';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { varHover } from 'src/components/animate';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomTabs } from 'src/components/custom-tabs';

import { useNotifications } from 'src/sections/notifications/notification-provider';

import { NotificationItem } from './notification-item';

// ----------------------------------------------------------------------

export type NotificationsDrawerProps = IconButtonProps;

export function NotificationsDrawer({ sx, ...other }: NotificationsDrawerProps) {
  const drawer = useBoolean();

  const { notifications, unreadCount, markAllAsRead, markAsRead, isConnected, refreshNotifications, isLoading } = useNotifications();

  const [currentTab, setCurrentTab] = useState('all');

  const handleChangeTab = useCallback((event: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue);
  }, []);

  const TABS = [
    { value: 'all', label: 'All', count: notifications.length },
    { value: 'unread', label: 'Unread', count: unreadCount },
    { value: 'archived', label: 'Archived', count: 0 }, // TODO: Implement archived
  ];

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const handleRefresh = () => {
    refreshNotifications();
  };

  const renderHead = (
    <Stack direction="row" alignItems="center" sx={{ py: 2, pl: 2.5, pr: 1, minHeight: 68 }}>
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        Notifications
        {/* Connection status indicator */}
        <Box
          component="span"
          sx={{
            ml: 1,
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: isConnected ? 'success.main' : 'error.main',
            display: 'inline-block',
          }}
        />
      </Typography>

      <Tooltip title="Refresh">
        <IconButton onClick={handleRefresh} disabled={isLoading}>
          <Iconify icon="eva:refresh-fill" />
        </IconButton>
      </Tooltip>

      {!!unreadCount && (
        <Tooltip title="Mark all as read">
          <IconButton color="primary" onClick={handleMarkAllAsRead}>
            <Iconify icon="eva:done-all-fill" />
          </IconButton>
        </Tooltip>
      )}

      <IconButton onClick={drawer.onFalse} sx={{ display: { xs: 'inline-flex', sm: 'none' } }}>
        <Iconify icon="mingcute:close-line" />
      </IconButton>

      <IconButton>
        <Iconify icon="solar:settings-bold-duotone" />
      </IconButton>
    </Stack>
  );

  const renderTabs = (
    <CustomTabs variant="fullWidth" value={currentTab} onChange={handleChangeTab}>
      {TABS.map((tab) => (
        <Tab
          key={tab.value}
          iconPosition="end"
          value={tab.value}
          label={tab.label}
          icon={
            <Label
              variant={((tab.value === 'all' || tab.value === currentTab) && 'filled') || 'soft'}
              color={
                (tab.value === 'unread' && 'info') ||
                (tab.value === 'archived' && 'success') ||
                'default'
              }
            >
              {tab.count}
            </Label>
          }
        />
      ))}
    </CustomTabs>
  );

  const filteredNotifications = notifications.filter((notification) => {
    if (currentTab === 'unread') return !notification.isRead;
    return true;
  });

  const renderList = (
    <Scrollbar>
      {filteredNotifications.length === 0 ? (
        <Stack alignItems="center" justifyContent="center" sx={{ p: 8 }}>
          <Box
            sx={{
              width: 120,
              height: 120,
              borderRadius: '50%',
              bgcolor: 'background.neutral',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
            }}
          >
            <Iconify 
              icon="solar:bell-bing-bold-duotone" 
              width={60} 
              sx={{ color: 'text.disabled' }} 
            />
          </Box>
          <Typography variant="h6" gutterBottom>
            No notifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {currentTab === 'unread' 
              ? "You're all caught up!" 
              : 'You have no notifications yet'}
          </Typography>
        </Stack>
      ) : (
        <Box component="ul">
          {filteredNotifications.map((notification) => (
            <Box component="li" key={notification.id} sx={{ display: 'flex' }}>
              <NotificationItem 
                notification={notification} 
                onMarkAsRead={() => markAsRead(notification.id)}
              />
            </Box>
          ))}
        </Box>
      )}
    </Scrollbar>
  );

  return (
    <>
      <IconButton
        component={m.button}
        whileTap="tap"
        whileHover="hover"
        variants={varHover(1.05)}
        onClick={drawer.onTrue}
        sx={sx}
        {...other}
      >
        <Badge badgeContent={unreadCount} color="error">
          <SvgIcon>
            {/* https://icon-sets.iconify.design/solar/bell-bing-bold-duotone/ */}
            <path
              fill="currentColor"
              d="M18.75 9v.704c0 .845.24 1.671.692 2.374l1.108 1.723c1.011 1.574.239 3.713-1.52 4.21a25.794 25.794 0 0 1-14.06 0c-1.759-.497-2.531-2.636-1.52-4.21l1.108-1.723a4.393 4.393 0 0 0 .693-2.374V9c0-3.866 3.022-7 6.749-7s6.75 3.134 6.75 7"
              opacity="0.5"
            />
            <path
              fill="currentColor"
              d="M12.75 6a.75.75 0 0 0-1.5 0v4a.75.75 0 0 0 1.5 0zM7.243 18.545a5.002 5.002 0 0 0 9.513 0c-3.145.59-6.367.59-9.513 0"
            />
          </SvgIcon>
        </Badge>
      </IconButton>

      <Drawer
        open={drawer.value}
        onClose={drawer.onFalse}
        anchor="right"
        slotProps={{ backdrop: { invisible: true } }}
        PaperProps={{ sx: { width: 1, maxWidth: 420 } }}
      >
        {renderHead}

        {renderTabs}

        {renderList}

        <Box sx={{ p: 1 }}>
          <Button fullWidth size="large">
            View all
          </Button>
        </Box>
      </Drawer>
    </>
  );
}

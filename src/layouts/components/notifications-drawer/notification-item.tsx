import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';

import { fToNow } from 'src/utils/format-time';

import { CONFIG } from 'src/config-global';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import type { Notification } from 'src/types/notification';
import { NotificationType } from 'src/types/notification';

// ----------------------------------------------------------------------

type Props = {
  notification: Notification;
  onMarkAsRead?: () => void;
};

export function NotificationItem({ notification, onMarkAsRead }: Props) {
  const { avatarUrl, title } = renderContent(notification);

  const renderAvatar = (
    <ListItemAvatar>
      {avatarUrl ? (
        <Avatar src={avatarUrl} sx={{ bgcolor: 'background.neutral' }} />
      ) : (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: 'background.neutral' }}
        >
          <Iconify 
            icon={getIcon(notification.type)} 
            width={24} 
            sx={{ color: 'text.secondary' }} 
          />
        </Stack>
      )}
    </ListItemAvatar>
  );

  const renderText = (
    <ListItemText
      disableTypography
      primary={title}
      secondary={
        <Stack
          direction="row"
          alignItems="center"
          sx={{ typography: 'caption', color: 'text.disabled' }}
          divider={
            <Box
              sx={{
                width: 2,
                height: 2,
                bgcolor: 'currentColor',
                mx: 0.5,
                borderRadius: '50%',
              }}
            />
          }
        >
          {fToNow(notification.createdAt)}
          {notification.type.replace('_', ' ')}
        </Stack>
      }
    />
  );

  const renderUnReadBadge = !notification.isRead && (
    <Box
      sx={{
        top: 26,
        width: 8,
        height: 8,
        right: 20,
        borderRadius: '50%',
        bgcolor: 'info.main',
        position: 'absolute',
      }}
    />
  );

  return (
    <ListItemButton
      disableRipple
      onClick={onMarkAsRead}
      sx={{
        p: 2.5,
        alignItems: 'flex-start',
        borderBottom: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
        bgcolor: notification.isRead ? 'transparent' : 'action.hover',
      }}
    >
      {renderUnReadBadge}

      {renderAvatar}

      <Stack sx={{ flexGrow: 1 }}>
        {renderText}
        {/* Add specific actions here based on type if needed */}
        {notification.actionUrl && (
            <Button 
                size="small" 
                variant="outlined" 
                sx={{ mt: 1.5, alignSelf: 'flex-start' }}
                href={notification.actionUrl}
            >
                View Details
            </Button>
        )}
      </Stack>
    </ListItemButton>
  );
}

// ----------------------------------------------------------------------

function reader(data: string) {
  return (
    <Box
      dangerouslySetInnerHTML={{ __html: data }}
      sx={{
        mb: 0.5,
        '& p': { typography: 'body2', m: 0 },
        '& a': { color: 'inherit', textDecoration: 'none' },
        '& strong': { typography: 'subtitle2' },
      }}
    />
  );
}

function getIcon(type: NotificationType) {
  switch (type) {
    case NotificationType.TASK_ASSIGNED:
    case NotificationType.TASK_UPDATED:
      return 'solar:checklist-minimalistic-bold-duotone';
    case NotificationType.TASK_COMMENTED:
      return 'solar:chat-round-dots-bold-duotone';
    case NotificationType.TASK_MENTIONED:
      return 'solar:mention-circle-bold-duotone';
    case NotificationType.TASK_DUE_SOON:
      return 'solar:clock-circle-bold-duotone';
    case NotificationType.TASK_OVERDUE:
      return 'solar:danger-triangle-bold-duotone';
    case NotificationType.PROJECT_ASSIGNED:
    case NotificationType.PROJECT_UPDATED:
      return 'solar:folder-bold-duotone';
    case NotificationType.SPRINT_STARTED:
    case NotificationType.SPRINT_ENDED:
      return 'solar:calendar-bold-duotone';
    case NotificationType.TEAM_MEMBER_ADDED:
    case NotificationType.TEAM_MEMBER_REMOVED:
      return 'solar:users-group-rounded-bold-duotone';
    case NotificationType.MENTION:
      return 'solar:mention-circle-bold-duotone';
    case NotificationType.SYSTEM:
      return 'solar:settings-bold-duotone';
    default:
      return 'solar:bell-bing-bold-duotone';
  }
}

function renderContent(notification: Notification) {
  const title = (
    <Typography variant="subtitle2">
      {notification.title}
      <Typography component="span" variant="body2" sx={{ color: 'text.secondary' }}>
        &nbsp; {notification.message}
      </Typography>
    </Typography>
  );

  if (notification.type === NotificationType.TASK_ASSIGNED) {
    return {
      avatarUrl: notification.actor?.profilePicture || null,
      title,
    };
  }
  
  return {
    avatarUrl: notification.actor?.profilePicture || null,
    title,
  };
}

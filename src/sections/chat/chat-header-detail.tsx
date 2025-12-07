import type { IChatParticipant, SendMessageDto, SendMessageResponse } from 'src/types/chat';
import { MessageType } from 'src/types/chat';

import { useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import AvatarGroup, { avatarGroupClasses } from '@mui/material/AvatarGroup';

import { useResponsive } from 'src/hooks/use-responsive';
import { useAuthContext } from 'src/auth/hooks';

import { fToNow } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { ChatHeaderSkeleton } from './chat-skeleton';

import type { UseNavCollapseReturn } from './hooks/use-collapse-nav';

// ----------------------------------------------------------------------

type Props = {
  loading: boolean;
  participants: IChatParticipant[];
  collapseNav: UseNavCollapseReturn;
  selectedConversationId?: string;
  onSendMessage?: (payload: SendMessageDto, callback?: (response: SendMessageResponse) => void) => void;
};

export function ChatHeaderDetail({ 
  collapseNav, 
  participants, 
  loading,
  selectedConversationId,
  onSendMessage,
}: Props) {
  const popover = usePopover();
  const { user } = useAuthContext();

  const lgUp = useResponsive('up', 'lg');

  const group = participants.length > 1;

  const singleParticipant = participants[0];

  const { collapseDesktop, onCollapseDesktop, onOpenMobile } = collapseNav;

  const generateUniqueId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
  };

const generateRoom = useCallback(
  async (isAudioCall: boolean = false) => {
    if (!selectedConversationId || !onSendMessage) {
      console.error('Cannot generate room: missing conversation ID or send function');
      return null;
    }

    const roomId = generateUniqueId();
    const callType = isAudioCall ? 'audio' : 'video';
    const link = `${window.location.origin}/call?roomId=${roomId}${
      isAudioCall ? '&isAudioCall=true' : ''
    }`;

    const meetingMessage = `🎥 Join the ${callType} call: ${link}`;

    onSendMessage(
      {
        roomId: selectedConversationId,
        content: meetingMessage,
        type: MessageType.TEXT,
      },
      (response) => {
        if (response.success) {
          console.log(`${callType} call link sent successfully`);

          // 👇 Redirect user to the call page in the SAME TAB
          window.location.href = link;
        } else {
          console.error(`Failed to send ${callType} call link:`, response.error);
        }
      }
    );

    return link;
  },
  [selectedConversationId, onSendMessage]
);


  const handleToggleNav = useCallback(() => {
    if (lgUp) {
      onCollapseDesktop();
    } else {
      onOpenMobile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lgUp]);

  const renderGroup = (
    <AvatarGroup max={3} sx={{ [`& .${avatarGroupClasses.avatar}`]: { width: 32, height: 32 } }}>
      {participants.map((participant) => (
        <Avatar key={participant.id} alt={participant.name} src={participant.avatarUrl} />
      ))}
    </AvatarGroup>
  );

  const renderSingle = (
    <Stack direction="row" alignItems="center" spacing={2}>
      <Badge
        variant={singleParticipant?.status}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Avatar src={singleParticipant?.avatarUrl} alt={singleParticipant?.name} />
      </Badge>

      <ListItemText
        primary={singleParticipant?.name}
        secondary={
          singleParticipant?.status === 'offline'
            ? fToNow(singleParticipant?.lastActivity)
            : singleParticipant?.status
        }
        secondaryTypographyProps={{
          component: 'span',
          ...(singleParticipant?.status !== 'offline' && { textTransform: 'capitalize' }),
        }}
      />
    </Stack>
  );

  if (loading) {
    return <ChatHeaderSkeleton />;
  }

  return (
    <>
      {group ? renderGroup : renderSingle}

      <Stack direction="row" flexGrow={1} justifyContent="flex-end">
        <IconButton onClick={() => generateRoom(true)}>
          <Iconify icon="solar:phone-bold" />
        </IconButton>

        <IconButton onClick={() => generateRoom(false)}>
          <Iconify icon="solar:videocamera-record-bold" />
        </IconButton>

        <IconButton onClick={handleToggleNav}>
          <Iconify icon={!collapseDesktop ? 'ri:sidebar-unfold-fill' : 'ri:sidebar-fold-fill'} />
        </IconButton>

        <IconButton onClick={popover.onOpen}>
          <Iconify icon="eva:more-vertical-fill" />
        </IconButton>
      </Stack>

      <CustomPopover open={popover.open} anchorEl={popover.anchorEl} onClose={popover.onClose}>
        <MenuList>
          <MenuItem
            onClick={() => {
              popover.onClose();
            }}
          >
            <Iconify icon="solar:bell-off-bold" />
            Hide notifications
          </MenuItem>

          <MenuItem
            onClick={() => {
              popover.onClose();
            }}
          >
            <Iconify icon="solar:forbidden-circle-bold" />
            Block
          </MenuItem>

          <MenuItem
            onClick={() => {
              popover.onClose();
            }}
          >
            <Iconify icon="solar:danger-triangle-bold" />
            Report
          </MenuItem>

          <Divider sx={{ borderStyle: 'dashed' }} />

          <MenuItem
            onClick={() => {
              popover.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            Delete
          </MenuItem>
        </MenuList>
      </CustomPopover>
    </>
  );
}

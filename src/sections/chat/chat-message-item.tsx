import { formatDistanceToNowStrict } from 'date-fns';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';

import { useAuthContext } from 'src/auth/hooks';
import { fToNow } from 'src/utils/format-time';
import { Iconify } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import type { IChatMessage, IChatParticipant } from 'src/types/chat';
import { MessageType } from 'src/types/chat';

import { getMessage } from './utils/get-message';

// ----------------------------------------------------------------------

type Props = {
  message: IChatMessage;
  participants: IChatParticipant[];
  onOpenLightbox: (value: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function ChatMessageItem({ message, participants, onOpenLightbox, onEdit, onDelete }: Props) {
  const { user } = useAuthContext();
  const popover = usePopover();

  const { me, senderDetails, hasImage } = getMessage({
    message,
    participants,
    currentUserId: `${user?.id}`,
  });

  const { firstName, avatarUrl } = senderDetails;

  const { content, createdAt, type, fileUrl, fileName, fileSize, mimeType } = message;

  // Helper to format file size
  const formatFileSize = (bytes: number | null | undefined): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Helper to get file icon based on MIME type
  const getFileIcon = (mime: string | null | undefined): string => {
    if (!mime) return 'eva:file-text-outline';
    if (mime.startsWith('image/')) return 'eva:image-outline';
    if (mime.startsWith('video/')) return 'eva:video-outline';
    if (mime.startsWith('audio/')) return 'eva:music-outline';
    if (mime.includes('pdf')) return 'eva:file-text-outline';
    return 'eva:file-outline';
  };

  const renderInfo = (
    <Typography
      noWrap
      variant="caption"
      sx={{
        mb: 1,
        color: 'text.disabled',
        ...(!me && {
          mr: 'auto',
        }),
      }}
    >
      {!me && `${firstName},`} &nbsp;
      {fToNow(createdAt)}
    </Typography>
  );

  const renderBody = (
    <Stack
      sx={{
        p: 1.5,
        minWidth: 48,
        maxWidth: 320,
        borderRadius: 1,
        typography: 'body2',
        bgcolor: 'background.neutral',
        ...(me && {
          color: 'grey.800',
          bgcolor: 'primary.lighter',
        }),
        ...(hasImage && {
          p: 0,
          bgcolor: 'transparent',
        }),
      }}
    >
      {hasImage ? (
        <Box
          component="img"
          alt="attachment"
          src={fileUrl || content}
          onClick={() => onOpenLightbox(fileUrl || content)}
          loading="lazy"
          sx={{
            minHeight: 220,
            maxWidth: '100%',
            borderRadius: 1.5,
            cursor: 'pointer',
            objectFit: 'cover',
            '&:hover': {
              opacity: 0.9,
            },
          }}
        />
      ) : (
        <>
           {/* File Attachment Display */}
           {type === MessageType.FILE && fileUrl && (
            <Stack 
              direction="row" 
              alignItems="center" 
              spacing={2} 
              sx={{ 
                mb: content ? 1 : 0,
                p: 1,
                borderRadius: 1,
                bgcolor: 'background.paper',
                border: (theme) => `1px solid ${theme.palette.divider}`
              }}
            >
              <Iconify icon={getFileIcon(mimeType)} width={32} height={32} sx={{ color: 'text.secondary' }} />
              <Stack sx={{ minWidth: 0, flexGrow: 1 }}>
                <Typography variant="subtitle2" noWrap>
                  {fileName || 'Unknown file'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {formatFileSize(fileSize)}
                </Typography>
              </Stack>
              <IconButton 
                size="small" 
                href={fileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <Iconify icon="eva:download-outline" />
              </IconButton>
            </Stack>
          )}
          
          {content && <Box sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{content}</Box>}
        </>
      )}
    </Stack>
  );

  const renderActions = (
    <Stack
      direction="row"
      alignItems="center"
      className="message-actions"
      sx={{
        pt: 0.5,
        opacity: 0,
        top: '100%',
        position: 'absolute',
        transition: (theme) =>
          theme.transitions.create(['opacity'], { duration: theme.transitions.duration.shorter }),
        ...(me ? { right: 0 } : { left: 0 }),
      }}
    >
      {me && (
        <IconButton size="small" onClick={popover.onOpen}>
          <Iconify icon="eva:more-vertical-fill" width={16} />
        </IconButton>
      )}
    </Stack>
  );

  return (
    <Stack direction="row" justifyContent={me ? 'flex-end' : 'flex-start'} sx={{ mb: 3 }}>
      {!me && (
        <Avatar
          alt={firstName}
          src={avatarUrl}
          sx={{
            width: 32,
            height: 32,
            mr: 2,
          }}
        />
      )}

      <Stack alignItems={me ? 'flex-end' : 'flex-start'}>
        {renderInfo}

        <Stack
          direction="row"
          alignItems="center"
          sx={{
            position: 'relative',
            '&:hover .message-actions': {
              opacity: 1,
            },
          }}
        >
          {renderBody}
          {renderActions}
        </Stack>
      </Stack>

        <CustomPopover
          open={popover.open}
          onClose={popover.onClose}
      
          sx={{ width: 140 }}
        >
          {onEdit && type === MessageType.TEXT && (
            <MenuItem
              onClick={() => {
                popover.onClose();
                onEdit();
              }}
            >
              <Iconify icon="solar:pen-bold" />
              Edit
            </MenuItem>
          )}

        {onDelete && (
          <MenuItem
            onClick={() => {
              popover.onClose();
              onDelete();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            Delete
          </MenuItem>
        )}
      </CustomPopover>
    </Stack>
  );
}

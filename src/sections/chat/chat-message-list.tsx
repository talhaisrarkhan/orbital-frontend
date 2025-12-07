import { useRef, useEffect } from 'react';
import type { IChatMessage, IChatParticipant } from 'src/types/chat';
import { MessageType } from 'src/types/chat';

import Stack from '@mui/material/Stack';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { Scrollbar } from 'src/components/scrollbar';
import { Lightbox, useLightBox } from 'src/components/lightbox';

import { ChatMessageItem } from './chat-message-item';
import { useMessagesScroll } from './hooks/use-messages-scroll';

// ----------------------------------------------------------------------

type Props = {
  loading: boolean;
  messages: IChatMessage[];
  participants: IChatParticipant[];
  typingUsers?: number[];
  onEdit?: (message: IChatMessage) => void;
  onDelete?: (messageId: string) => void;
};

export function ChatMessageList({ 
  messages = [], 
  participants, 
  loading, 
  typingUsers = [],
  onEdit,
  onDelete,
}: Props) {
  const { messagesEndRef } = useMessagesScroll(messages);

  const slides = messages
    .filter((message) => message.type === MessageType.IMAGE)
    .map((message) => ({ src: message.fileUrl || message.content }));

  const lightbox = useLightBox(slides);

  // Get typing user names
  const typingUserNames = typingUsers
    .map((userId) => {
      const participant = participants.find((p) => p.id === userId.toString());
      return participant?.name || 'Someone';
    })
    .filter(Boolean);

  if (loading && messages.length === 0) {
    return (
      <Stack sx={{ flex: '1 1 auto', position: 'relative' }}>
        <LinearProgress
          color="inherit"
          sx={{
            top: 0,
            left: 0,
            width: 1,
            height: 2,
            borderRadius: 0,
            position: 'absolute',
          }}
        />
      </Stack>
    );
  }

  return (
    <>
      <Scrollbar ref={messagesEndRef} sx={{ px: 3, pt: 5, pb: 3, flex: '1 1 auto' }}>
        
        {messages.map((message) => (
          <ChatMessageItem
            key={message.id}
            message={message}
            participants={participants}
            onOpenLightbox={() => lightbox.onOpen(message.content)}
            onEdit={onEdit ? () => onEdit(message) : undefined}
            onDelete={onDelete ? () => onDelete(message.id) : undefined}
          />
        ))}

        {/* Typing Indicator */}
        {typingUserNames.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mt: 2,
              mb: 1,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                gap: 0.5,
                px: 1.5,
                py: 1,
                borderRadius: 1.5,
                bgcolor: 'action.hover',
              }}
            >
              <Box
                component="span"
                sx={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  bgcolor: 'text.disabled',
                  animation: 'typing 1.4s infinite ease-in-out both',
                  '&:nth-of-type(1)': { animationDelay: '-0.32s' },
                  '&:nth-of-type(2)': { animationDelay: '-0.16s' },
                }}
              />
              <Box
                component="span"
                sx={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  bgcolor: 'text.disabled',
                  animation: 'typing 1.4s infinite ease-in-out both',
                  '&:nth-of-type(1)': { animationDelay: '-0.32s' },
                  '&:nth-of-type(2)': { animationDelay: '-0.16s' },
                }}
              />
              <Box
                component="span"
                sx={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  bgcolor: 'text.disabled',
                  animation: 'typing 1.4s infinite ease-in-out both',
                  '&:nth-of-type(1)': { animationDelay: '-0.32s' },
                  '&:nth-of-type(2)': { animationDelay: '-0.16s' },
                }}
              />
            </Box>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {typingUserNames.join(', ')} is typing...
            </Typography>
          </Box>
        )}
      </Scrollbar>

      <Lightbox
        index={lightbox.selected}
        slides={slides}
        open={lightbox.open}
        close={lightbox.onClose}
      />
    </>
  );
}

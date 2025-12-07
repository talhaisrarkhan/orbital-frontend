import { useRef, useMemo, useState, useCallback, useEffect } from 'react';

import Stack from '@mui/material/Stack';
import InputBase from '@mui/material/InputBase';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { today } from 'src/utils/format-time';

import { sendMessage, createConversation } from 'src/actions/chat';

import { Iconify } from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';

import { useAuthContext } from 'src/auth/hooks';
import { useChatSocket } from 'src/hooks/use-chat-socket';
import { useChatFileUpload } from 'src/hooks/use-chat-file-upload';

import type { IChatMessage, IChatParticipant, SendMessageDto, SendMessageResponse } from 'src/types/chat';

import { initialConversation } from './utils/initial-conversation';

// ----------------------------------------------------------------------

type Props = {
  disabled: boolean;
  recipients: IChatParticipant[];
  selectedConversationId: string;
  onAddRecipients: (recipients: IChatParticipant[]) => void;
  onSendMessage?: (payload: SendMessageDto, callback?: (response: SendMessageResponse) => void) => void;
  onMessageSent?: (message: IChatMessage) => void;
  // Edit props
  editingMessage?: IChatMessage | null;
  onEditMessage?: (messageId: string, content: string) => Promise<void>;
  onCancelEdit?: () => void;
};

export function ChatMessageInput({
  disabled,
  recipients,
  onAddRecipients,
  selectedConversationId,
  onSendMessage,
  onMessageSent,
  editingMessage,
  onEditMessage,
  onCancelEdit,
}: Props) {
  const router = useRouter();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();

  const { user } = useAuthContext();

  const { sendMessage: sendSocketMessage, setTyping } = useChatSocket('/chat');

  const { uploadFile, uploads, isUploading } = useChatFileUpload();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Populate input when editingMessage changes
  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.content);
      // Focus input?
    }
  }, [editingMessage]);

  const myContact = useMemo(
    () => ({
      id: `${user?.id}`,
      role: `${user?.role}`,
      email: `${user?.email}`,
      address: `${user?.address || ''}`,
      name: `${user?.displayName || user?.name || ''}`,
      lastActivity: today(),
      avatarUrl: `${user?.photoURL || user?.profilePicture || ''}`,
      phoneNumber: `${user?.phoneNumber || ''}`,
      status: 'online' as 'online' | 'offline' | 'alway' | 'busy',
    }),
    [user]
  );

  const { messageData, conversationData } = initialConversation({
    message,
    recipients,
    me: myContact,
  });

  const handleAttach = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0 || !selectedConversationId) return;

      const file = files[0];

      // Validate file size (50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB in bytes
      if (file.size > maxSize) {
        enqueueSnackbar('File size exceeds maximum allowed size of 50MB', { variant: 'error' });
        return;
      }

      try {
        // Determine type based on MIME type
        const fileType = file.type.startsWith('image/') ? 'image' : 'file';

        console.log('📤 Uploading file:', { name: file.name, size: file.size, type: fileType, roomId: selectedConversationId });

        // Upload file and let the backend handle WebSocket broadcast
        const sentMessage = await uploadFile(file, selectedConversationId, fileType);

        console.log('✅ File uploaded successfully:', sentMessage);

        if (onMessageSent) {
          onMessageSent(sentMessage);
        }

        enqueueSnackbar('File uploaded successfully', { variant: 'success' });
      } catch (error: any) {
        console.error('❌ File upload failed:', error);
        console.error('Error details:', error.response?.data || error.message);
        enqueueSnackbar('Failed to upload file', { variant: 'error' });
      }

      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [selectedConversationId, uploadFile, enqueueSnackbar, onMessageSent]
  );

  const handleChangeMessage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newMessage = event.target.value;
    setMessage(newMessage);

    // Send typing indicator if user is typing and has a selected conversation
    if (selectedConversationId && newMessage.length > 0) {
      if (!isTyping) {
        setIsTyping(true);
        setTyping({ roomId: selectedConversationId, isTyping: true });
      }

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout to stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        setTyping({ roomId: selectedConversationId, isTyping: false });
      }, 2000);
    } else if (isTyping) {
      // User cleared the input, stop typing
      setIsTyping(false);
      if (selectedConversationId) {
        setTyping({ roomId: selectedConversationId, isTyping: false });
      }
    }
  }, [selectedConversationId, isTyping, setTyping]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);


  const handleSendMessage = useCallback(
    async (event?: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>) => {
      // If triggered by keyup, only proceed if Enter key
      if (event && 'key' in event && event.key !== 'Enter') {
        return;
      }

      if (!message || !message.trim()) return;

      // Handle Edit Mode
      if (editingMessage && onEditMessage) {
        try {
          await onEditMessage(editingMessage.id, message);
          setMessage('');
          if (onCancelEdit) onCancelEdit();
        } catch (error) {
          console.error('Failed to edit message:', error);
        }
        return;
      }

      // Clear input immediately for instant feedback
      const messageContent = message;
      setMessage('');

      // Stop typing indicator
      if (isTyping && selectedConversationId) {
        setIsTyping(false);
        setTyping({ roomId: selectedConversationId, isTyping: false });
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }

      try {
        if (selectedConversationId) {
          
          // If the conversation already exists, use WebSocket if available
          if (onSendMessage) {
            // Use WebSocket for instant delivery (non-blocking)
            onSendMessage(
              {
                roomId: selectedConversationId,
                content: messageContent,
                type: messageData.type,
                fileUrl: messageData.fileUrl,
              },
              (response) => {
                if (!response.success) {
                  console.error('Failed to send message via WebSocket:', response.error);
                  // Fallback to HTTP on error
                
                }
              }
            );
          } else {
            // Fallback to HTTP if WebSocket not available
            await sendMessage(selectedConversationId, {
              content: messageContent,
              type: messageData.type,
              fileUrl: messageData.fileUrl,
              roomId: selectedConversationId,
            });
          }
        } else {
          // If the conversation does not exist, create it via HTTP
          const res = await createConversation({
            participantIds: conversationData.participantIds,
            type: conversationData.type,
            name: conversationData.name,
          });
          router.push(`${paths.dashboard.chat}?id=${res.id}`);

          onAddRecipients([]);
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        // Restore message on error
        setMessage(messageContent);
      }
    },
    [conversationData, message, messageData, onAddRecipients, onSendMessage, router, selectedConversationId, isTyping, setTyping, editingMessage, onEditMessage, onCancelEdit]
  );

  const handleKeyUp = async (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter') {
    await handleSendMessage();
  }
};

  return (
    <Stack>
      {/* Upload Progress Display */}
      {uploads.length > 0 && (
        <Stack
          spacing={1}
          sx={{
            px: 2,
            py: 1,
            borderTop: (theme) => `solid 1px ${theme.vars.palette.divider}`,
            bgcolor: 'background.neutral',
          }}
        >
          {uploads.map((upload) => (
            <Stack
              key={upload.fileName}
              direction="row"
              alignItems="center"
              spacing={2}
              sx={{
                px: 2,
                py: 1,
                borderRadius: 1,
                bgcolor: 'background.paper',
              }}
            >
              <Iconify
                icon={
                  upload.status === 'success'
                    ? 'eva:checkmark-circle-2-fill'
                    : upload.status === 'error'
                    ? 'eva:alert-circle-fill'
                    : 'eva:loader-outline'
                }
                sx={{
                  width: 20,
                  height: 20,
                  color:
                    upload.status === 'success'
                      ? 'success.main'
                      : upload.status === 'error'
                      ? 'error.main'
                      : 'text.secondary',
                  animation: upload.status === 'uploading' ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                }}
              />
              <Stack flex={1} spacing={0.5}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                    {upload.fileName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {upload.progress}%
                  </Typography>
                </Stack>
                {upload.status === 'uploading' && (
                  <Box
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      bgcolor: 'action.hover',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        width: `${upload.progress}%`,
                        bgcolor: 'primary.main',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </Box>
                )}
                {upload.status === 'error' && (
                  <Typography variant="caption" color="error">
                    {upload.error || 'Upload failed'}
                  </Typography>
                )}
              </Stack>
            </Stack>
          ))}
        </Stack>
      )}

      <InputBase
        name="chat-message"
        id="chat-message-input"
        value={message}
        onKeyUp={handleKeyUp}
        onChange={handleChangeMessage}
        placeholder="Type a message"
        disabled={disabled || isUploading}
        startAdornment={
          <IconButton>
            <Iconify icon="eva:smiling-face-fill" />
          </IconButton>
        }
        endAdornment={
          <Stack direction="row" spacing={1} sx={{ flexShrink: 0, mr: 1.5 }}>
            {editingMessage && (
              <IconButton onClick={onCancelEdit} size="small" sx={{ color: 'error.main' }}>
                <Iconify icon="eva:close-fill" />
              </IconButton>
            )}
            
            <IconButton disabled={disabled || isUploading} onClick={handleAttach}>
              <Iconify icon="solar:gallery-add-bold" />
            </IconButton>
            <IconButton disabled={disabled || isUploading} onClick={handleAttach}>
              <Iconify icon="eva:attach-2-fill" />
            </IconButton>
            <IconButton disabled={disabled || isUploading} onClick={handleSendMessage}>
              <Iconify icon={editingMessage ? "eva:checkmark-fill" : "iconamoon:send-fill"} />
            </IconButton>
          </Stack>
        }
        sx={{
          px: 1,
          height: 56,
          flexShrink: 0,
          borderTop: (theme) => `solid 1px ${theme.vars.palette.divider}`,
        }}
      />

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z,video/*,audio/*"
      />
    </Stack>
  );
}

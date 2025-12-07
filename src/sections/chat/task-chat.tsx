import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import { alpha, useTheme } from '@mui/material/styles';

import { useMockedUser } from 'src/auth/hooks';
import { useChatSocket } from 'src/hooks/use-chat-socket';

import { endpoints, fetcher } from 'src/utils/axios';
import { fToNow } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { IChatMessage, IChatRoom, MessageType } from 'src/types/chat';

// ----------------------------------------------------------------------

type Props = {
  taskId: string;
};

export function TaskChat({ taskId }: Props) {
  const theme = useTheme();
  const { user } = useMockedUser();
  const {
    socket,
    isConnected,
    joinRoom,
    leaveRoom,
    sendMessage,
    setTyping,
    markAsRead,
    on,
    off,
  } = useChatSocket('/chat');
  
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch task details to get participants (creator and assignee)
  const { data: task } = useSWR(
    taskId ? endpoints.task.details(taskId) : null,
    fetcher
  );

  // Fetch task chat room
  const { data: room, isLoading: roomLoading } = useSWR<IChatRoom>(
    taskId ? endpoints.taskChat.room(taskId) : null,
    fetcher
  );

  // Fetch messages when room is available
  const { data: initialMessages, mutate: mutateMessages } = useSWR<IChatMessage[]>(
    room?.id ? endpoints.chatRoom.messages(room.id) : null,
    fetcher
  );

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages.reverse());
    }
  }, [initialMessages]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (!socket || !room?.id) return;

    // Join room
    joinRoom({ roomId: room.id }, (response) => {
      if (response.success) {
        console.log('Joined task chat room:', room.id);
      } else {
        console.error('Failed to join room:', response.error);
      }
    });

    // Listen for new messages
    const handleNewMessage = (message: IChatMessage) => {
      if (message.roomId === room.id) {
        setMessages((prev) => [...prev, message]);
        // Auto-mark as read
        if (message.senderId !== Number(user?.id)) {
          markAsRead({ messageId: message.id });
        }
      }
    };

    // Listen for typing
    const handleUserTyping = ({ userId, isTyping: typing }: { userId: number; isTyping: boolean }) => {
      // Handle typing indicator if needed
      console.log(`User ${userId} is ${typing ? 'typing' : 'stopped typing'}`);
    };

    on('newMessage', handleNewMessage);
    on('userTyping', handleUserTyping);

    return () => {
      leaveRoom({ roomId: room.id });
      off('newMessage', handleNewMessage);
      off('userTyping', handleUserTyping);
    };
  }, [socket, room?.id, user?.id, joinRoom, leaveRoom, markAsRead, on, off]);

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !room?.id) return;

    const content = inputMessage.trim();
    setInputMessage('');

    // Use typed sendMessage method
    sendMessage(
      {
        roomId: room.id,
        content,
        type: MessageType.TEXT,
      },
      (response) => {
        if (!response.success) {
          console.error('Failed to send message:', response.error);
          // Restore message to input on error
          setInputMessage(content);
        }
      }
    );
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (value: string) => {
    setInputMessage(value);
    
    if (room?.id) {
      // Send typing indicator
      if (value && !isTyping) {
        setIsTyping(true);
        setTyping({ roomId: room.id, isTyping: true });
      } else if (!value && isTyping) {
        setIsTyping(false);
        setTyping({ roomId: room.id, isTyping: false });
      }
    }
  };

  const handleInputBlur = () => {
    if (room?.id && isTyping) {
      setIsTyping(false);
      setTyping({ roomId: room.id, isTyping: false });
    }
  };

  if (roomLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!room) {
    return (
      <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
        <Typography variant="body2">No chat room available for this task.</Typography>
      </Box>
    );
  }

  // Get participants from task (creator and assignee)
  const participants = [];
  if (task?.creator) {
    participants.push({
      id: task.creator.id,
      name: task.creator.name,
      avatarUrl: task.creator.profilePicture,
    });
  }
  if (task?.assignee && task.assignee.id !== task?.creator?.id) {
    participants.push({
      id: task.assignee.id,
      name: task.assignee.name,
      avatarUrl: task.assignee.profilePicture,
    });
  }

  return (
    <Stack sx={{ height: '100%', overflow: 'hidden' }}>
      <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle2">Task Discussion</Typography>
            <Typography variant="caption" color="text.secondary">
              {participants.length} participant{participants.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
          <Stack direction="row" spacing={-1}>
            {participants.map((participant) => (
              <Avatar
                key={participant.id}
                alt={participant.name}
                src={participant.avatarUrl}
                sx={{
                  width: 32,
                  height: 32,
                  border: `2px solid ${theme.palette.background.paper}`,
                }}
              />
            ))}
          </Stack>
        </Stack>
      </Box>

      <Scrollbar sx={{ flex: 1, p: 2 }}>
        <Stack spacing={2}>
          {messages.map((msg) => {
            const isMe = msg.senderId === Number(user?.id);
            
            return (
              <Stack
                key={msg.id}
                direction="row"
                justifyContent={isMe ? 'flex-end' : 'flex-start'}
                spacing={1}
              >
                {!isMe && (
                  <Avatar
                    alt={msg.sender?.name}
                    src={msg.sender?.profilePicture}
                    sx={{ width: 32, height: 32 }}
                  />
                )}

                <Stack alignItems={isMe ? 'flex-end' : 'flex-start'}>
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: 1.5,
                      bgcolor: isMe ? 'primary.main' : alpha(theme.palette.grey[500], 0.12),
                      color: isMe ? 'primary.contrastText' : 'text.primary',
                      maxWidth: 320,
                    }}
                  >
                    <Typography variant="body2">{msg.content}</Typography>
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 0.5,
                      color: 'text.disabled',
                    }}
                  >
                    {!isMe && msg.sender?.name ? `${msg.sender.name}, ` : ''}
                    {fToNow(msg.createdAt)}
                  </Typography>
                </Stack>
              </Stack>
            );
          })}
          <div ref={messagesEndRef} />
        </Stack>
      </Scrollbar>

      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            size="small"
            placeholder="Type a message..."
            value={inputMessage}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyPress}
            onBlur={handleInputBlur}
            multiline
            maxRows={3}
            disabled={!isConnected}
          />
          <IconButton 
            color="primary" 
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || !isConnected}
          >
            <Iconify icon="solar:plain-2-bold-duotone" />
          </IconButton>
        </Stack>
      </Box>
    </Stack>
  );
}

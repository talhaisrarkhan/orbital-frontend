'use client';

import type { IChatParticipant, IChatMessage, SendMessageDto, SendMessageResponse, UserTypingEvent, MessageDeletedEvent } from 'src/types/chat';
import { MessageType, ChatRoomType } from 'src/types/chat';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { mutate } from 'swr';

import { uuidv4 } from 'src/utils/uuidv4';
import { endpoints } from 'src/utils/axios';

import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetContacts, useGetConversation, useGetConversations, sendMessage, editMessage, deleteMessage } from 'src/actions/chat';

import { EmptyContent } from 'src/components/empty-content';
import { Scrollbar } from 'src/components/scrollbar';

import { useAuthContext } from 'src/auth/hooks';
import { useChatSocket } from 'src/hooks/use-chat-socket';
import { useChatMessages } from 'src/hooks/use-chat-messages';

import { Layout } from '../layout';
import { ChatNav } from '../chat-nav';
import { ChatRoom } from '../chat-room';
import { ChatMessageList } from '../chat-message-list';
import { ChatMessageInput } from '../chat-message-input';
import { ChatHeaderDetail } from '../chat-header-detail';
import { ChatHeaderCompose } from '../chat-header-compose';
import { useCollapseNav } from '../hooks/use-collapse-nav';
import { Stack } from '@mui/material';

// ----------------------------------------------------------------------

export function ChatView() {
  const router = useRouter();

  const { user } = useAuthContext();

  const { contacts } = useGetContacts();

  const searchParams = useSearchParams();

  const selectedConversationId = searchParams.get('id') || '';

  const [recipients, setRecipients] = useState<IChatParticipant[]>([]);

  const { conversations, conversationsLoading } = useGetConversations();

  const { conversation, conversationError, conversationLoading } = useGetConversation(
    `${selectedConversationId}`
  );

  // WebSocket integration
  const {
    isConnected,
    joinRoom,
    leaveRoom,
    sendMessage: sendSocketMessage,
    on,
    off,
  } = useChatSocket('/chat');

  const [typingUsers, setTypingUsers] = useState<number[]>([]);
  
  // Use chat messages hook (fetches all messages)
  const {
    messages: localMessages,
    isLoading: messagesLoading,
    resetMessages,
    addMessage,
    updateMessage,
    removeMessage,
  } = useChatMessages(selectedConversationId);

  const [editingMessage, setEditingMessage] = useState<IChatMessage | null>(null);

  const handleEditMessage = useCallback(async (messageId: string, content: string) => {
    try {
      await editMessage(messageId, content);
      // Optimistic update
      updateMessage(messageId, { content, isEdited: true });
      setEditingMessage(null);
    } catch (error) {
      console.error('Failed to edit message:', error);
    }
  }, [updateMessage]);

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    try {
      await deleteMessage(messageId);
      // Optimistic update
      removeMessage(messageId);
      mutate(endpoints.chatRoom.list);
    } catch (error) {
      console.error('Failed to delete message:', error);
    }
  }, [removeMessage]);

  const handleCancelEdit = useCallback(() => {
    setEditingMessage(null);
  }, []);
  
  // Join/leave room when conversation changes
  useEffect(() => {
    if (!selectedConversationId || !isConnected) return;

    joinRoom({ roomId: selectedConversationId }, (response) => {
      if (response.success) {
        console.log('Joined chat room:', selectedConversationId);
      } else {
        console.error('Failed to join room:', response.error);
      }
    });

    return () => {
      leaveRoom({ roomId: selectedConversationId });
    };
  }, [selectedConversationId, isConnected, joinRoom, leaveRoom]);

  // Listen for new messages via WebSocket
  useEffect(() => {
    if (!selectedConversationId) return;

    const handleNewMessage = (message: IChatMessage) => {
      if (message.roomId !== selectedConversationId) return;

      // Ignore own text messages to prevent duplicates with optimistic updates
      // We handle own text messages via handleSendMessage response
      if (message.senderId === Number(user?.id) && message.type === 'text') {
        return;
      }

      // Check if message already exists (prevent duplicates)
      // addMessage handles duplicate check internally
      addMessage(message);

      // Update conversations list
      mutate(endpoints.chatRoom.list);
    };

    on('newMessage', handleNewMessage);

    return () => {
      off('newMessage', handleNewMessage);
    };
  }, [selectedConversationId, on, off, addMessage]);

  // Listen for typing indicators
  useEffect(() => {
    if (!selectedConversationId) return;

    const handleUserTyping = ({ userId, isTyping }: UserTypingEvent) => {
      // Don't show typing indicator for yourself
      if (userId === Number(user?.id)) return;

      if (isTyping) {
        setTypingUsers((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
      } else {
        setTypingUsers((prev) => prev.filter((id) => id !== userId));
      }
    };

    on('userTyping', handleUserTyping);

    return () => {
      off('userTyping', handleUserTyping);
    };
  }, [selectedConversationId, on, off, user?.id]);

  // Listen for message edits
  useEffect(() => {
    if (!selectedConversationId) return;

    const handleMessageEdited = (editedMessage: IChatMessage) => {
      if (editedMessage.roomId === selectedConversationId) {
        updateMessage(editedMessage.id, editedMessage);
        
        // Update conversations list for latest message
        mutate(endpoints.chatRoom.list);
      }
    };

    on('messageEdited', handleMessageEdited);

    return () => {
      off('messageEdited', handleMessageEdited);
    };
  }, [selectedConversationId, on, off, updateMessage]);

  // Listen for message deletes
  useEffect(() => {
    if (!selectedConversationId) return;

    const handleMessageDeleted = ({ messageId }: MessageDeletedEvent) => {
     
        removeMessage(messageId);
        
        // Update conversations list
        mutate(endpoints.chatRoom.list);
    
    };

    on('messageDeleted', handleMessageDeleted);

    return () => {
      off('messageDeleted', handleMessageDeleted);
    };
  }, [selectedConversationId, on, off, removeMessage]);

  const roomNav = useCollapseNav();

  const conversationsNav = useCollapseNav();

  const participants: IChatParticipant[] = conversation?.participants
    ? conversation.participants
        .filter((participant) => participant.id.toString() !== `${user?.id}`)
        .map((participant) => ({
          id: participant.id.toString(),
          name: participant.name,
          email: participant.email,
          avatarUrl: participant.profilePicture || '',
          role: participant.role,
          status: (participant.isActive ? 'online' : 'offline') as 'online' | 'offline' | 'alway' | 'busy',
          lastActivity: new Date(),
          phoneNumber: '',
          address: '',
        }))
    : [];

  useEffect(() => {
    if (conversationError || !selectedConversationId) {
      router.push(paths.dashboard.chat);
    }
  }, [conversationError, router, selectedConversationId]);

  const handleAddRecipients = useCallback((selected: IChatParticipant[]) => {
    setRecipients(selected);
  }, []);

  const handleSendMessage = useCallback(
    (payload: SendMessageDto, callback?: (response: SendMessageResponse) => void) => {
      // Optimistic update
      const tempId = uuidv4();
      const tempMessage: IChatMessage = {
        id: tempId,
        roomId: payload.roomId,
        senderId: Number(user?.id),
        sender: {
          id: Number(user?.id),
          name: user?.displayName || user?.name || 'You',
          email: user?.email || '',
          profilePicture: user?.photoURL || user?.profilePicture || '',
          role: user?.role || '',
          isActive: true,
        },
        content: payload.content,
        type: payload.type || MessageType.TEXT,
        fileUrl: payload.fileUrl || null,
        readBy: [],
        isEdited: false,
        isDeleted: false,
        createdAt: new Date().toISOString(),
      };

      addMessage(tempMessage);

      console.log('🚀 Sending message:', { roomId: payload.roomId, content: payload.content, type: payload.type });

      // Use REST API for sending message as requested
      sendMessage(payload.roomId, payload)
        .then((response) => {
          console.log('✅ Message sent successfully:', response);
          
          // Replace temp message with real one from server response
          // updateMessage handles partial updates, but here we want to replace the whole object including ID
          // Wait, updateMessage updates by ID. We can't change ID with updateMessage.
          // We need to remove temp and add real.
          removeMessage(tempId);
          addMessage(response);
          
          // Update conversations list to show latest message and move to top
          mutate(endpoints.chatRoom.list);
          
          if (callback) callback({ success: true, message: response });
        })
        .catch((error) => {
          console.error('❌ Failed to send message:', error);
          console.error('Error details:', error.response?.data || error.message);
          
          // Remove temp message on failure
          removeMessage(tempId);
          
          if (callback) callback({ success: false, error });
        });
    },
    [user, addMessage, removeMessage]
  );

  const handleMessageSent = useCallback(
    (message: IChatMessage) => {
      addMessage(message);
      mutate(endpoints.chatRoom.list);
    },
    [addMessage]
  );

  // Filter out PROJECT and TASK conversations
  const filteredConversations = useMemo(() => {
    if (!conversations.allIds.length) return conversations;

    const filteredIds = conversations.allIds.filter((id) => {
      const conversation = conversations.byId[id];
      return conversation.type !== ChatRoomType.PROJECT && conversation.type !== ChatRoomType.TASK;
    });

    return {
      byId: conversations.byId,
      allIds: filteredIds,
    };
  }, [conversations]);

  const renderHead = (
    <Stack
      direction="row"
      alignItems="center"
      flexShrink={0}
      sx={{ pr: 1, pl: 2.5, py: 1, minHeight: 72 }}
    >
      {selectedConversationId ? (
        <ChatHeaderDetail
          collapseNav={roomNav}
          participants={participants}
          loading={conversationLoading}
          selectedConversationId={selectedConversationId}
          onSendMessage={handleSendMessage}
        />
      ) : (
        <ChatHeaderCompose contacts={contacts} onAddRecipients={handleAddRecipients} />
      )}
    </Stack>
  );

  const renderNav = (
    <ChatNav
      contacts={contacts}
      conversations={filteredConversations}
      loading={conversationsLoading}
      selectedConversationId={selectedConversationId}
      collapseNav={conversationsNav}
    />
  );

  return (
    <DashboardContent
      maxWidth={false}
      sx={{ display: 'flex', flex: '1 1 auto', flexDirection: 'column' }}
    >
      <Typography variant="h4" sx={{ mb: { xs: 3, md: 5 } }}>
        Chat
      </Typography>

      <Layout
        sx={{
          minHeight: 0,
          flex: '1 1 0',
          borderRadius: 2,
          position: 'relative',
          bgcolor: 'background.paper',
          boxShadow: (theme) => theme.customShadows.card,
        }}
        slots={{
          header: renderHead,
          nav: renderNav,
          main: (
            <>
              {selectedConversationId ? (
                <>
                  <Stack sx={{ flexGrow: 1, overflow: 'hidden' }}>
                    <Scrollbar sx={{ height: 1 }}>
                      <ChatMessageList
                        messages={localMessages}
                        participants={participants}
                        loading={conversationLoading || messagesLoading}
                        typingUsers={typingUsers}
                        onEdit={(message) => setEditingMessage(message)}
                        onDelete={(messageId) => handleDeleteMessage(messageId)}
                      />
                    </Scrollbar>
                  </Stack>

                  <ChatMessageInput
                    recipients={recipients}
                    onAddRecipients={handleAddRecipients}
                    selectedConversationId={selectedConversationId}
                    disabled={!selectedConversationId}
                    onSendMessage={handleSendMessage}
                    onMessageSent={handleMessageSent}
                    editingMessage={editingMessage}
                    onEditMessage={handleEditMessage}
                    onCancelEdit={handleCancelEdit}
                  />
                </>
              ) : recipients.length > 0 ? (
                <>
                  <Stack sx={{ flexGrow: 1, height: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <EmptyContent
                      imgUrl="/assets/icons/empty/ic_content.svg"
                      title="Start a conversation"
                      description="Type a message to start chatting"
                    />
                  </Stack>

                  <ChatMessageInput
                    recipients={recipients}
                    onAddRecipients={handleAddRecipients}
                    selectedConversationId={selectedConversationId}
                    disabled={false}
                    onSendMessage={handleSendMessage}
                    onMessageSent={handleMessageSent}
                  />
                </>
              ) : (
                <Stack sx={{ flexGrow: 1, height: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <EmptyContent
                    imgUrl="/assets/icons/empty/ic_content.svg"
                    title="Good Morning!"
                    description="Select a conversation to start messaging"
                  />
                </Stack>
              )}
            </>
          ),
          details: selectedConversationId && (
            <ChatRoom
              collapseNav={roomNav}
              participants={participants}
              loading={conversationLoading}
              messages={localMessages}
            />
          ),
        }}
      />
    </DashboardContent>
  );
}

import type {
  IChatMessage,
  IChatRoom,
  IChatParticipant,
  SendMessageDto,
  CreateRoomDto,
  ChatRoomType,
} from 'src/types/chat';

import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import { keyBy } from 'src/utils/helper';
import axios, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------

const swrOptions = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ----------------------------------------------------------------------

type ContactsData = {
  contacts: IChatParticipant[];
};

export function useGetContacts() {
  // Fetch all users from backend - used for simple chat where any user can contact any other user
  const url = endpoints.userManagement.list;

  const { data, isLoading, error, isValidating } = useSWR<any[]>(url, fetcher, swrOptions);

  const memoizedValue = useMemo(
    () => ({
      contacts: (data || []).map(user => ({
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        avatarUrl: user.profilePicture,
        status: 'online' as const,
        role: user.role || 'member',
        lastActivity: new Date(),
      })) as IChatParticipant[],
      contactsLoading: isLoading,
      contactsError: error,
      contactsValidating: isValidating,
      contactsEmpty: !isLoading && !data?.length,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

type ConversationsData = {
  conversations: IChatRoom[];
};

export function useGetConversations() {
  const url = endpoints.chatRoom.list;

  const { data, isLoading, error, isValidating } = useSWR<IChatRoom[]>(
    url,
    fetcher,
    swrOptions
  );

  const memoizedValue = useMemo(() => {
    const byId = data?.length ? keyBy(data, 'id') : {};
    const allIds = Object.keys(byId);

    return {
      conversations: { byId, allIds },
      conversationsLoading: isLoading,
      conversationsError: error,
      conversationsValidating: isValidating,
      conversationsEmpty: !isLoading && !allIds.length,
    };
  }, [data, error, isLoading, isValidating]);

  return memoizedValue;
}

// ----------------------------------------------------------------------

type ConversationData = {
  conversation: IChatRoom;
};

export function useGetConversation(conversationId: string) {
  const url = conversationId
    ? endpoints.chatRoom.details(conversationId)
    : null;

  const { data, isLoading, error, isValidating } = useSWR<IChatRoom>(
    url,
    fetcher,
    swrOptions
  );

  const memoizedValue = useMemo(
    () => ({
      conversation: data,
      conversationLoading: isLoading,
      conversationError: error,
      conversationValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );

  return memoizedValue;
}

// ----------------------------------------------------------------------

export async function sendMessage(conversationId: string, messageData: SendMessageDto) {
  const conversationUrl = endpoints.chatRoom.details(conversationId);
  const messagesUrl = endpoints.chatRoom.messages(conversationId);

  const payload: SendMessageDto = {
    roomId: conversationId,
    content: messageData.content,
    type: messageData.type,
    fileUrl: messageData.fileUrl,
  };

  console.log('📨 Sending payload to backend:', payload);
  const response = await axios.post(endpoints.chatMessage.create, payload);
  console.log('📬 Backend response:', response);
  console.log('📦 Response data:', response.data);

  // Revalidate to get updated data
  console.log('🔄 Revalidating SWR cache for:', { messagesUrl, conversationUrl });
  await mutate(messagesUrl);
  await mutate(conversationUrl);
  console.log('✅ SWR cache revalidated');

  return response.data;
}

// ----------------------------------------------------------------------

export async function createConversation(conversationData: CreateRoomDto) {
  const url = endpoints.chatRoom.list;

  const res = await axios.post(endpoints.chatRoom.create, conversationData);

  mutate(url);

  return res.data;
}

// ----------------------------------------------------------------------

export async function clickConversation(conversationId: string) {
  await axios.post(endpoints.chatRoom.markAsRead(conversationId));

  // Revalidate conversations to update unread counts
  mutate(endpoints.chatRoom.list);
}

// ----------------------------------------------------------------------

// Additional helper functions for chat operations

export async function editMessage(messageId: string, content: string) {
  const response = await axios.patch(endpoints.chatMessage.update(messageId), { content });
  return response.data;
}

export async function deleteMessage(messageId: string) {
  const response = await axios.delete(endpoints.chatMessage.delete(messageId));
  return response.data;
}

export async function markMessageAsRead(messageId: string) {
  await axios.post(endpoints.chatMessage.markAsRead(messageId));
}

export async function markRoomAsRead(roomId: string) {
  await axios.post(endpoints.chatRoom.markAsRead(roomId));
}

export async function getUnreadCount(roomId: string): Promise<number> {
  const response = await axios.get(endpoints.chatRoom.unreadCount(roomId));
  return response.data.count;
}

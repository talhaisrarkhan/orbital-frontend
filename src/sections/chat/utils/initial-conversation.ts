import type { IChatParticipant } from 'src/types/chat';

import { uuidv4 } from 'src/utils/uuidv4';
import { fSub } from 'src/utils/format-time';
import { MessageType, ChatRoomType } from 'src/types/chat';

// ----------------------------------------------------------------------

type Props = {
  message?: string;
  me: IChatParticipant;
  recipients: IChatParticipant[];
};

export function initialConversation({ message = '', recipients, me }: Props) {
  const isGroup = recipients.length > 1;

  const messageData = {
    id: uuidv4(),
    roomId: '', // Will be set later
    content: message,
    type: MessageType.TEXT,
    fileUrl: undefined,
    readBy: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    senderId: Number(me.id),
  };

  // Filter out any null/undefined values and convert to numbers
  const participantIds = [...recipients, me]
    .map(p => p?.id ? Number(p.id) : null)
    .filter((id): id is number => id !== null && !Number.isNaN(id));

  const conversationData = {
    id: isGroup ? uuidv4() : recipients[0]?.id,
    participantIds,
    type: isGroup ? ChatRoomType.GROUP : ChatRoomType.DIRECT,
    name: isGroup ? 'New Group' : undefined,
    unreadCount: 0,
    messages: [messageData],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return { messageData, conversationData };
}

import type { IChatConversation } from 'src/types/chat';

// ----------------------------------------------------------------------

type Props = {
  currentUserId: string;
  conversation: IChatConversation;
};

export function getNavItem({ currentUserId, conversation }: Props) {
  const { messages = [], participants = [] } = conversation;

  const participantsInConversation = participants
    .filter((participant) => participant.id.toString() !== currentUserId)
    .map((participant) => ({
      id: participant.id.toString(),
      name: participant.name,
      email: participant.email,
      avatarUrl: participant.profilePicture || '',
      role: participant.role,
      status: (participant.isActive ? 'online' : 'offline') as 'online' | 'offline' | 'alway' | 'busy',
      lastActivity: new Date(), // Placeholder as User doesn't have lastActivity
    }));

  const lastMessage = messages[messages.length - 1];

  const group = participantsInConversation.length > 1;

  const displayName = participantsInConversation.map((participant) => participant.name).join(', ');

  const hasOnlineInGroup = group
    ? participantsInConversation.map((item) => item.status).includes('online')
    : false;

  let displayText = '';

  if (lastMessage) {
    const sender = lastMessage.senderId.toString() === currentUserId ? 'You: ' : '';

    const message = lastMessage.type === 'image' ? 'Sent a photo' : lastMessage.content;

    displayText = `${sender}${message}`;
  }

  return {
    group,
    displayName,
    displayText,
    participants: participantsInConversation,
    lastActivity: lastMessage?.createdAt || new Date().toISOString(),
    hasOnlineInGroup,
  };
}

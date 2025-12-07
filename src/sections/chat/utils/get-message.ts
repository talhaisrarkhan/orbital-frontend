import type { IChatMessage, IChatParticipant } from 'src/types/chat';
import { MessageType } from 'src/types/chat';

// ----------------------------------------------------------------------

type Props = {
  currentUserId: string;
  message: IChatMessage;
  participants: IChatParticipant[];
};

export function getMessage({ message, participants, currentUserId }: Props) {
  const sender = participants.find((participant) => participant.id === message.senderId.toString());

  const isCurrentUser = message.senderId.toString() === currentUserId;

  const senderDetails = isCurrentUser
    ? {
      avatarUrl: sender?.avatarUrl || '',
      firstName: sender?.name?.split(' ')[0] ?? 'You',
    }
    : {
      avatarUrl: sender?.avatarUrl || '',
      firstName: sender?.name?.split(' ')[0] ?? 'Unknown',
    };

  const hasImage = message.type === MessageType.IMAGE;

  return { hasImage, me: isCurrentUser, senderDetails };
}

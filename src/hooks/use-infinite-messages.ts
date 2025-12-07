import { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import { endpoints } from 'src/utils/axios';
import type { IChatMessage } from 'src/types/chat';

// ----------------------------------------------------------------------

interface UseInfiniteMessagesReturn {
    messages: IChatMessage[];
    hasMore: boolean;
    isLoadingMore: boolean;
    loadMore: () => Promise<void>;
    resetMessages: (newMessages: IChatMessage[]) => void;
    addMessage: (message: IChatMessage) => void;
    updateMessage: (messageId: string, updates: Partial<IChatMessage>) => void;
    removeMessage: (messageId: string) => void;
}

export function useInfiniteMessages(roomId: string): UseInfiniteMessagesReturn {
    const [messages, setMessages] = useState<IChatMessage[]>([]);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const offsetRef = useRef(0);
    const loadedMessageIdsRef = useRef<Set<string>>(new Set());

    const loadMore = useCallback(async () => {
        if (!roomId || isLoadingMore || !hasMore) return;

        setIsLoadingMore(true);

        try {
            const response = await axios.get<IChatMessage[]>(
                `${endpoints.chatRoom.messages(roomId)}?limit=50&offset=${offsetRef.current}`
            );

            const newMessages = response.data;

            if (newMessages.length < 50) {
                setHasMore(false);
            }

            // Filter out duplicates
            const uniqueNewMessages = newMessages.filter(
                (msg) => !loadedMessageIdsRef.current.has(msg.id)
            );

            // Add to loaded IDs
            uniqueNewMessages.forEach((msg) => {
                loadedMessageIdsRef.current.add(msg.id);
            });

            // Since backend returns DESC (newest first), we need to:
            // 1. Reverse the new batch to get oldest-first
            // 2. Prepend to existing messages (so older messages go at the top)
            setMessages((prev) => [...uniqueNewMessages.reverse(), ...prev]);

            offsetRef.current += 50;
        } catch (error) {
            console.error('Failed to load more messages:', error);
        } finally {
            setIsLoadingMore(false);
        }
    }, [roomId, isLoadingMore, hasMore]);

    const resetMessages = useCallback((newMessages: IChatMessage[]) => {
        offsetRef.current = newMessages.length;
        loadedMessageIdsRef.current.clear();
        newMessages.forEach((msg) => {
            loadedMessageIdsRef.current.add(msg.id);
        });
        setMessages(newMessages);
        setHasMore(newMessages.length >= 50);
    }, []);

    const addMessage = useCallback((message: IChatMessage) => {
        setMessages((prev) => {
            const exists = prev.some((msg) => msg.id === message.id);
            if (exists) return prev;
            loadedMessageIdsRef.current.add(message.id);
            return [...prev, message];
        });
    }, []);

    const updateMessage = useCallback((messageId: string, updates: Partial<IChatMessage>) => {
        setMessages((prev) =>
            prev.map((msg) => (msg.id === messageId ? { ...msg, ...updates } : msg))
        );
    }, []);

    const removeMessage = useCallback((messageId: string) => {
        setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
        loadedMessageIdsRef.current.delete(messageId);
    }, []);

    return {
        messages,
        hasMore,
        isLoadingMore,
        loadMore,
        resetMessages,
        addMessage,
        updateMessage,
        removeMessage,
    };
}

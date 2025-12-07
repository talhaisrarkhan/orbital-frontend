import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { isCancel } from 'axios';

import axios, { endpoints } from 'src/utils/axios';
import type { IChatMessage } from 'src/types/chat';

// ----------------------------------------------------------------------

interface UseChatMessagesReturn {
    messages: IChatMessage[];
    isLoading: boolean;
    error: Error | null;
    resetMessages: (newMessages: IChatMessage[]) => void;
    addMessage: (message: IChatMessage) => void;
    updateMessage: (messageId: string, updates: Partial<IChatMessage>) => void;
    removeMessage: (messageId: string) => void;
}

export function useChatMessages(roomId: string): UseChatMessagesReturn {
    const [messages, setMessages] = useState<IChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const loadedMessageIdsRef = useRef<Set<string>>(new Set());
    const abortControllerRef = useRef<AbortController | null>(null);

    const loadMessages = useCallback(async () => {
        if (!roomId) return;

        // Cancel previous request if still pending
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        setIsLoading(true);
        setError(null);

        try {
            // Fetch all messages
            const response = await axios.get<IChatMessage[]>(
                endpoints.chatRoom.messages(roomId),
                { signal: abortControllerRef.current.signal }
            );

            const newMessages = response.data;
            console.log('📥 Fetched messages:', newMessages.length);

            // Filter out duplicates
            const uniqueNewMessages = newMessages.filter(
                (msg) => !loadedMessageIdsRef.current.has(msg.id)
            );

            // Add to loaded IDs
            uniqueNewMessages.forEach((msg) => {
                loadedMessageIdsRef.current.add(msg.id);
            });

            // Backend returns DESC (newest first).
            // We want ASC (oldest first) for display.
            const sortedMessages = [...uniqueNewMessages].sort((a, b) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );

            console.log('✅ Setting messages state:', sortedMessages.length);
            setMessages(sortedMessages);
        } catch (err) {
            if (isCancel(err)) {
                console.log('Request cancelled');
                return;
            }
            console.error('Failed to load messages:', err);
            setError(err as Error);
        } finally {
            setIsLoading(false);
            abortControllerRef.current = null;
        }
    }, [roomId]);

    // Initial load
    useEffect(() => {
        // Clear loaded IDs when room changes
        loadedMessageIdsRef.current.clear();
        setMessages([]); // Clear previous messages
        loadMessages();

        // Cleanup on unmount or room change
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [loadMessages, roomId]);

    const resetMessages = useCallback((newMessages: IChatMessage[]) => {
        loadedMessageIdsRef.current.clear();
        newMessages.forEach((msg) => {
            loadedMessageIdsRef.current.add(msg.id);
        });
        setMessages(newMessages);
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
        isLoading,
        error,
        resetMessages,
        addMessage,
        updateMessage,
        removeMessage,
    };
}

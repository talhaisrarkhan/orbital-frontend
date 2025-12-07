import { useEffect, useCallback, useRef } from 'react';
import { useSocketContext } from 'src/contexts/socket-context';

// ----------------------------------------------------------------------

/**
 * Hook to access the socket instance from context
 * @deprecated Use useSocketRoom for better performance with automatic room management
 */
export function useSocket() {
    const { socket } = useSocketContext();
    return socket;
}

// ----------------------------------------------------------------------

type EventHandler = (...args: any[]) => void;
type EventHandlers = Record<string, EventHandler>;

type UseSocketRoomOptions = {
    room: string | null;
    events?: EventHandlers;
    enabled?: boolean;
    joinEvent?: string;
    leaveEvent?: string;
};

/**
 * Optimized hook for socket room management with automatic join/leave and event handling
 * 
 * @param options.room - Room identifier to join (null to skip joining)
 * @param options.events - Event handlers object { 'event.name': handler }
 * @param options.enabled - Whether to enable socket connection (default: true)
 * 
 * @example
 * useSocketRoom({
 *   room: `board:${boardId}`,
 *   events: {
 *     'task.created': handleTaskCreated,
 *     'task.updated': handleTaskUpdated,
 *   }
 * });
 */
export function useSocketRoom({
    room,
    events = {},
    enabled = true,
    joinEvent = 'join',
    leaveEvent = 'leave'
}: UseSocketRoomOptions) {
    const { socket, emit, on, off, isConnected } = useSocketContext();

    // Store event handlers in ref to prevent unnecessary re-subscriptions
    const eventHandlersRef = useRef<EventHandlers>(events);
    const currentRoomRef = useRef<string | null>(null);

    // Update event handlers ref when they change
    useEffect(() => {
        eventHandlersRef.current = events;
    }, [events]);

    // Room management
    useEffect(() => {
        if (!socket || !enabled || !room || !isConnected) return undefined;

        // Join room
        emit(joinEvent, room);
        currentRoomRef.current = room;
        console.log(`Joined room: ${room} via ${joinEvent}`);

        // Cleanup: leave room
        return () => {
            if (currentRoomRef.current) {
                emit(leaveEvent, currentRoomRef.current);
                console.log(`Left room: ${currentRoomRef.current} via ${leaveEvent}`);
                currentRoomRef.current = null;
            }
        };
    }, [socket, room, enabled, isConnected, emit, joinEvent, leaveEvent]);

    // Event subscription management
    useEffect(() => {
        if (!socket || !enabled) return undefined;

        const handlers = eventHandlersRef.current;
        const eventNames = Object.keys(handlers);

        // Subscribe to all events
        eventNames.forEach((eventName) => {
            const handler = handlers[eventName];
            on(eventName, handler);
        });

        // Cleanup: unsubscribe from all events
        return () => {
            eventNames.forEach((eventName) => {
                const handler = handlers[eventName];
                off(eventName, handler);
            });
        };
    }, [socket, enabled, on, off]);

    // Return emit function for convenience
    return { emit, isConnected };
}

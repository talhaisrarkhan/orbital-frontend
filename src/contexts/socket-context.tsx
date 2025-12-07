'use client';

import type { Socket } from 'socket.io-client';
import type { ReactNode } from 'react';

import { io } from 'socket.io-client';
import { useMemo, useState, useEffect, useContext, createContext, useCallback } from 'react';

// ----------------------------------------------------------------------

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

type SocketContextValue = {
  socket: Socket | null;
  isConnected: boolean;
  emit: (event: string, ...args: any[]) => void;
  on: (event: string, handler: (...args: any[]) => void) => void;
  off: (event: string, handler: (...args: any[]) => void) => void;
};

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

// ----------------------------------------------------------------------

type SocketProviderProps = {
  children: ReactNode;
};

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Get token dynamically
    const token = sessionStorage.getItem('jwt_access_token');
    
    if (!token) {
      console.warn('No auth token found, socket connection skipped');
      return undefined;
    }

    // Create socket instance only once
    const socketInstance = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up socket connection');
      socketInstance.removeAllListeners();
      socketInstance.disconnect();
    };
  }, []); // Empty dependency array - socket is created only once

  // Memoized helper functions
  const emit = useCallback((event: string, ...args: any[]) => {
    if (socket?.connected) {
      socket.emit(event, ...args);
    } else {
      console.warn(`Cannot emit "${event}": socket not connected`);
    }
  }, [socket]);

  const on = useCallback((event: string, handler: (...args: any[]) => void) => {
    socket?.on(event, handler);
  }, [socket]);

  const off = useCallback((event: string, handler: (...args: any[]) => void) => {
    socket?.off(event, handler);
  }, [socket]);

  const value = useMemo(
    () => ({
      socket,
      isConnected,
      emit,
      on,
      off,
    }),
    [socket, isConnected, emit, on, off]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

// ----------------------------------------------------------------------

export function useSocketContext() {
  const context = useContext(SocketContext);
  
  if (context === undefined) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  
  return context;
}

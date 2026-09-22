import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children, user }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const userId = user?._id || user?.id;

    // If there is no authenticated user, disconnect the socket if it exists
    if (!user || !userId) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Get the socket server base URL cleanly from VITE_API_URL
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    let socketUrl = 'http://localhost:5000';
    try {
      socketUrl = new URL(apiUrl).origin;
    } catch {
      socketUrl = apiUrl.replace(/\/api\/?$/, '');
    }

    console.log('[SocketProvider] Initializing socket connection to:', socketUrl, 'for user:', userId);

    // Connect to the socket server
    const socketInstance = io(socketUrl, {
      transports: ['polling', 'websocket'],
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    const joinRoom = () => {
      console.log('[Socket] Connected, emitting join room:', { userId: userId, role: user.role });
      socketInstance.emit('join', { userId: userId, role: user.role });
    };

    socketInstance.on('connect', joinRoom);
    socketInstance.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    // If socket is already connected immediately
    if (socketInstance.connected) {
      joinRoom();
    }

    setSocket(socketInstance);

    // Disconnect on logout/unmount
    return () => {
      socketInstance.off('connect', joinRoom);
      socketInstance.disconnect();
    };
  }, [user?._id, user?.id, user?.role]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};
export default SocketContext;

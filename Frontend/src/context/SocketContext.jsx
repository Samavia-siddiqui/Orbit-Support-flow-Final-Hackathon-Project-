import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const SocketProvider = ({ children, user }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // If there is no authenticated user, disconnect the socket if it exists
    if (!user || !user._id) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Get the socket server base URL by stripping the /api suffix from VITE_API_URL
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const socketUrl = apiUrl.replace(/\/api$/, '');

    // Connect to the socket server
    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    const joinRoom = () => {
      console.log('[Socket] Connected, emitting join room:', { userId: user._id, role: user.role });
      socketInstance.emit('join', { userId: user._id, role: user.role });
    };

    socketInstance.on('connect', joinRoom);

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
  }, [user?._id, user?.role]);

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

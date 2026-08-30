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

    // Connect to the socket server using default reconnection settings
    const socketInstance = io(socketUrl);

    socketInstance.on('connect', () => {
      console.log('Socket connected, joining private room for user:', user._id);
      socketInstance.emit('join', user._id);
    });

    setSocket(socketInstance);

    // Disconnect on logout/unmount
    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

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

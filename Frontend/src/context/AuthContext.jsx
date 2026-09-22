import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('token');
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Error parsing stored user data:', err);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem('orbit_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Save notifications to localStorage when changed
  useEffect(() => {
    try {
      localStorage.setItem('orbit_notifications', JSON.stringify(notifications));
    } catch (err) {
      console.error('Error saving notifications to localStorage:', err);
    }
  }, [notifications]);

  const login = (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('orbit_notifications');
    setUser(null);
    setNotifications([]);
  };

  const updateUser = (userData) => {
    if (!userData) return;
    setUser((prev) => {
      const merged = { ...prev, ...userData };
      localStorage.setItem('user', JSON.stringify(merged));
      return merged;
    });
  };

  const addNotification = (notif) => {
    if (!notif) return;
    const replyId = notif.replyId || `${notif.ticketId || 'notif'}-${Date.now()}-${Math.random()}`;
    const safeNotif = { ...notif, replyId };
    setNotifications((prev) => {
      if (prev.some((n) => n.replyId === safeNotif.replyId)) return prev;
      return [safeNotif, ...prev];
    });
  };

  const clearNotification = (ticketId) => {
    setNotifications((prev) => prev.filter((n) => n.ticketId !== ticketId));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      updateUser, 
      loading,
      notifications,
      addNotification,
      clearNotification,
      clearAllNotifications,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;

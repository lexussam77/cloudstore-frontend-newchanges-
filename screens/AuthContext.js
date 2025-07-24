import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser } from './api';
import { setNotificationHandler } from './notificationHandler';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [jwt, setJwt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On mount, check for JWT in AsyncStorage
    const checkToken = async () => {
      const token = await AsyncStorage.getItem('jwt');
      setJwt(token);
      setLoading(false);
    };
    checkToken();
  }, []);

  const login = async (email, password) => {
    const res = await loginUser({ email, password });
    if (res.token) {
      await AsyncStorage.setItem('jwt', res.token);
      setJwt(res.token);
      return { success: true };
    } else {
      return { success: false, message: res.message || 'Invalid credentials.' };
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('jwt');
    setJwt(null);
  };

  return (
    <AuthContext.Provider value={{ jwt, setJwt, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);

  // Add unreadCount calculation
  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (message, type = 'info', icon = null, meta = {}) => {
    setNotifications(prev => [{
      id: Date.now(),
      message,
      type,
      icon: icon || (type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info'),
      read: false,
      timestamp: new Date().toISOString(),
      ...meta
    }, ...prev]);
    setHasUnread(true);
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setHasUnread(false);
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setHasUnread(false);
  };

  useEffect(() => {
    setNotificationHandler(addNotification);
  }, [addNotification]);

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, hasUnread, unreadCount, markAllRead, deleteNotification, clearAllNotifications }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  return useContext(NotificationContext);
} 
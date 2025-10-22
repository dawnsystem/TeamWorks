import { useState, useEffect, useCallback } from 'react';
import { notificationApi } from '../lib/notificationApi';
import type { Notification } from '../types/notification';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Cargar contador de no leídas
  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  }, []);

  // Cargar notificaciones
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notificationApi.getAll({ limit: 50 });
      setNotifications(data.notifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Marcar como leída
  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }, []);

  // Marcar todas como leídas
  const markAllAsRead = useCallback(async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, []);

  // Eliminar notificación
  const deleteNotification = useCallback(async (id: string) => {
    try {
      await notificationApi.delete(id);
      const wasUnread = notifications.find(n => n.id === id)?.read === false;
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [notifications]);

  // Escuchar eventos SSE
  useEffect(() => {
    loadUnreadCount();
    loadNotifications();

    // Conectar a SSE para actualizaciones en tiempo real
    const apiUrl = localStorage.getItem('settings-storage');
    let baseUrl = 'http://localhost:3000';
    
    if (apiUrl) {
      try {
        const settings = JSON.parse(apiUrl);
        if (settings.state?.apiUrl) {
          baseUrl = settings.state.apiUrl.replace(/\/api\/?$/, '');
        }
      } catch (e) {
        console.error('Error parsing settings:', e);
      }
    }

    const eventSource = new EventSource(
      `${baseUrl}/api/sse/connect`,
      { withCredentials: true }
    );

    eventSource.addEventListener('notification_created', (event) => {
      const notification = JSON.parse(event.data);
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);

      // Mostrar notificación del navegador si está permitido
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/icon.png'
        });
      }
    });

    eventSource.addEventListener('notification_read', (event) => {
      const { id } = JSON.parse(event.data);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    });

    eventSource.addEventListener('notification_deleted', (event) => {
      const { id } = JSON.parse(event.data);
      const wasUnread = notifications.find(n => n.id === id)?.read === false;
      setNotifications(prev => prev.filter(n => n.id !== id));
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    });

    return () => {
      eventSource.close();
    };
  }, [loadUnreadCount, loadNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
};

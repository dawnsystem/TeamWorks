import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationApi } from '../lib/notificationApi';
import NotificationCenter from './NotificationCenter';

const NotificationButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewNotification, setHasNewNotification] = useState(false);

  // Cargar contador inicial
  useEffect(() => {
    loadUnreadCount();
  }, []);

  const loadUnreadCount = async () => {
    try {
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  };

  // Escuchar eventos SSE para actualizaciones en tiempo real
  useEffect(() => {
    const eventSource = new EventSource(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/sse/connect`,
      { withCredentials: true }
    );

    eventSource.addEventListener('notification_created', (event) => {
      const notification = JSON.parse(event.data);
      setUnreadCount(prev => prev + 1);
      setHasNewNotification(true);

      // Animación de shake
      setTimeout(() => setHasNewNotification(false), 1000);

      // Reproducir sonido sutil
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignorar si falla (ej: usuario no ha interactuado con la página)
      });

      // Mostrar notificación del navegador
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/logo.png',
          tag: notification.id
        });
      }
    });

    eventSource.addEventListener('notification_read', () => {
      setUnreadCount(prev => Math.max(0, prev - 1));
    });

    eventSource.addEventListener('notification_deleted', () => {
      setUnreadCount(prev => Math.max(0, prev - 1));
    });

    return () => {
      eventSource.close();
    };
  }, []);

  // Solicitar permiso para notificaciones del navegador
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        whileTap={{ scale: 0.95 }}
        animate={hasNewNotification ? {
          rotate: [0, -10, 10, -10, 10, 0],
          transition: { duration: 0.5 }
        } : {}}
      >
        <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        
        {/* Badge de contador */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Indicador de nueva notificación */}
        <AnimatePresence>
          {hasNewNotification && (
            <motion.div
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-blue-500 rounded-lg"
              style={{ zIndex: -1 }}
            />
          )}
        </AnimatePresence>
      </motion.button>

      {/* Centro de Notificaciones */}
      <NotificationCenter
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
};

export default NotificationButton;

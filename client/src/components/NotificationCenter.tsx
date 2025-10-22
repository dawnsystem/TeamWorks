import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, CheckCheck, Pin, PinOff } from 'lucide-react';
import { notificationApi } from '../lib/notificationApi';
import type { Notification, NotificationSettings } from '../types/notification';
import { useNavigate } from 'react-router-dom';
import NotificationItem from './NotificationItem';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    try {
      const saved = localStorage.getItem('notificationSettings');
      return saved ? JSON.parse(saved) : { 
        pinned: false, 
        soundEnabled: true, 
        browserNotifications: false 
      };
    } catch {
      return { pinned: false, soundEnabled: true, browserNotifications: false };
    }
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(() => {
    if (settings.pinned && settings.position) {
      return settings.position;
    }
    return { x: window.innerWidth - 420, y: 80 };
  });
  
  const modalRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const navigate = useNavigate();

  // Cargar notificaciones
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await notificationApi.getAll({
        read: filter === 'unread' ? false : undefined,
        limit: 50
      });
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  // Guardar settings en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('notificationSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }, [settings]);

  // Drag functionality
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!settings.pinned) return;
    setIsDragging(true);
    dragStartPos.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  }, [settings.pinned, position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const newX = Math.max(0, Math.min(window.innerWidth - 400, e.clientX - dragStartPos.current.x));
    const newY = Math.max(0, Math.min(window.innerHeight - 600, e.clientY - dragStartPos.current.y));
    
    setPosition({ x: newX, y: newY });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      if (settings.pinned) {
        setSettings(prev => ({ ...prev, position }));
      }
    }
  }, [isDragging, settings.pinned, position]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Cerrar al hacer clic fuera (solo si no está pinneado)
  useEffect(() => {
    if (!isOpen || settings.pinned) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, settings.pinned, onClose]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await notificationApi.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleNotificationClick = useCallback((notification: Notification) => {
    // Marcar como leída
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }

    // Navegar según el tipo
    if (notification.taskId && notification.projectId) {
      navigate(`/projects/${notification.projectId}`);
    } else if (notification.projectId) {
      navigate(`/projects/${notification.projectId}`);
    }

    // Cerrar si no está pinneado
    if (!settings.pinned) {
      onClose();
    }
  }, [navigate, settings.pinned, onClose]);

  const togglePin = useCallback(() => {
    setSettings(prev => ({ ...prev, pinned: !prev.pinned }));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      style={{
        position: 'fixed',
        left: settings.pinned ? `${position.x}px` : undefined,
        top: settings.pinned ? `${position.y}px` : '80px',
        right: settings.pinned ? undefined : '20px',
        zIndex: 9999,
        cursor: isDragging ? 'grabbing' : undefined
      }}
      className="w-[400px] max-h-[600px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col"
    >
      {/* Header */}
      <div 
        className={`flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 ${
          settings.pinned ? 'cursor-grab active:cursor-grabbing' : ''
        }`}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Notificaciones
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={togglePin}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            title={settings.pinned ? 'Desanclar ventana' : 'Anclar ventana'}
          >
            {settings.pinned ? (
              <PinOff className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <Pin className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>
          
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              title="Marcar todas como leídas"
            >
              <CheckCheck className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          )}
          
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

        {/* Filters */}
        <div className="flex gap-2 p-3 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            No leídas {unreadCount > 0 && `(${unreadCount})`}
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-gray-500 dark:text-gray-400">
              <Bell className="w-12 h-12 mb-2 opacity-50" />
              <p>No hay notificaciones</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                  onMarkAsRead={() => handleMarkAsRead(notification.id)}
                  onDelete={() => handleDelete(notification.id)}
                />
              ))}
            </div>
          )}
        </div>
    </div>
  );
};

export default NotificationCenter;

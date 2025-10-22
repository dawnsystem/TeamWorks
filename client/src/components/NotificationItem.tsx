import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  MessageSquare, 
  CheckCircle, 
  Calendar, 
  AtSign, 
  Sparkles,
  Check,
  Trash2,
  Reply
} from 'lucide-react';
import { Notification } from '../types/notification';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
  onMarkAsRead: () => void;
  onDelete: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClick,
  onMarkAsRead,
  onDelete
}) => {
  const [showReply, setShowReply] = useState(false);

  const getIcon = () => {
    switch (notification.type) {
      case 'reminder':
        return <Bell className="w-5 h-5 text-yellow-500" />;
      case 'comment':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'task_completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'due_date':
        return <Calendar className="w-5 h-5 text-orange-500" />;
      case 'mention':
        return <AtSign className="w-5 h-5 text-purple-500" />;
      case 'ai_action':
        return <Sparkles className="w-5 h-5 text-pink-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeLabel = () => {
    const labels: Record<string, string> = {
      reminder: 'Recordatorio',
      comment: 'Comentario',
      task_completed: 'Tarea completada',
      due_date: 'Fecha de vencimiento',
      mention: 'Mención',
      ai_action: 'Acción de IA'
    };
    return labels[notification.type] || notification.type;
  };

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: true,
    locale: es
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
        !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
    >
      <div onClick={onClick}>
        <div className="flex gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 mt-1">
            {getIcon()}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {getTypeLabel()}
                  </span>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </div>
                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                  {notification.title}
                </h4>
              </div>
              
              {/* Actions */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!notification.read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsRead();
                    }}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    title="Marcar como leída"
                  >
                    <Check className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              {notification.message}
            </p>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {timeAgo}
              </span>

              {/* Reply button for comments */}
              {notification.type === 'comment' && notification.commentId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowReply(!showReply);
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Reply className="w-3 h-3" />
                  Responder
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Reply (for comments) */}
      {showReply && notification.type === 'comment' && (
        <div className="mt-3 ml-8 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
          <textarea
            className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
            rows={2}
            placeholder="Escribe una respuesta..."
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowReply(false);
              }}
              className="px-3 py-1 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              Cancelar
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Implement reply
                setShowReply(false);
              }}
              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default NotificationItem;

import api from './api';
import { Notification } from '../types/notification';

export const notificationApi = {
  // Obtener todas las notificaciones
  getAll: async (params?: { 
    read?: boolean; 
    type?: string; 
    limit?: number; 
    offset?: number 
  }) => {
    const { data } = await api.get<{ notifications: Notification[]; total: number }>(
      '/notifications',
      { params }
    );
    return data;
  },

  // Obtener contador de no leídas
  getUnreadCount: async () => {
    const { data } = await api.get<{ count: number }>('/notifications/unread/count');
    return data.count;
  },

  // Marcar como leída
  markAsRead: async (id: string) => {
    const { data } = await api.patch<Notification>(`/notifications/${id}/read`);
    return data;
  },

  // Marcar todas como leídas
  markAllAsRead: async () => {
    const { data } = await api.patch('/notifications/read-all');
    return data;
  },

  // Eliminar notificación
  delete: async (id: string) => {
    const { data } = await api.delete(`/notifications/${id}`);
    return data;
  },
};

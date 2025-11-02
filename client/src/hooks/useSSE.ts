import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSettingsStore } from '@/store/useStore';

interface SSEEvent {
  type: 'task_created' | 'task_updated' | 'task_deleted' | 'task_reordered' | 'connected' |
        'project_created' | 'project_updated' | 'project_deleted' |
        'section_created' | 'section_updated' | 'section_deleted' |
        'comment_created' | 'comment_updated' | 'comment_deleted' |
        'label_created' | 'label_updated' | 'label_deleted';
  projectId?: string;
  taskId?: string;
  sectionId?: string;
  commentId?: string;
  labelId?: string;
  timestamp?: string;
  data?: any;
}

interface UseSSEOptions {
  enabled?: boolean;
  onConnected?: () => void;
  onError?: (error: Error) => void;
  onReconnecting?: () => void;
}

export function useSSE(options: UseSSEOptions = {}) {
  const { enabled = true, onConnected, onError, onReconnecting } = options;
  const queryClient = useQueryClient();
  const apiUrl = useSettingsStore((state) => state.apiUrl);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000; // 1 segundo

  const handleTaskEvent = useCallback((event: SSEEvent) => {
    console.log('[SSE] Evento recibido:', event);

    // Invalidar queries relevantes según el tipo de evento
    if (event.type.startsWith('task_')) {
      if (event.projectId) {
        queryClient.invalidateQueries({ queryKey: ['tasks', event.projectId] });
        queryClient.invalidateQueries({ queryKey: ['project', event.projectId] });
      }
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    } else if (event.type.startsWith('project_')) {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      if (event.projectId) {
        queryClient.invalidateQueries({ queryKey: ['project', event.projectId] });
      }
    } else if (event.type.startsWith('section_')) {
      if (event.projectId) {
        queryClient.invalidateQueries({ queryKey: ['project', event.projectId] });
      }
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    } else if (event.type.startsWith('comment_')) {
      if (event.taskId) {
        queryClient.invalidateQueries({ queryKey: ['comments', event.taskId] });
      }
      if (event.projectId) {
        queryClient.invalidateQueries({ queryKey: ['tasks', event.projectId] });
      }
    } else if (event.type.startsWith('label_')) {
      queryClient.invalidateQueries({ queryKey: ['labels'] });
      // Invalidar también las tareas que puedan tener esta etiqueta
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  }, [queryClient]);

  const connect = useCallback(() => {
    if (!enabled) return;

    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('[SSE] No hay token, no se puede conectar');
      return;
    }

    try {
      // Cerrar conexión anterior si existe
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const baseURL = apiUrl || import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const url = `${baseURL}/sse/events?token=${token}`;

      console.log('[SSE] Conectando a:', url.replace(token, 'TOKEN_HIDDEN'));

      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      // Conexión establecida
      eventSource.addEventListener('connected', (e) => {
        const data = JSON.parse(e.data);
        console.log('[SSE] Conectado:', data);
        reconnectAttemptsRef.current = 0; // Resetear intentos
        onConnected?.();
      });

      // Eventos de tareas
      eventSource.addEventListener('task_created', (e) => {
        handleTaskEvent({ ...JSON.parse(e.data), type: 'task_created' });
      });

      eventSource.addEventListener('task_updated', (e) => {
        handleTaskEvent({ ...JSON.parse(e.data), type: 'task_updated' });
      });

      eventSource.addEventListener('task_deleted', (e) => {
        handleTaskEvent({ ...JSON.parse(e.data), type: 'task_deleted' });
      });

      eventSource.addEventListener('task_reordered', (e) => {
        handleTaskEvent({ ...JSON.parse(e.data), type: 'task_reordered' });
      });

      // Eventos de proyectos
      eventSource.addEventListener('project_created', (e) => {
        handleTaskEvent({ ...JSON.parse(e.data), type: 'project_created' });
      });

      eventSource.addEventListener('project_updated', (e) => {
        handleTaskEvent({ ...JSON.parse(e.data), type: 'project_updated' });
      });

      eventSource.addEventListener('project_deleted', (e) => {
        handleTaskEvent({ ...JSON.parse(e.data), type: 'project_deleted' });
      });

      // Eventos de secciones
      eventSource.addEventListener('section_created', (e) => {
        handleTaskEvent({ ...JSON.parse(e.data), type: 'section_created' });
      });

      eventSource.addEventListener('section_updated', (e) => {
        handleTaskEvent({ ...JSON.parse(e.data), type: 'section_updated' });
      });

      eventSource.addEventListener('section_deleted', (e) => {
        handleTaskEvent({ ...JSON.parse(e.data), type: 'section_deleted' });
      });

      // Eventos de comentarios
      eventSource.addEventListener('comment_created', (e) => {
        handleTaskEvent({ ...JSON.parse(e.data), type: 'comment_created' });
      });

      eventSource.addEventListener('comment_updated', (e) => {
        handleTaskEvent({ ...JSON.parse(e.data), type: 'comment_updated' });
      });

      eventSource.addEventListener('comment_deleted', (e) => {
        handleTaskEvent({ ...JSON.parse(e.data), type: 'comment_deleted' });
      });

      // Eventos de etiquetas
      eventSource.addEventListener('label_created', (e) => {
        handleTaskEvent({ ...JSON.parse(e.data), type: 'label_created' });
      });

      eventSource.addEventListener('label_updated', (e) => {
        handleTaskEvent({ ...JSON.parse(e.data), type: 'label_updated' });
      });

      eventSource.addEventListener('label_deleted', (e) => {
        handleTaskEvent({ ...JSON.parse(e.data), type: 'label_deleted' });
      });

      // Error en la conexión
      eventSource.onerror = (error) => {
        console.error('[SSE] Error en conexión:', error);
        eventSource.close();
        eventSourceRef.current = null;

        // Verificar si el token todavía existe antes de reconectar
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn('[SSE] No hay token, no se intentará reconectar');
          return;
        }

        // Intentar reconectar con backoff exponencial
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
          console.log(`[SSE] Reintentando conexión en ${delay}ms (intento ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
          
          onReconnecting?.();
          reconnectAttemptsRef.current++;

          reconnectTimeoutRef.current = setTimeout(() => {
            // Verificar nuevamente que el token exista antes de reconectar
            if (localStorage.getItem('token')) {
              connect();
            }
          }, delay);
        } else {
          console.error('[SSE] Se alcanzó el número máximo de intentos de reconexión');
          onError?.(new Error('Failed to connect to SSE after multiple attempts'));
        }
      };

      // Conexión abierta
      eventSource.onopen = () => {
        console.log('[SSE] Conexión abierta');
      };

    } catch (error) {
      console.error('[SSE] Error al crear EventSource:', error);
      onError?.(error as Error);
    }
  }, [apiUrl, enabled, handleTaskEvent, onConnected, onError, onReconnecting]);

  const disconnect = useCallback(() => {
    console.log('[SSE] Desconectando...');

    // Limpiar timeout de reconexión
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Cerrar EventSource
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    reconnectAttemptsRef.current = 0;
  }, []);

  // Conectar cuando el componente se monta o cuando cambia la URL del API
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, apiUrl]); // No incluir connect y disconnect para evitar bucles

  // Reconectar cuando la ventana vuelve a estar visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled && !eventSourceRef.current) {
        console.log('[SSE] Ventana visible, reconectando...');
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, connect]);

  // Reconectar cuando vuelve la conexión a internet
  useEffect(() => {
    const handleOnline = () => {
      if (enabled && !eventSourceRef.current) {
        console.log('[SSE] Conexión a internet restaurada, reconectando...');
        reconnectAttemptsRef.current = 0; // Resetear intentos
        connect();
      }
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [enabled, connect]);

  return {
    connected: !!eventSourceRef.current,
    reconnect: connect,
    disconnect,
  };
}

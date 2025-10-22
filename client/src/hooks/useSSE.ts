import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface SSEEvent {
  type: 'task_created' | 'task_updated' | 'task_deleted' | 'task_reordered' | 'connected';
  projectId?: string;
  taskId?: string;
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
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000; // 1 segundo

  const handleTaskEvent = useCallback((event: SSEEvent) => {
    console.log('[SSE] Evento recibido:', event);

    // Invalidar queries relevantes
    if (event.projectId) {
      queryClient.invalidateQueries({ queryKey: ['tasks', event.projectId] });
      queryClient.invalidateQueries({ queryKey: ['project', event.projectId] });
    }

    // Invalidar todas las queries de tasks para asegurar sincronización
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
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

      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const url = `${baseURL}/api/sse/events?token=${token}`;

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

      // Error en la conexión
      eventSource.onerror = (error) => {
        console.error('[SSE] Error en conexión:', error);
        eventSource.close();
        eventSourceRef.current = null;

        // Intentar reconectar con backoff exponencial
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
          console.log(`[SSE] Reintentando conexión en ${delay}ms (intento ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`);
          
          onReconnecting?.();
          reconnectAttemptsRef.current++;

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
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
  }, [enabled, handleTaskEvent, onConnected, onError, onReconnecting]);

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

  // Conectar cuando el componente se monta
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

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

import { Response } from 'express';
import { EventEmitter } from 'events';

interface SSEClient {
  id: string;
  userId: string;
  response: Response;
  connectedAt: Date;
}

interface TaskEvent {
  type: 'task_created' | 'task_updated' | 'task_deleted' | 'task_reordered';
  projectId: string;
  taskId?: string;
  userId: string;
  timestamp: Date;
  data?: any;
}

class SSEService extends EventEmitter {
  private clients: Map<string, SSEClient> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.startHeartbeat();
  }

  // Agregar un nuevo cliente
  addClient(clientId: string, userId: string, response: Response): void {
    // Configurar headers SSE
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');
    response.setHeader('X-Accel-Buffering', 'no'); // Para nginx

    // Enviar comentario inicial para establecer conexión
    response.write(': SSE connection established\n\n');

    const client: SSEClient = {
      id: clientId,
      userId,
      response,
      connectedAt: new Date(),
    };

    this.clients.set(clientId, client);

    console.log(`[SSE] Cliente conectado: ${clientId} (Usuario: ${userId})`);
    console.log(`[SSE] Total clientes conectados: ${this.clients.size}`);

    // Manejar desconexión del cliente
    response.on('close', () => {
      this.removeClient(clientId);
    });
  }

  // Remover un cliente
  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (client) {
      try {
        client.response.end();
      } catch (error) {
        console.error(`[SSE] Error al cerrar conexión del cliente ${clientId}:`, error);
      }
      this.clients.delete(clientId);
      console.log(`[SSE] Cliente desconectado: ${clientId}`);
      console.log(`[SSE] Total clientes conectados: ${this.clients.size}`);
    }
  }

  // Enviar evento a un cliente específico
  private sendToClient(client: SSEClient, event: string, data: any): boolean {
    try {
      const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      return client.response.write(message);
    } catch (error) {
      console.error(`[SSE] Error al enviar mensaje al cliente ${client.id}:`, error);
      this.removeClient(client.id);
      return false;
    }
  }

  // Enviar evento de tarea a todos los clientes relevantes
  sendTaskEvent(event: TaskEvent): void {
    let sentCount = 0;

    this.clients.forEach((client) => {
      // Solo enviar a clientes del mismo usuario (o podrías filtrar por proyecto)
      if (client.userId === event.userId) {
        const success = this.sendToClient(client, event.type, {
          projectId: event.projectId,
          taskId: event.taskId,
          timestamp: event.timestamp.toISOString(),
          data: event.data,
        });
        
        if (success) {
          sentCount++;
        }
      }
    });

    console.log(`[SSE] Evento ${event.type} enviado a ${sentCount} clientes`);
  }

  // Enviar heartbeat para mantener conexión activa
  private startHeartbeat(): void {
    // Enviar heartbeat cada 30 segundos
    this.heartbeatInterval = setInterval(() => {
      const now = new Date();
      this.clients.forEach((client) => {
        try {
          const message = `: heartbeat ${now.toISOString()}\n\n`;
          client.response.write(message);
        } catch (error) {
          console.error(`[SSE] Error en heartbeat para cliente ${client.id}:`, error);
          this.removeClient(client.id);
        }
      });
    }, 30000);
  }

  // Limpiar recursos
  cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    this.clients.forEach((client) => {
      try {
        client.response.end();
      } catch (error) {
        console.error(`[SSE] Error al cerrar cliente ${client.id}:`, error);
      }
    });

    this.clients.clear();
    console.log('[SSE] Servicio SSE limpiado');
  }

  // Obtener estadísticas
  getStats(): { totalClients: number; clientsByUser: Record<string, number> } {
    const clientsByUser: Record<string, number> = {};
    
    this.clients.forEach((client) => {
      clientsByUser[client.userId] = (clientsByUser[client.userId] || 0) + 1;
    });

    return {
      totalClients: this.clients.size,
      clientsByUser,
    };
  }
}

// Singleton
export const sseService = new SSEService();

// Tipos para exportar
export type { TaskEvent, SSEClient };

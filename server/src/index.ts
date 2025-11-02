import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import projectRoutes from './routes/projectRoutes';
import taskRoutes from './routes/taskRoutes';
import labelRoutes from './routes/labelRoutes';
import aiRoutes from './routes/aiRoutes';
import commentRoutes from './routes/commentRoutes';
import reminderRoutes from './routes/reminderRoutes';
import notificationRoutes from './routes/notificationRoutes';
import taskSubscriptionRoutes from './routes/taskSubscriptionRoutes';
import sseRoutes from './routes/sseRoutes';
import { sseService } from './services/sseService';
import { reminderService } from './services/reminderService';
import templateRoutes from './routes/templateRoutes';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Middleware
// CORS configuration that allows access from local network devices
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) {
      return callback(null, true);
    }
    
    // Parse the origin URL
    try {
      const originUrl = new URL(origin);
      const hostname = originUrl.hostname;
      
      // Allow localhost variants
      const localhostVariants = ['localhost', '127.0.0.1', '0.0.0.0'];
      if (localhostVariants.includes(hostname)) {
        return callback(null, true);
      }
      
      // Allow local network IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
      if (
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
      ) {
        return callback(null, true);
      }
      
      // Allow IPv6 localhost and link-local addresses
      if (
        hostname === '::1' ||
        hostname === '::' ||
        hostname.startsWith('fe80:') ||
        hostname.startsWith('[::1]') ||
        hostname.startsWith('[fe80:')
      ) {
        return callback(null, true);
      }
      
      // Allow configured frontend URL if set
      if (process.env.FRONTEND_URL) {
        const frontendUrl = new URL(process.env.FRONTEND_URL);
        if (hostname === frontendUrl.hostname) {
          return callback(null, true);
        }
      }
      
      // Log rejected origins for debugging
      console.warn(`CORS: Origin not allowed: ${origin}`);
      return callback(null, false);
    } catch (e) {
      console.error(`CORS: Invalid origin URL: ${origin}`);
      return callback(null, false);
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public endpoints (no auth required) - must be before protected routes
// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'TeamWorks API'
  });
});

// Server info endpoint for auto-discovery
app.get('/api/server-info', (req, res) => {
  const serverInfo = {
    version: '2.1.1',
    serverTime: new Date().toISOString(),
    apiEndpoint: '/api',
    corsEnabled: true,
    authRequired: true,
  };
  res.json(serverInfo);
});

// Protected routes (require auth)
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/labels', labelRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/sse', sseRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', taskSubscriptionRoutes);
app.use('/api', commentRoutes);
app.use('/api', reminderRoutes);
app.use('/api/templates', templateRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Escuchar en 0.0.0.0 para acceso en red local
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📡 Accessible on local network`);
  console.log(`🔌 SSE enabled for real-time updates`);
  console.log(`🔔 Notification system enabled`);
  
  // Iniciar checker de recordatorios
  reminderService.startReminderChecker();
  reminderService.startDueDateChecker();
});

// Handle server startup errors
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Error: Port ${PORT} is already in use`);
    console.error(`   Please stop the other server or use a different port`);
    console.error(`   You can set PORT in the .env file`);
  } else if (error.code === 'EACCES') {
    console.error(`❌ Error: Permission denied to bind to port ${PORT}`);
    console.error(`   Try using a port number above 1024`);
  } else {
    console.error(`❌ Server error:`, error.message);
  }
  process.exit(1);
});

// Manejar cierre graceful
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, closing server gracefully...');
  reminderService.stopReminderChecker();
  server.close(() => {
    console.log('✅ Server closed');
    sseService.cleanup();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received, closing server gracefully...');
  reminderService.stopReminderChecker();
  server.close(() => {
    console.log('✅ Server closed');
    sseService.cleanup();
    process.exit(0);
  });
});


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
      
      // Allow configured frontend URL if set
      if (process.env.FRONTEND_URL) {
        const frontendUrl = new URL(process.env.FRONTEND_URL);
        if (hostname === frontendUrl.hostname) {
          return callback(null, true);
        }
      }
      
      // Log rejected origins for debugging
      console.warn(`CORS: Origin not allowed: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    } catch (e) {
      console.error(`CORS: Invalid origin URL: ${origin}`);
      return callback(new Error('Invalid origin'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/labels', labelRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api', commentRoutes);
app.use('/api', reminderRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Escuchar en 0.0.0.0 para acceso en red local
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📡 Accessible on local network`);
});


import express from 'express';
import cors from 'cors';
import { config } from './config';
import authRoutes from './routes/auth.routes';
import musicRoutes from './routes/music.routes';
import streamRoutes from './routes/stream.routes';
import { security } from './middleware/rate-limiter';

const app = express();

// Standard middlewares
app.use(cors({
  origin: '*', // Allow all origins in dev, configure appropriately in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'],
}));

app.use(express.json());

// Apply rate limiting to all standard APIs
app.use('/api/', security.apiLimiter);

// Setup routes
app.use('/api/auth', authRoutes);
app.use('/api/music', musicRoutes);

// Apply stream abuse prevention specifically to the streaming proxy
app.use('/api/stream', security.streamAbusePreventer, streamRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    nodeVersion: process.version
  });
});



// Centralized error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[SERVER ERROR]:', err);
  res.status(500).json({ error: 'Internal server error occurred' });
});

// Start the server
const server = app.listen(config.port, () => {
  console.log(`===============================================`);
  console.log(`   WaveFlow Backend API running on port ${config.port}   `);
  console.log(`   Environment: ${config.nodeEnv}                     `);
  console.log(`===============================================`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('[SERVER] SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('[SERVER] HTTP server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[SERVER] SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('[SERVER] HTTP server closed.');
    process.exit(0);
  });
});

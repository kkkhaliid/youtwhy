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

// Debug endpoint to test yt-dlp binary directly
app.get('/debug/ytdl', async (req, res) => {
  const { exec, spawn } = require('child_process');
  const fs = require('fs');
  const path = require('path');
  const { config } = require('./config');
  
  const query = req.query.q || '7liwa';
  const resolvedPath = path.resolve(config.ytdlPath);
  const exists = fs.existsSync(resolvedPath);
  let stats = null;
  if (exists) {
    stats = fs.statSync(resolvedPath);
  }

  // Test running --version
  const runVersion = () => new Promise((resolve) => {
    exec(`"${config.ytdlPath}" --version`, (error: any, stdout: string, stderr: string) => {
      resolve({ error: error?.message, stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });

  // Test python importing curl_cffi
  const testPythonImport = () => new Promise((resolve) => {
    exec(`python3 -c "import curl_cffi; print('curl_cffi version:', curl_cffi.__version__)"`, (error: any, stdout: string, stderr: string) => {
      resolve({ error: error?.message, stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });

  // Test running list impersonate targets
  const runListTargets = () => new Promise((resolve) => {
    exec(`"${config.ytdlPath}" --list-impersonate-targets`, (error: any, stdout: string, stderr: string) => {
      resolve({ error: error?.message, stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });

  // Test running actual search
  const runSearch = () => new Promise((resolve) => {
    const args = [
      '--skip-download',
      '--dump-json',
      '--js-runtimes', 'node',
      '-4',
      '--impersonate', 'chrome',
      `ytsearch2:${query}`,
      '--no-playlist',
      '--ignore-errors',
    ];
    const child = spawn(config.ytdlPath, args);
    let stdoutData = '';
    let stderrData = '';
    child.stdout.on('data', (d: any) => stdoutData += d.toString());
    child.stderr.on('data', (d: any) => stderrData += d.toString());
    child.on('close', (code: number) => {
      resolve({ code, stdout: stdoutData, stderr: stderrData });
    });
  });

  try {
    const versionRes = await runVersion();
    const importRes = await testPythonImport();
    const listTargetsRes = await runListTargets();
    const searchRes = await runSearch();
    
    res.json({
      ytdlPathConfig: config.ytdlPath,
      resolvedPath,
      exists,
      stats,
      version: versionRes,
      pythonImport: importRes,
      listTargets: listTargetsRes,
      search: searchRes,
      env: {
        PATH: process.env.PATH,
        PORT: process.env.PORT,
        NODE_ENV: process.env.NODE_ENV,
        USER: process.env.USER,
        PWD: process.env.PWD
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
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

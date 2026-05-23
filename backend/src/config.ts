import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const getFallbackYtdlPath = () => {
  // Check for local binary downloaded during build in project root
  const localBinary = path.resolve(__dirname, '../yt-dlp');
  if (fs.existsSync(localBinary)) {
    return localBinary;
  }
  return 'yt-dlp';
};

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  jwtSecret: process.env.JWT_SECRET || 'waveflow_super_cyberpunk_secret_key_2026',
  dbPath: process.env.DB_PATH || './waveflow.db',
  nodeEnv: process.env.NODE_ENV || 'development',
  ytdlPath: process.env.YT_DLP_PATH || getFallbackYtdlPath(),
};

// Simple sanity validation
if (!config.jwtSecret || config.jwtSecret === 'waveflow_super_cyberpunk_secret_key_2026' && config.nodeEnv === 'production') {
  console.warn('[WARNING] Running in production mode with default JWT_SECRET. Please configure a secure secret in your environment.');
}

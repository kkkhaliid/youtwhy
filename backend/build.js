const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');
const path = require('path');

const YTDL_URL = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
const outputPath = path.join(__dirname, './yt-dlp');

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    
    const request = (targetUrl) => {
      https.get(targetUrl, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Follow redirects
          request(response.headers.location);
          return;
        }
        
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          resolve();
        });
      }).on('error', (err) => {
        try { fs.unlinkSync(destPath); } catch (e) {}
        reject(err);
      });
    };
    
    request(url);
  });
}

async function run() {
  console.log('[BUILD] Downloading yt-dlp binary...');
  try {
    await downloadFile(YTDL_URL, outputPath);
    console.log('[BUILD] yt-dlp binary downloaded successfully!');
    
    // Make executable
    fs.chmodSync(outputPath, '755');
    console.log('[BUILD] Permissions set to executable.');
  } catch (err) {
    console.error('[BUILD] yt-dlp download failed:', err.message);
    process.exit(1);
  }
  
  console.log('[BUILD] Compiling TypeScript...');
  try {
    execSync('npx tsc', { stdio: 'inherit' });
    console.log('[BUILD] TypeScript compiled successfully.');
  } catch (err) {
    console.error('[BUILD] Compilation failed.');
    process.exit(1);
  }
}

run();

import { exec, spawn } from 'child_process';
import { db } from '../db/sqlite';
import { config } from '../config';

export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string;
}

class YtdlService {
  private ytdlPath = config.ytdlPath;
  
  public lastError: string = '';
  public lastStdout: string = '';
  public lastStderr: string = '';

  // Search YouTube for tracks
  public async search(query: string, limit: number = 20): Promise<Track[]> {
    const cleanedQuery = query.trim().toLowerCase();
    if (!cleanedQuery) return [];

    // Check SQLite cache first
    try {
      const cached = await db.get<{ results_json: string }>(
        'SELECT results_json FROM search_cache WHERE query = ? AND cached_at > datetime("now", "-24 hours")',
        [cleanedQuery]
      );
      if (cached) {
        console.log(`[YTDL-SERVICE] Cache hit for search query: "${cleanedQuery}"`);
        return JSON.parse(cached.results_json);
      }
    } catch (err: any) {
      console.error('[YTDL-SERVICE] Cache read error:', err.message);
    }

    console.log(`[YTDL-SERVICE] Cache miss. Searching YouTube for: "${cleanedQuery}"`);
    return new Promise((resolve) => {
      // We search YouTube with yt-dlp
      // Using --skip-download to prevent downloading, --dump-json to get rich metadata
      const args = [
        '--skip-download',
        '--dump-json',
        '--js-runtimes', 'node',
        '-4',
        '--impersonate', 'chrome',
        `ytsearch${limit}:${query}`,
        '--no-playlist',
        '--ignore-errors',
      ];

      const child = spawn(this.ytdlPath, args);
      let stdoutData = '';
      let stderrData = '';

      child.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderrData += data.toString();
      });

      child.on('close', async (code) => {
        this.lastError = code !== 0 ? `Failed with exit code ${code}` : '';
        this.lastStdout = stdoutData;
        this.lastStderr = stderrData;

        if (code !== 0 && stdoutData.trim() === '') {
          console.error(`[YTDL-SERVICE] yt-dlp search process failed with code ${code}. Error: ${stderrData}`);
          resolve([]);
          return;
        }

        const lines = stdoutData.split('\n').filter(Boolean);
        const tracks: Track[] = [];

        for (const line of lines) {
          try {
            const info = JSON.parse(line);
            if (!info.id) continue;

            // Extract artist: check creator, artist, uploader, or remove " - Topic"
            let artist = info.artist || info.creator || info.uploader || 'Unknown Artist';
            if (artist.endsWith(' - Topic')) {
              artist = artist.slice(0, -8);
            }

            tracks.push({
              id: info.id,
              title: info.title || 'Unknown Title',
              artist,
              duration: info.duration ? Math.round(info.duration) : 0,
              thumbnail: info.thumbnail || `https://i.ytimg.com/vi/${info.id}/hqdefault.jpg`,
            });
          } catch (e) {
            // Ignore malformed JSON lines
          }
        }

        // Cache results in SQLite
        if (tracks.length > 0) {
          try {
            await db.run(
              `INSERT INTO search_cache (query, results_json, cached_at) 
               VALUES (?, ?, CURRENT_TIMESTAMP)
               ON CONFLICT(query) DO UPDATE SET 
               results_json = excluded.results_json, 
               cached_at = CURRENT_TIMESTAMP`,
              [cleanedQuery, JSON.stringify(tracks)]
            );
          } catch (err: any) {
            console.error('[YTDL-SERVICE] Cache save error:', err.message);
          }
        }

        resolve(tracks);
      });
    });
  }

  // Get direct audio streaming URL from YouTube video ID
  public async getStreamUrl(id: string): Promise<string | null> {
    return new Promise((resolve) => {
      const url = `https://www.youtube.com/watch?v=${id}`;
      // Prefer M4A (AAC codec) for native audio tag playing, fall back to bestaudio
      const format = 'bestaudio[ext=m4a]/bestaudio';
      const args = ['-f', format, '--js-runtimes', 'node', '-4', '--impersonate', 'chrome', '-g', url];

      exec(`"${this.ytdlPath}" ${args.join(' ')}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`[YTDL-SERVICE] Failed to get stream URL for ID: ${id}. Error:`, stderr);
          resolve(null);
          return;
        }

        const streamUrl = stdout.trim();
        if (!streamUrl) {
          resolve(null);
          return;
        }

        resolve(streamUrl);
      });
    });
  }

  // Fetch track metadata directly (for building queues and recommendations)
  public async getTrackMetadata(id: string): Promise<Track | null> {
    return new Promise((resolve) => {
      const url = `https://www.youtube.com/watch?v=${id}`;
      const args = ['--skip-download', '--dump-json', '--js-runtimes', 'node', '-4', '--impersonate', 'chrome', url];

      exec(`"${this.ytdlPath}" ${args.join(' ')}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`[YTDL-SERVICE] Failed to get metadata for ID: ${id}. Error:`, stderr);
          resolve(null);
          return;
        }

        try {
          const info = JSON.parse(stdout);
          let artist = info.artist || info.creator || info.uploader || 'Unknown Artist';
          if (artist.endsWith(' - Topic')) {
            artist = artist.slice(0, -8);
          }

          resolve({
            id: info.id,
            title: info.title || 'Unknown Title',
            artist,
            duration: info.duration ? Math.round(info.duration) : 0,
            thumbnail: info.thumbnail || `https://i.ytimg.com/vi/${info.id}/hqdefault.jpg`,
          });
        } catch (e) {
          resolve(null);
        }
      });
    });
  }
}

export const ytdlService = new YtdlService();
export default ytdlService;

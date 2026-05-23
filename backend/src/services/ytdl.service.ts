import { exec, spawn } from 'child_process';
import https from 'https';
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

  // Official YouTube Data API v3 Search
  private async searchOfficial(query: string, limit: number): Promise<Track[]> {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) return [];

    return new Promise((resolve) => {
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${limit}&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`;
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const body = JSON.parse(data);
            if (body.error) {
              console.error('[YTDL-SERVICE] YouTube API error:', body.error.message);
              resolve([]);
              return;
            }

            const items = body.items || [];
            const tracks: Track[] = items.map((item: any) => ({
              id: item.id.videoId,
              title: item.snippet.title || 'Unknown Title',
              artist: item.snippet.channelTitle || 'Unknown Artist',
              duration: 180, // Default fallback duration
              thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`,
            }));

            resolve(tracks);
          } catch (e) {
            resolve([]);
          }
        });
      }).on('error', (err) => {
        console.error('[YTDL-SERVICE] YouTube API request failed:', err.message);
        resolve([]);
      });
    });
  }

  // Get durations using official API
  private async getDurations(ids: string[]): Promise<Record<string, number>> {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey || ids.length === 0) return {};

    return new Promise((resolve) => {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${ids.join(',')}&key=${apiKey}`;
      https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const body = JSON.parse(data);
            const items = body.items || [];
            const durations: Record<string, number> = {};
            for (const item of items) {
              const isoDuration = item.contentDetails?.duration;
              if (isoDuration) {
                durations[item.id] = this.parseISODuration(isoDuration);
              }
            }
            resolve(durations);
          } catch (e) {
            resolve({});
          }
        });
      }).on('error', () => resolve({}));
    });
  }

  private parseISODuration(isoDuration: string): number {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);
    return hours * 3600 + minutes * 60 + seconds;
  }

  // Fallback: Invidious API Search (uses public free open-source instances)
  private async searchInvidious(query: string, limit: number): Promise<Track[]> {
    const instances = [
      'yewtu.be',
      'invidious.io',
      'vid.puffyan.us',
      'inv.tux.im',
      'invidious.flokinet.to',
      'invidious.snopyta.org'
    ];

    // Try instances in sequence
    for (const instance of instances) {
      try {
        console.log(`[YTDL-SERVICE] Trying Invidious search on instance: ${instance}`);
        const tracks = await new Promise<Track[]>((resolve, reject) => {
          const url = `https://${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video&limit=${limit}`;
          
          https.get(url, { timeout: 8000 }, (res) => {
            if (res.statusCode !== 200) {
              reject(new Error(`Status ${res.statusCode}`));
              return;
            }
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
              try {
                const body = JSON.parse(data);
                if (!Array.isArray(body)) {
                  reject(new Error('Invalid response format'));
                  return;
                }
                const mapped: Track[] = body.slice(0, limit).map((item: any) => ({
                  id: item.videoId,
                  title: item.title || 'Unknown Title',
                  artist: item.author || 'Unknown Artist',
                  duration: item.lengthSeconds || 0,
                  thumbnail: item.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`,
                }));
                resolve(mapped);
              } catch (e) {
                reject(e);
              }
            });
          }).on('error', reject);
        });

        if (tracks.length > 0) {
          console.log(`[YTDL-SERVICE] Invidious search succeeded on instance: ${instance}`);
          return tracks;
        }
      } catch (err: any) {
        console.warn(`[YTDL-SERVICE] Invidious instance ${instance} failed:`, err.message);
      }
    }

    return [];
  }

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
    let tracks: Track[] = [];

    // Layer 1: Official YouTube Data API
    if (process.env.YOUTUBE_API_KEY) {
      console.log('[YTDL-SERVICE] Attempting Search via Official YouTube API v3...');
      try {
        tracks = await this.searchOfficial(cleanedQuery, limit);
        if (tracks.length > 0) {
          const ids = tracks.map(t => t.id);
          const durations = await this.getDurations(ids);
          for (const track of tracks) {
            if (durations[track.id] !== undefined) {
              track.duration = durations[track.id];
            }
          }
        }
      } catch (e: any) {
        console.error('[YTDL-SERVICE] Official YouTube search failed:', e.message);
      }
    }

    // Layer 2: Invidious API Fallback (Keyless, Zero-Config, Extremely stable)
    if (tracks.length === 0) {
      console.log('[YTDL-SERVICE] Attempting Search via Invidious public fallback API...');
      try {
        tracks = await this.searchInvidious(cleanedQuery, limit);
      } catch (e: any) {
        console.error('[YTDL-SERVICE] Invidious search fallback failed:', e.message);
      }
    }

    // Layer 3: Legacy yt-dlp scraping fallback
    if (tracks.length === 0) {
      console.log('[YTDL-SERVICE] Attempting Search via legacy local yt-dlp fallback...');
      tracks = await new Promise<Track[]>((resolve) => {
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

        const child = spawn(this.ytdlPath, args, {
          env: {
            ...process.env,
            HOME: '/home/node',
            PYTHONPATH: '/usr/local/lib/python3.11/dist-packages:/usr/local/lib/python3.12/dist-packages:/usr/local/lib/python3.10/dist-packages:/usr/local/lib/python3/dist-packages:/home/node/.local/lib/python3.11/site-packages:/home/node/.local/lib/python3.12/site-packages:/home/node/.local/lib/python3.10/site-packages'
          }
        });
        let stdoutData = '';
        let stderrData = '';

        child.stdout.on('data', (data) => {
          stdoutData += data.toString();
        });

        child.stderr.on('data', (data) => {
          stderrData += data.toString();
        });

        child.on('close', (code) => {
          this.lastError = code !== 0 ? `Failed with exit code ${code}` : '';
          this.lastStdout = stdoutData;
          this.lastStderr = stderrData;

          if (code !== 0 && stdoutData.trim() === '') {
            console.error(`[YTDL-SERVICE] yt-dlp search fallback process failed with code ${code}. Error: ${stderrData}`);
            resolve([]);
            return;
          }

          const lines = stdoutData.split('\n').filter(Boolean);
          const ytdlTracks: Track[] = [];

          for (const line of lines) {
            try {
              const info = JSON.parse(line);
              if (!info.id) continue;

              let artist = info.artist || info.creator || info.uploader || 'Unknown Artist';
              if (artist.endsWith(' - Topic')) {
                artist = artist.slice(0, -8);
              }

              ytdlTracks.push({
                id: info.id,
                title: info.title || 'Unknown Title',
                artist,
                duration: info.duration ? Math.round(info.duration) : 0,
                thumbnail: info.thumbnail || `https://i.ytimg.com/vi/${info.id}/hqdefault.jpg`,
              });
            } catch (e) {
              // Ignore malformed lines
            }
          }

          resolve(ytdlTracks);
        });
      });
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

    return tracks;
  }

  // Get direct audio streaming URL from YouTube video ID
  public async getStreamUrl(id: string): Promise<string | null> {
    return new Promise((resolve) => {
      const url = `https://www.youtube.com/watch?v=${id}`;
      // Prefer M4A (AAC codec) for native audio tag playing, fall back to bestaudio
      const format = 'bestaudio[ext=m4a]/bestaudio';
      const args = ['-f', format, '--js-runtimes', 'node', '-4', '--impersonate', 'chrome', '-g', url];

      // Explicitly pass HOME and PYTHONPATH so yt-dlp can locate curl-cffi
      const envOptions = {
        env: {
          ...process.env,
          HOME: '/home/node',
          PYTHONPATH: '/usr/local/lib/python3.11/dist-packages:/usr/local/lib/python3.12/dist-packages:/usr/local/lib/python3.10/dist-packages:/usr/local/lib/python3/dist-packages:/home/node/.local/lib/python3.11/site-packages:/home/node/.local/lib/python3.12/site-packages:/home/node/.local/lib/python3.10/site-packages'
        }
      };

      exec(`"${this.ytdlPath}" ${args.join(' ')}`, envOptions, (error, stdout, stderr) => {
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

      // Explicitly pass HOME and PYTHONPATH so yt-dlp can locate curl-cffi
      const envOptions = {
        env: {
          ...process.env,
          HOME: '/home/node',
          PYTHONPATH: '/usr/local/lib/python3.11/dist-packages:/usr/local/lib/python3.12/dist-packages:/usr/local/lib/python3.10/dist-packages:/usr/local/lib/python3/dist-packages:/home/node/.local/lib/python3.11/site-packages:/home/node/.local/lib/python3.12/site-packages:/home/node/.local/lib/python3.10/site-packages'
        }
      };

      exec(`"${this.ytdlPath}" ${args.join(' ')}`, envOptions, (error, stdout, stderr) => {
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

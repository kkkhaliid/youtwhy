import { Request, Response } from 'express';
import { ytdlService } from '../services/ytdl.service';
import db from '../db/sqlite';

// Premium default songs for WaveFlow home dashboard (Synthwave/Cyberpunk/Chill vibes)
const DEFAULT_RECOMMENDATIONS = [
  {
    id: '4xDzrJKXOOY',
    title: 'Synthwave Radio - Chill synth beats to game/relax',
    artist: 'Lofi Girl Synthwave',
    duration: 0, // Live stream/very long
    thumbnail: 'https://i.ytimg.com/vi/4xDzrJKXOOY/hqdefault.jpg',
  },
  {
    id: '5qap5aO4i9A',
    title: 'Lofi Hip Hop Radio - Beats to Relax/Study to',
    artist: 'Lofi Girl',
    duration: 0,
    thumbnail: 'https://i.ytimg.com/vi/5qap5aO4i9A/hqdefault.jpg',
  },
  {
    id: 'tNefFayutWw',
    title: 'Cyberpunk Ambient Music - Neon Rain & Chill Synths',
    artist: 'Cyber Vibes',
    duration: 3600,
    thumbnail: 'https://i.ytimg.com/vi/tNefFayutWw/hqdefault.jpg',
  },
  {
    id: 'f3kG_zVnSgM',
    title: 'Resonance',
    artist: 'HOME',
    duration: 212,
    thumbnail: 'https://i.ytimg.com/vi/f3kG_zVnSgM/hqdefault.jpg',
  },
  {
    id: 'U7JleMh8HkY',
    title: 'M83 - Midnight City',
    artist: 'M83',
    duration: 243,
    thumbnail: 'https://i.ytimg.com/vi/U7JleMh8HkY/hqdefault.jpg',
  }
];

class MusicController {
  // Search YouTube/Cache for songs
  public search = async (req: Request, res: Response): Promise<void> => {
    const query = req.query.q as string;
    const limit = parseInt(req.query.limit as string || '20', 10);
    const debug = req.query.debug === 'true';

    console.log(`[MUSIC] Search request received. Query: "${query}", Limit: ${limit}`);

    if (!query) {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    try {
      const tracks = await ytdlService.search(query, limit);
      console.log(`[MUSIC] Search query: "${query}" returned ${tracks.length} tracks.`);
      
      if (debug) {
        let curlCffiPath = 'Not found';
        try {
          const { execSync } = require('child_process');
          curlCffiPath = execSync('python3 -c "import curl_cffi; print(curl_cffi.__file__)"').toString().trim();
        } catch (e: any) {
          curlCffiPath = 'Error: ' + e.message;
        }

        res.json({
          query,
          limit,
          tracksCount: tracks.length,
          tracks,
          ytdlPath: (ytdlService as any).ytdlPath,
          curlCffiPath,
          lastError: ytdlService.lastError,
          lastStdout: ytdlService.lastStdout,
          lastStderr: ytdlService.lastStderr,
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      res.json(tracks);
    } catch (error: any) {
      console.error('[MUSIC] Search error:', error);
      res.status(500).json({ error: 'Internal server error while searching', details: error.message });
    }
  };

  // Get track metadata by ID
  public getTrack = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Track ID is required' });
      return;
    }

    try {
      // First try to fetch from cache or database history/likes
      const cached = await db.get<any>(
        'SELECT title, artist, thumbnail, duration FROM likes WHERE track_id = ? UNION SELECT title, artist, thumbnail, duration FROM history WHERE track_id = ? LIMIT 1',
        [id, id]
      );

      if (cached) {
        res.json({ id, ...cached });
        return;
      }

      // If not in cache/db, get direct from YouTube metadata
      const track = await ytdlService.getTrackMetadata(id);
      if (!track) {
        res.status(404).json({ error: 'Track metadata not found' });
        return;
      }

      res.json(track);
    } catch (error: any) {
      console.error('[MUSIC] Metadata error:', error);
      res.status(500).json({ error: 'Internal server error fetching metadata' });
    }
  };

  // Get premium visual dashboard recommendations
  public getRecommendations = async (req: Request, res: Response): Promise<void> => {
    console.log(`[MUSIC] Recommendations requested by client at: ${new Date().toISOString()}`);
    try {
      // Return custom playlist recommendation + mood selections
      res.json({
        recommended: DEFAULT_RECOMMENDATIONS,
        moods: [
          { name: 'Cyberpunk Neon', tag: 'synthwave cyberpunk' },
          { name: 'Lofi Rain', tag: 'lofi hip hop study beats' },
          { name: 'Deep Focus', tag: 'ambient deep focus space' },
          { name: 'Workout Power', tag: 'synthwave electronic dance' },
          { name: 'Acoustic Calm', tag: 'acoustic indie cover chill' }
        ]
      });
    } catch (error: any) {
      console.error('[MUSIC] Get recommendations error:', error);
      res.status(500).json({ error: 'Internal server error fetching recommendations' });
    }
  };

  // Diagnostic endpoint to test yt-dlp binary and external dependencies directly
  public testYtdl = async (req: Request, res: Response): Promise<void> => {
    const cmd = req.query.cmd as string || 'yt-dlp --version';
    console.log(`[TEST-YTDL] Diagnostic request received. Cmd: "${cmd}"`);
    try {
      const { execSync } = require('child_process');
      const stdout = execSync(cmd, {
        timeout: 5000,
        env: {
          ...process.env,
          HOME: '/home/node',
          PYTHONPATH: '/usr/local/lib/python3.11/dist-packages:/usr/local/lib/python3.12/dist-packages:/usr/local/lib/python3.10/dist-packages:/usr/local/lib/python3/dist-packages:/home/node/.local/lib/python3.11/site-packages:/home/node/.local/lib/python3.12/site-packages:/home/node/.local/lib/python3.10/site-packages'
        }
      }).toString();
      
      res.json({ cmd, success: true, stdout });
    } catch (e: any) {
      res.status(500).json({
        cmd,
        success: false,
        error: e.message,
        stderr: e.stderr?.toString(),
        stdout: e.stdout?.toString()
      });
    }
  };
}

export const musicController = new MusicController();
export default musicController;

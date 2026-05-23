import { Response } from 'express';
import { db } from '../db/sqlite';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

class UserFeaturesController {
  // ==========================================
  // LIKES (FAVORITES)
  // ==========================================

  // Get user's liked tracks
  public getLikes = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const likes = await db.all<any>(
        'SELECT track_id as id, title, artist, thumbnail, duration, created_at FROM likes WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );
      res.json(likes);
    } catch (error: any) {
      console.error('[FEATURES] Get likes error:', error);
      res.status(500).json({ error: 'Failed to retrieve liked songs' });
    }
  };

  // Toggle like status for a track
  public toggleLike = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { trackId, title, artist, thumbnail, duration } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!trackId || !title || !artist || !thumbnail || duration === undefined) {
      res.status(400).json({ error: 'Track details are incomplete' });
      return;
    }

    try {
      const existing = await db.get<any>(
        'SELECT id FROM likes WHERE user_id = ? AND track_id = ?',
        [userId, trackId]
      );

      if (existing) {
        // Unlike
        await db.run('DELETE FROM likes WHERE user_id = ? AND track_id = ?', [userId, trackId]);
        res.json({ liked: false, message: 'Song removed from Liked Songs' });
      } else {
        // Like
        await db.run(
          'INSERT INTO likes (user_id, track_id, title, artist, thumbnail, duration) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, trackId, title, artist, thumbnail, duration]
        );
        res.json({ liked: true, message: 'Song added to Liked Songs' });
      }
    } catch (error: any) {
      console.error('[FEATURES] Toggle like error:', error);
      res.status(500).json({ error: 'Failed to update song status' });
    }
  };

  // Check if a specific track is liked by the current user
  public checkLiked = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { trackId } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const liked = await db.get<any>(
        'SELECT id FROM likes WHERE user_id = ? AND track_id = ?',
        [userId, trackId]
      );
      res.json({ liked: !!liked });
    } catch (error: any) {
      res.status(500).json({ error: 'Error checking song like status' });
    }
  };

  // ==========================================
  // PLAYBACK HISTORY
  // ==========================================

  // Get user's recently played tracks
  public getHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const history = await db.all<any>(
        'SELECT track_id as id, title, artist, thumbnail, duration, played_at FROM history WHERE user_id = ? ORDER BY played_at DESC LIMIT 50',
        [userId]
      );
      res.json(history);
    } catch (error: any) {
      console.error('[FEATURES] Get history error:', error);
      res.status(500).json({ error: 'Failed to retrieve playback history' });
    }
  };

  // Add song to user's history
  public addHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { trackId, title, artist, thumbnail, duration } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!trackId || !title || !artist || !thumbnail || duration === undefined) {
      res.status(400).json({ error: 'Track details are incomplete' });
      return;
    }

    try {
      // Add entry to history
      await db.run(
        'INSERT INTO history (user_id, track_id, title, artist, thumbnail, duration) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, trackId, title, artist, thumbnail, duration]
      );

      // Clean up history to keep only top 50 recently played tracks per user
      const count = await db.get<{ total: number }>(
        'SELECT COUNT(*) as total FROM history WHERE user_id = ?',
        [userId]
      );

      if (count && count.total > 50) {
        await db.run(
          `DELETE FROM history WHERE user_id = ? AND id NOT IN (
            SELECT id FROM history WHERE user_id = ? ORDER BY played_at DESC LIMIT 50
          )`,
          [userId, userId]
        );
      }

      res.status(201).json({ success: true });
    } catch (error: any) {
      console.error('[FEATURES] Add history error:', error);
      res.status(500).json({ error: 'Failed to record playback history' });
    }
  };

  // ==========================================
  // MUSIC QUEUE SYNC
  // ==========================================

  // Get synchronized queue
  public getQueue = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const queue = await db.all<any>(
        'SELECT track_id as id, title, artist, thumbnail, duration FROM queue WHERE user_id = ? ORDER BY position ASC',
        [userId]
      );
      res.json(queue);
    } catch (error: any) {
      console.error('[FEATURES] Get queue error:', error);
      res.status(500).json({ error: 'Failed to retrieve synchronized queue' });
    }
  };

  // Sync entire queue (overwrite client queue state)
  public syncQueue = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { tracks } = req.body; // Array of Track objects

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!Array.isArray(tracks)) {
      res.status(400).json({ error: 'Tracks must be a valid array' });
      return;
    }

    try {
      // We clear user queue and insert sequentially in a transaction-like serialize
      await db.run('DELETE FROM queue WHERE user_id = ?', [userId]);

      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        if (!track.id || !track.title || !track.artist || !track.thumbnail || track.duration === undefined) {
          continue;
        }
        await db.run(
          'INSERT INTO queue (user_id, track_id, title, artist, thumbnail, duration, position) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [userId, track.id, track.title, track.artist, track.thumbnail, track.duration, i]
        );
      }

      res.json({ success: true, message: 'Queue synchronized successfully' });
    } catch (error: any) {
      console.error('[FEATURES] Sync queue error:', error);
      res.status(500).json({ error: 'Failed to synchronize active queue' });
    }
  };
}

export const userFeaturesController = new UserFeaturesController();
export default userFeaturesController;

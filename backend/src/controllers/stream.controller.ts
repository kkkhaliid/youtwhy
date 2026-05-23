import { Request, Response } from 'express';
import https from 'https';
import { IncomingMessage } from 'http';
import { ytdlService } from '../services/ytdl.service';

// Helper to make HTTPS requests, follow redirects recursively, and preserve Range header
function requestAndFollowRedirects(
  options: https.RequestOptions,
  onResponse: (proxyRes: IncomingMessage) => void,
  onError: (err: any) => void,
  maxRedirects = 5
): void {
  const proxyReq = https.request(options, (proxyRes) => {
    const statusCode = proxyRes.statusCode || 0;
    
    if ([301, 302, 303, 307, 308].includes(statusCode) && proxyRes.headers.location) {
      if (maxRedirects <= 0) {
        onError(new Error('Too many redirects'));
        return;
      }
      
      const redirectUrl = proxyRes.headers.location;
      console.log(`[STREAM] Following redirect (rem: ${maxRedirects}): ${redirectUrl}`);
      try {
        const urlObj = new URL(redirectUrl);
        const newOptions: https.RequestOptions = {
          hostname: urlObj.hostname,
          path: urlObj.pathname + urlObj.search,
          method: 'GET',
          headers: { ...options.headers },
        };
        requestAndFollowRedirects(newOptions, onResponse, onError, maxRedirects - 1);
      } catch (err) {
        onError(err);
      }
    } else {
      onResponse(proxyRes);
    }
  });

  proxyReq.on('error', onError);
  proxyReq.end();
}

class StreamController {
  // In-memory cache for direct stream URLs to prevent calling yt-dlp on every byte-range chunk request
  // Format: trackId -> { url, expiresAt }
  private streamUrlCache = new Map<string, { url: string; expiresAt: number }>();

  // Stream audio track by ID
  public stream = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ error: 'Track ID is required' });
      return;
    }

    try {
      let streamUrl = '';
      const cached = this.streamUrlCache.get(id);
      const now = Date.now();

      if (cached && cached.expiresAt > now) {
        streamUrl = cached.url;
      } else {
        console.log(`[STREAM] Fetching new stream URL from yt-dlp for ID: ${id}`);
        const freshUrl = await ytdlService.getStreamUrl(id);
        if (!freshUrl) {
          const fallbackInstances = [
            'inv.nadeko.net',
            'yewtu.be',
            'invidious.nerdvpn.de',
            'invidious.f5.si'
          ];
          const instance = fallbackInstances[Math.floor(Math.random() * fallbackInstances.length)];
          const fallbackUrl = `https://${instance}/latest_version?id=${id}&itag=140&local=true`;
          console.log(`[STREAM] yt-dlp failed due to YouTube bot block on Hugging Face. Redirecting browser client to: ${fallbackUrl}`);
          res.redirect(fallbackUrl);
          return;
        }
        streamUrl = freshUrl;
        // YouTube stream URLs generally expire after 6 hours. We cache for 2 hours safely.
        this.streamUrlCache.set(id, {
          url: freshUrl,
          expiresAt: now + 2 * 60 * 60 * 1000,
        });
      }

      // Check if this is a download request
      const isDownload = req.query.download === 'true';
      let contentDisposition = 'inline';
      if (isDownload) {
        let filename = `track-${id}.m4a`;
        try {
          const metadata = await ytdlService.getTrackMetadata(id);
          if (metadata) {
            const sanitizedTitle = metadata.title.replace(/[\\/*?:"<>|]/g, '_');
            const sanitizedArtist = metadata.artist.replace(/[\\/*?:"<>|]/g, '_');
            filename = `${sanitizedArtist} - ${sanitizedTitle}.m4a`;
          }
        } catch (e) {
          console.error('[STREAM] Metadata fetch failed for download naming:', e);
        }
        contentDisposition = `attachment; filename="${encodeURIComponent(filename)}"`;
      }

      // Check for Range header to support scrubbing/seeking
      const range = req.headers.range;

      const urlObj = new URL(streamUrl);
      const options: https.RequestOptions = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {},
      };

      if (range) {
        console.log(`[STREAM] Range request for track ${id}: ${range}`);
        options.headers = {
          Range: range,
        };

        requestAndFollowRedirects(
          options,
          (proxyRes) => {
            if (proxyRes.statusCode === 206 || proxyRes.statusCode === 200) {
              res.writeHead(proxyRes.statusCode, {
                'Content-Range': proxyRes.headers['content-range'] || '',
                'Accept-Ranges': 'bytes',
                'Content-Length': proxyRes.headers['content-length'] || '',
                'Content-Type': 'audio/mp4', // M4A tracks are containerized AAC
                'Cache-Control': 'public, max-age=3600',
                'Content-Disposition': contentDisposition,
              });
              proxyRes.pipe(res);
            } else {
              console.error(`[STREAM] Upstream returned error code after redirect follow: ${proxyRes.statusCode}`);
              res.status(proxyRes.statusCode || 500).json({ error: 'Error streaming from source' });
            }
          },
          (err) => {
            console.error('[STREAM] Proxy request error:', err);
            res.status(500).json({ error: 'Streaming proxy connection failed' });
          }
        );
      } else {
        console.log(`[STREAM] Full request for track ${id}`);
        requestAndFollowRedirects(
          options,
          (proxyRes) => {
            res.writeHead(proxyRes.statusCode || 200, {
              'Accept-Ranges': 'bytes',
              'Content-Length': proxyRes.headers['content-length'] || '',
              'Content-Type': 'audio/mp4',
              'Cache-Control': 'public, max-age=3600',
              'Content-Disposition': contentDisposition,
            });
            proxyRes.pipe(res);
          },
          (err) => {
            console.error('[STREAM] Proxy request error:', err);
            res.status(500).json({ error: 'Streaming proxy connection failed' });
          }
        );
      }
    } catch (error: any) {
      console.error('[STREAM] Streaming controller error:', error);
      res.status(500).json({ error: 'Internal server error while streaming' });
    }
  };
}

export const streamController = new StreamController();
export default streamController;

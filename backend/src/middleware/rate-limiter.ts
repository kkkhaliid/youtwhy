import { Request, Response, NextFunction } from 'express';

interface RateLimitInfo {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private ipRequestMap = new Map<string, RateLimitInfo>();
  private activeStreamsMap = new Map<string, number>();

  // General API Rate Limiting: Max 200 requests per 1 minute
  public apiLimiter = (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 200;

    let info = this.ipRequestMap.get(ip);

    if (!info || now > info.resetTime) {
      info = {
        count: 1,
        resetTime: now + windowMs,
      };
      this.ipRequestMap.set(ip, info);
      next();
      return;
    }

    info.count++;

    if (info.count > maxRequests) {
      console.warn(`[SECURITY] Rate limit exceeded for IP: ${ip} on path: ${req.path}`);
      res.status(429).json({
        error: 'Too many requests. Please slow down and try again later.',
        retryAfterMs: info.resetTime - now,
      });
      return;
    }

    next();
  };

  // Stream Abuse Prevention: Monitor concurrent streams
  public streamAbusePreventer = (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const activeLimit = 5; // Allow max 5 simultaneous stream connections per IP

    const activeConnections = this.activeStreamsMap.get(ip) || 0;

    if (activeConnections >= activeLimit) {
      console.warn(`[SECURITY] Potential stream abuse: ${ip} exceeded concurrent stream limit (${activeLimit})`);
      res.status(429).json({ error: 'Too many concurrent streams. Please close other playing sessions.' });
      return;
    }

    // Increment active connections
    this.activeStreamsMap.set(ip, activeConnections + 1);

    // Decrement connection on response finish or close
    const decrement = () => {
      const current = this.activeStreamsMap.get(ip) || 1;
      if (current <= 1) {
        this.activeStreamsMap.delete(ip);
      } else {
        this.activeStreamsMap.set(ip, current - 1);
      }
    };

    res.on('finish', decrement);
    res.on('close', decrement);

    next();
  };
}

export const security = new RateLimiter();
export default security;

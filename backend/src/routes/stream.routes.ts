import { Router } from 'express';
import { streamController } from '../controllers/stream.controller';
import { optionalAuthMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Streaming endpoint is accessible and optimized for range requests
router.get('/:id', optionalAuthMiddleware as any, streamController.stream as any);

export default router;

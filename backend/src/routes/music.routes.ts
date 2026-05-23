import { Router } from 'express';
import { musicController } from '../controllers/music.controller';
import { userFeaturesController } from '../controllers/user-features.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Music search and metadata lookup
router.get('/search', musicController.search);
router.get('/recommendations', musicController.getRecommendations);
router.get('/tracks/:id', musicController.getTrack);

// User-specific features (Likes, History, Queue Sync) - Protected by JWT
router.get('/likes', authMiddleware as any, userFeaturesController.getLikes as any);
router.post('/likes/toggle', authMiddleware as any, userFeaturesController.toggleLike as any);
router.get('/likes/check/:trackId', authMiddleware as any, userFeaturesController.checkLiked as any);

router.get('/history', authMiddleware as any, userFeaturesController.getHistory as any);
router.post('/history', authMiddleware as any, userFeaturesController.addHistory as any);

router.get('/queue', authMiddleware as any, userFeaturesController.getQueue as any);
router.post('/queue', authMiddleware as any, userFeaturesController.syncQueue as any);

export default router;

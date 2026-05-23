import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Public auth endpoints
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected session check
router.get('/me', authMiddleware as any, authController.me as any);

export default router;

import { Router } from 'express';
import { ActivityController } from '../controllers/activity.controller';
import { authMiddleware } from '../middleware/auth-middleware';

const router = Router();

router.get('/', authMiddleware, ActivityController.getUserActivity);
// router.get('/all', authMiddleware, ActivityController.getAllActivity); // Admin only

export default router; 
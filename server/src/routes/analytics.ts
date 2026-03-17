import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { verifyToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(verifyToken);
// Ensure only managers can see the full analytics
router.get('/leaderboard', requireRole('manager'), AnalyticsController.getLeaderboard);

export default router;

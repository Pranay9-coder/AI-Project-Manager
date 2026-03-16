import { Router } from 'express';
import { DeveloperController } from '../controllers/developerController';
import { verifyToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(verifyToken);

// Manager-only: browse developer directory
router.get('/', requireRole('manager'), DeveloperController.getDevelopers);
router.get(
  '/specializations',
  requireRole('manager'),
  DeveloperController.getSpecializations
);

export default router;

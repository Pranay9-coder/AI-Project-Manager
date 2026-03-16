import { Router } from 'express';
import { ProjectController } from '../controllers/projectController';
import { verifyToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(verifyToken);

// Manager-only: create project
router.post('/', requireRole('manager'), ProjectController.createProject);

// Both roles: list projects (role-aware)
router.get('/', ProjectController.getProjects);

// Both roles: get project details
router.get('/:projectId', ProjectController.getProjectById);

export default router;

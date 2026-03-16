import { Router } from 'express';
import { TaskController } from '../controllers/taskController';
import { verifyToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(verifyToken);

// Get tasks (role-aware)
router.get('/', TaskController.getTasks);

// Get tasks for a specific project
router.get('/project/:projectId', TaskController.getProjectTasks);

// Update task status (any authenticated user)
router.patch('/:taskId/status', TaskController.updateStatus);

// Assign task (manager only)
router.patch('/:taskId/assign', requireRole('manager'), TaskController.assignTask);

export default router;

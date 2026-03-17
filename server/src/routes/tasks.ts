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

// PR Review Flows
// Developer submits a PR / Fix
router.post('/:taskId/pr', TaskController.submitPR);

// Manager accepts PR
router.post('/:taskId/pr/accept', requireRole('manager'), TaskController.acceptPR);

// Manager rejects PR
router.post('/:taskId/pr/reject', requireRole('manager'), TaskController.rejectPR);

export default router;

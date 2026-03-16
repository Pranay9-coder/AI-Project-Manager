import { Router } from 'express';
import { TeamController } from '../controllers/teamController';
import { InvitationController } from '../controllers/invitationController';
import { verifyToken, requireRole } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Team CRUD
router.post('/', requireRole('manager'), TeamController.createTeam);
router.get('/', TeamController.getTeams);
router.get('/:teamId', TeamController.getTeamById);
router.get('/:teamId/members', TeamController.getTeamMembers);
router.delete(
  '/:teamId/members/:developerId',
  requireRole('manager'),
  TeamController.removeMember
);

// Invitation via team route
router.post(
  '/:teamId/invite/:developerId',
  requireRole('manager'),
  InvitationController.sendInvitation
);

export default router;

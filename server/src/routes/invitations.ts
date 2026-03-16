import { Router } from 'express';
import { InvitationController } from '../controllers/invitationController';
import { verifyToken, requireRole } from '../middleware/auth';

const router = Router();

router.use(verifyToken);

// Get invitations (role-aware)
router.get('/', InvitationController.getInvitations);

// Developer actions
router.patch(
  '/:invitationId/accept',
  requireRole('developer'),
  InvitationController.acceptInvitation
);
router.patch(
  '/:invitationId/reject',
  requireRole('developer'),
  InvitationController.rejectInvitation
);

export default router;

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { InvitationService } from '../services/invitationService';
import { TeamService } from '../services/teamService';
import { sendToUser, WSEvent } from '../websocket';

export class InvitationController {
  /**
   * POST /teams/:teamId/invite/:developerId
   * Send invitation to a developer (manager only)
   */
  static async sendInvitation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { teamId, developerId } = req.params;

      // Verify team belongs to manager
      const team = await TeamService.getTeamById(teamId);
      if (!team || team.manager_id !== req.user!.id) {
        res.status(403).json({ error: 'Not authorized to invite to this team' });
        return;
      }

      const invitation = await InvitationService.sendInvitation(teamId, developerId);

      // Notify developer via WebSocket
      sendToUser(developerId, WSEvent.NEW_INVITATION, {
        invitation,
        team: { id: team.id, team_name: team.team_name },
      });

      res.status(201).json({ invitation });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /invitations
   * Get invitations (role-aware)
   */
  static async getInvitations(req: AuthRequest, res: Response): Promise<void> {
    try {
      let invitations;
      if (req.user!.role_type === 'manager') {
        invitations = await InvitationService.getManagerInvitations(req.user!.id);
      } else {
        invitations = await InvitationService.getDeveloperInvitations(req.user!.id);
      }

      res.json({ invitations });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PATCH /invitations/:invitationId/accept
   * Accept an invitation (developer only)
   */
  static async acceptInvitation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { invitationId } = req.params;

      const invitation = await InvitationService.respondToInvitation(
        invitationId,
        req.user!.id,
        'accepted'
      );

      // Notify manager via WebSocket
      const team = await TeamService.getTeamById(invitation.team_id);
      if (team) {
        sendToUser(team.manager_id, WSEvent.INVITATION_ACCEPTED, {
          invitation,
          developer_id: req.user!.id,
        });
      }

      res.json({ invitation, message: 'Invitation accepted' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * PATCH /invitations/:invitationId/reject
   * Reject an invitation (developer only)
   */
  static async rejectInvitation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { invitationId } = req.params;

      const invitation = await InvitationService.respondToInvitation(
        invitationId,
        req.user!.id,
        'rejected'
      );

      // Notify manager
      const team = await TeamService.getTeamById(invitation.team_id);
      if (team) {
        sendToUser(team.manager_id, WSEvent.INVITATION_REJECTED, {
          invitation,
          developer_id: req.user!.id,
        });
      }

      res.json({ invitation, message: 'Invitation rejected' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

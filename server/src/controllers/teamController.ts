import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { TeamService } from '../services/teamService';

export class TeamController {
  /**
   * POST /teams
   * Create a new team (manager only)
   */
  static async createTeam(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { team_name } = req.body;

      if (!team_name) {
        res.status(400).json({ error: 'team_name is required' });
        return;
      }

      const team = await TeamService.createTeam(req.user!.id, team_name);
      res.status(201).json({ team });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /teams
   * Get teams for current user (manager gets own teams, developer gets member teams)
   */
  static async getTeams(req: AuthRequest, res: Response): Promise<void> {
    try {
      let teams;
      if (req.user!.role_type === 'manager') {
        teams = await TeamService.getManagerTeams(req.user!.id);
      } else {
        teams = await TeamService.getDeveloperTeams(req.user!.id);
      }

      res.json({ teams });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /teams/:teamId
   * Get team details with members
   */
  static async getTeamById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { teamId } = req.params;

      const team = await TeamService.getTeamById(teamId);
      if (!team) {
        res.status(404).json({ error: 'Team not found' });
        return;
      }

      const members = await TeamService.getTeamMembers(teamId);

      res.json({ team, members });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /teams/:teamId/members
   * Get team members
   */
  static async getTeamMembers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { teamId } = req.params;
      const members = await TeamService.getTeamMembers(teamId);
      res.json({ members });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * DELETE /teams/:teamId/members/:developerId
   * Remove a member from team
   */
  static async removeMember(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { teamId, developerId } = req.params;

      // Verify team belongs to manager
      const team = await TeamService.getTeamById(teamId);
      if (!team || team.manager_id !== req.user!.id) {
        res.status(403).json({ error: 'Not authorized' });
        return;
      }

      await TeamService.removeMember(teamId, developerId);
      res.json({ message: 'Member removed successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

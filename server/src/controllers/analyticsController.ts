import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AnalyticsService } from '../services/analyticsService';

export class AnalyticsController {
  /**
   * GET /analytics/leaderboard
   * Get developer leaderboard based on performance scores
   */
  static async getLeaderboard(req: AuthRequest, res: Response): Promise<void> {
    try {
      const leaderboard = await AnalyticsService.getDeveloperLeaderboard();
      res.json({ leaderboard });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

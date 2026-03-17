import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DeveloperService } from '../services/developerService';
import { AIService } from '../services/aiService';
import { AnalyticsService } from '../services/analyticsService';

export class DeveloperController {
  /**
   * GET /developers
   * Fetch all developers with optional specialization filter
   */
  static async getDevelopers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const specialization = req.query.specialization as string | undefined;
      const developers = await DeveloperService.getAllDevelopers(specialization);
      res.json({ developers });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /developers/specializations
   * Get unique specializations for filter
   */
  static async getSpecializations(req: AuthRequest, res: Response): Promise<void> {
    try {
      const specializations = await DeveloperService.getSpecializations();
      res.json({ specializations });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /developers/recommend
   * Smartly recommend developers for a new project based on description, skills, score, and workload
   */
  static async recommendDevelopers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { description } = req.body;
      if (!description) {
        res.status(400).json({ error: 'Project description required for AI recommendation' });
        return;
      }

      // 1. Ask Gemini what roles/skills are needed
      const tasks = await AIService.generateTasksFromDescription(description, 'Recommendation Check');
      const requiredRoles = [...new Set(tasks.map(t => t.required_role.toLowerCase()))];

      // 2. Fetch full developer performance leaderboard
      const leaderboard = await AnalyticsService.getDeveloperLeaderboard();

      // 3. Rank developers: Math heuristic involving AI derived roles vs dev score/workload
      const ranked = leaderboard.map(dev => {
        let matchScore = 0;
        
        // Match specialization
        if (requiredRoles.includes(dev.specialization.toLowerCase())) {
          matchScore += 30;
        }

        const compositeScore = dev.performance_score + matchScore - (dev.workload * 5);
        
        return {
          ...dev,
          compositeScore,
        };
      }).sort((a, b) => b.compositeScore - a.compositeScore);

      res.json({ 
        requiredRoles,
        recommended: ranked.slice(0, 10) // Top 10 recommendations
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

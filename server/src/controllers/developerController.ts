import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DeveloperService } from '../services/developerService';

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
}

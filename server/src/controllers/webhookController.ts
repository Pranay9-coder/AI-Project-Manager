import { Request, Response } from 'express';
import { GitHubService } from '../services/githubService';

export class WebhookController {
  /**
   * POST /webhooks/github
   * Handle incoming GitHub webhook events
   */
  static async handleGitHub(req: Request, res: Response): Promise<void> {
    try {
      const eventType = req.headers['x-github-event'] as string;
      const payload = req.body;

      if (!payload) {
        res.status(400).send('No payload');
        return;
      }

      // Process async
      GitHubService.handleWebhook(payload, eventType).catch(err => {
        console.error('Error handling GitHub webhook in background:', err);
      });

      res.status(200).send('Webhook received');
    } catch (error: any) {
      console.error('Webhook Error:', error.message);
      res.status(500).send('Internal Server Error');
    }
  }
}

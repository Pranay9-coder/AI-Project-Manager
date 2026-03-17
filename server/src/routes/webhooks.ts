import { Router } from 'express';
import { WebhookController } from '../controllers/webhookController';

const router = Router();

router.post('/github', WebhookController.handleGitHub);

export default router;

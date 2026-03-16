import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { verifyToken } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/signup', AuthController.signup);
router.post('/login', AuthController.login);

// Protected routes
router.get('/me', verifyToken, AuthController.getMe);
router.put('/profile', verifyToken, AuthController.updateProfile);

export default router;

import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AuthService } from '../services/authService';
import { supabaseAdmin } from '../config/supabase';

export class AuthController {
  /**
   * POST /auth/signup
   * Creates Supabase user + profile
   */
  static async signup(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, password, name, role_type, specialization, skills } = req.body;

      if (!email || !password || !name || !role_type) {
        res.status(400).json({ error: 'Missing required fields: email, password, name, role_type' });
        return;
      }

      if (!['manager', 'developer'].includes(role_type)) {
        res.status(400).json({ error: 'role_type must be "manager" or "developer"' });
        return;
      }

      // Create Supabase auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (authError) {
        res.status(400).json({ error: authError.message });
        return;
      }

      // Create profile
      const profile = await AuthService.createProfile(authData.user.id, {
        name,
        email,
        role_type,
        specialization: specialization || '',
        skills: skills || [],
      });

      res.status(201).json({
        message: 'Account created successfully',
        user: {
          id: authData.user.id,
          email: authData.user.email,
        },
        profile,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /auth/login
   * Authenticates via Supabase and returns JWT
   */
  static async login(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      // Use a local, temporary client so we don't pollute the global supabaseAdmin with user sessions
      const { createClient } = require('@supabase/supabase-js');
      const { config } = require('../config');
      const tempClient = createClient(config.supabase.url, config.supabase.anonKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });

      const { data, error } = await tempClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Get profile
      const profile = await AuthService.getProfile(data.user.id);

      res.json({
        token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        profile,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /auth/me
   * Get current user's profile
   */
  static async getMe(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const profile = await AuthService.getProfile(req.user.id);

      if (!profile) {
        res.status(404).json({ error: 'Profile not found' });
        return;
      }

      res.json({ profile });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PUT /auth/profile
   * Update current user's profile
   */
  static async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const { name, specialization, skills } = req.body;

      const profile = await AuthService.updateProfile(req.user.id, {
        name,
        specialization,
        skills,
      });

      res.json({ profile });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

import { supabaseAdmin } from '../config/supabase';
import { Profile, RoleType } from '../types';

export class AuthService {
  /**
   * Create a user profile after signup
   */
  static async createProfile(
    userId: string,
    data: {
      name: string;
      email: string;
      role_type: RoleType;
      specialization: string;
      skills: string[];
    }
  ): Promise<Profile> {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        name: data.name,
        email: data.email,
        role_type: data.role_type,
        specialization: data.specialization,
        skills: data.skills,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create profile: ${error.message}`);
    }

    return profile;
  }

  /**
   * Get profile by user ID
   */
  static async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw new Error(`Failed to get profile: ${error.message}`);
    }

    return data;
  }

  /**
   * Update profile
   */
  static async updateProfile(
    userId: string,
    data: Partial<Pick<Profile, 'name' | 'specialization' | 'skills'>>
  ): Promise<Profile> {
    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .update(data)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update profile: ${error.message}`);
    }

    return profile;
  }
}

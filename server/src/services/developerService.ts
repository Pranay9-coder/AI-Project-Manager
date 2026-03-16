import { supabaseAdmin } from '../config/supabase';

export class DeveloperService {
  /**
   * Fetch all developers with optional specialization filter
   */
  static async getAllDevelopers(specialization?: string): Promise<any[]> {
    let query = supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('role_type', 'developer')
      .order('name', { ascending: true });

    if (specialization) {
      query = query.eq('specialization', specialization);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch developers: ${error.message}`);
    }

    // Fetch workload for each developer
    const developersWithWorkload = await Promise.all(
      (data || []).map(async (dev) => {
        const { count } = await supabaseAdmin
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', dev.id)
          .neq('status', 'completed');

        return {
          ...dev,
          workload: count || 0,
        };
      })
    );

    return developersWithWorkload;
  }

  /**
   * Get unique specializations for filter dropdown
   */
  static async getSpecializations(): Promise<string[]> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('specialization')
      .eq('role_type', 'developer')
      .not('specialization', 'is', null);

    if (error) {
      throw new Error(`Failed to fetch specializations: ${error.message}`);
    }

    const specializations = [
      ...new Set((data || []).map((d) => d.specialization).filter(Boolean)),
    ];

    return specializations;
  }
}

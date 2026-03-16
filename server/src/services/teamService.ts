import { supabaseAdmin } from '../config/supabase';
import { Team, TeamMember } from '../types';

export class TeamService {
  /**
   * Create a new team (manager only)
   */
  static async createTeam(managerId: string, teamName: string): Promise<Team> {
    const { data, error } = await supabaseAdmin
      .from('teams')
      .insert({
        team_name: teamName,
        manager_id: managerId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create team: ${error.message}`);
    }

    return data;
  }

  /**
   * Get teams managed by a specific manager
   */
  static async getManagerTeams(managerId: string): Promise<Team[]> {
    const { data, error } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('manager_id', managerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch teams: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a single team by ID
   */
  static async getTeamById(teamId: string): Promise<Team | null> {
    const { data, error } = await supabaseAdmin
      .from('teams')
      .select('*')
      .eq('id', teamId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch team: ${error.message}`);
    }

    return data;
  }

  /**
   * Get team members with profile details
   */
  static async getTeamMembers(teamId: string): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('team_members')
      .select(`
        team_id,
        developer_id,
        joined_at,
        profiles:developer_id (
          id,
          name,
          email,
          role_type,
          specialization,
          skills
        )
      `)
      .eq('team_id', teamId);

    if (error) {
      throw new Error(`Failed to fetch team members: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Add developer to team
   */
  static async addMember(teamId: string, developerId: string): Promise<TeamMember> {
    // Check if already a member
    const { data: existing } = await supabaseAdmin
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .eq('developer_id', developerId)
      .single();

    if (existing) {
      throw new Error('Developer is already a member of this team');
    }

    const { data, error } = await supabaseAdmin
      .from('team_members')
      .insert({
        team_id: teamId,
        developer_id: developerId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add member: ${error.message}`);
    }

    return data;
  }

  /**
   * Remove a member from team
   */
  static async removeMember(teamId: string, developerId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('developer_id', developerId);

    if (error) {
      throw new Error(`Failed to remove member: ${error.message}`);
    }
  }

  /**
   * Get teams a developer belongs to
   */
  static async getDeveloperTeams(developerId: string): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('team_members')
      .select(`
        team_id,
        joined_at,
        teams:team_id (
          id,
          team_name,
          manager_id,
          created_at
        )
      `)
      .eq('developer_id', developerId);

    if (error) {
      throw new Error(`Failed to fetch developer teams: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Check if manager has any teams
   */
  static async managerHasTeam(managerId: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('teams')
      .select('id')
      .eq('manager_id', managerId)
      .limit(1);

    if (error) {
      throw new Error(`Failed to check teams: ${error.message}`);
    }

    return (data?.length || 0) > 0;
  }
}

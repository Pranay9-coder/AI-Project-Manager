import { supabaseAdmin } from '../config/supabase';
import { Project } from '../types';
import { TeamService } from './teamService';

export class ProjectService {
  /**
   * Create a new project (manager only).
   * Validates that the manager has a team first.
   */
  static async createProject(
    managerId: string,
    teamId: string,
    name: string,
    description: string
  ): Promise<Project> {
    // Verify manager has a team
    const hasTeam = await TeamService.managerHasTeam(managerId);
    if (!hasTeam) {
      throw new Error('Team required before project creation');
    }

    // Verify the team belongs to this manager
    const team = await TeamService.getTeamById(teamId);
    if (!team || team.manager_id !== managerId) {
      throw new Error('Team not found or does not belong to this manager');
    }

    const { data, error } = await supabaseAdmin
      .from('projects')
      .insert({
        team_id: teamId,
        manager_id: managerId,
        name,
        description,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create project: ${error.message}`);
    }

    return data;
  }

  /**
   * Get projects managed by a manager
   */
  static async getManagerProjects(managerId: string): Promise<Project[]> {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('manager_id', managerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get projects for a developer (projects from their teams)
   */
  static async getDeveloperProjects(developerId: string): Promise<Project[]> {
    // First get team IDs
    const { data: memberships, error: memberError } = await supabaseAdmin
      .from('team_members')
      .select('team_id')
      .eq('developer_id', developerId);

    if (memberError) {
      throw new Error(`Failed to fetch memberships: ${memberError.message}`);
    }

    if (!memberships || memberships.length === 0) {
      return [];
    }

    const teamIds = memberships.map((m) => m.team_id);

    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .in('team_id', teamIds)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch projects: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get project by ID
   */
  static async getProjectById(projectId: string): Promise<Project | null> {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Failed to fetch project: ${error.message}`);
    }

    return data;
  }
}

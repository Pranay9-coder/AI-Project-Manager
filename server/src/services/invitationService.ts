import { supabaseAdmin } from '../config/supabase';
import { Invitation, InvitationStatus } from '../types';

export class InvitationService {
  /**
   * Send invitation to a developer
   */
  static async sendInvitation(
    teamId: string,
    developerId: string
  ): Promise<Invitation> {
    // Check for existing pending invitation
    const { data: existing } = await supabaseAdmin
      .from('invitations')
      .select('*')
      .eq('team_id', teamId)
      .eq('developer_id', developerId)
      .eq('status', 'pending')
      .single();

    if (existing) {
      throw new Error('An invitation is already pending for this developer');
    }

    // Check if developer is already a team member
    const { data: member } = await supabaseAdmin
      .from('team_members')
      .select('*')
      .eq('team_id', teamId)
      .eq('developer_id', developerId)
      .single();

    if (member) {
      throw new Error('Developer is already a member of this team');
    }

    const { data, error } = await supabaseAdmin
      .from('invitations')
      .insert({
        team_id: teamId,
        developer_id: developerId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to send invitation: ${error.message}`);
    }

    return data;
  }

  /**
   * Get invitations for a developer
   */
  static async getDeveloperInvitations(developerId: string): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('invitations')
      .select(`
        *,
        team:team_id (
          id,
          team_name,
          manager_id,
          profiles:manager_id (
            name
          )
        )
      `)
      .eq('developer_id', developerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch invitations: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get invitations sent by a manager's teams
   */
  static async getManagerInvitations(managerId: string): Promise<any[]> {
    // Get all team IDs for manager
    const { data: teams, error: teamsError } = await supabaseAdmin
      .from('teams')
      .select('id')
      .eq('manager_id', managerId);

    if (teamsError) {
      throw new Error(`Failed to fetch teams: ${teamsError.message}`);
    }

    if (!teams || teams.length === 0) return [];

    const teamIds = teams.map((t) => t.id);

    const { data, error } = await supabaseAdmin
      .from('invitations')
      .select(`
        *,
        developer:developer_id (
          id,
          name,
          specialization,
          skills
        ),
        team:team_id (
          id,
          team_name
        )
      `)
      .in('team_id', teamIds)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch invitations: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Respond to an invitation (accept/reject)
   */
  static async respondToInvitation(
    invitationId: string,
    developerId: string,
    status: InvitationStatus
  ): Promise<Invitation> {
    // Verify invitation belongs to developer
    const { data: invitation, error: fetchError } = await supabaseAdmin
      .from('invitations')
      .select('*')
      .eq('id', invitationId)
      .eq('developer_id', developerId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !invitation) {
      throw new Error('Invitation not found or already responded');
    }

    // Update invitation status
    const { data, error } = await supabaseAdmin
      .from('invitations')
      .update({ status })
      .eq('id', invitationId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update invitation: ${error.message}`);
    }

    // If accepted, add to team_members
    if (status === 'accepted') {
      const { error: memberError } = await supabaseAdmin
        .from('team_members')
        .insert({
          team_id: invitation.team_id,
          developer_id: developerId,
        });

      if (memberError) {
        throw new Error(`Failed to add to team: ${memberError.message}`);
      }
    }

    return data;
  }
}

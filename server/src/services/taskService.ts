import { supabaseAdmin } from '../config/supabase';
import { Task, TaskStatus } from '../types';
import { AIService } from './aiService';

export class TaskService {
  /**
   * Create a single task
   */
  static async createTask(task: {
    project_id: string;
    title: string;
    description: string;
    assigned_to?: string | null;
    required_role: string;
    priority: string;
    status?: TaskStatus;
  }): Promise<Task> {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert({
        ...task,
        status: task.status || 'todo',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`);
    }

    return data;
  }

  /**
   * Bulk insert tasks (after AI generation)
   */
  static async createBulkTasks(
    tasks: Array<{
      project_id: string;
      title: string;
      description: string;
      assigned_to?: string | null;
      required_role: string;
      priority: string;
      status?: TaskStatus;
    }>
  ): Promise<Task[]> {
    const tasksWithDefaults = tasks.map((t) => ({
      ...t,
      status: t.status || 'todo',
    }));

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert(tasksWithDefaults)
      .select();

    if (error) {
      throw new Error(`Failed to create tasks: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get tasks for a project
   */
  static async getProjectTasks(projectId: string): Promise<Task[]> {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .select(`
        *,
        assignee:assigned_to (
          id,
          name,
          specialization,
          skills
        )
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get tasks assigned to a developer
   */
  static async getDeveloperTasks(developerId: string): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .select(`
        *,
        project:project_id (
          id,
          name,
          description
        ),
        code_reviews (
          id,
          review_data,
          issues_found,
          resolved_issues,
          ai_summary,
          final_status,
          created_at
        )
      `)
      .eq('assigned_to', developerId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch developer tasks: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Update task status
   */
  static async updateTaskStatus(
    taskId: string,
    status: TaskStatus,
    userId: string
  ): Promise<Task> {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update({ status })
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update task: ${error.message}`);
    }

    return data;
  }

  /**
   * Update task assignment
   */
  static async assignTask(taskId: string, developerId: string): Promise<Task> {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update({ assigned_to: developerId })
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to assign task: ${error.message}`);
    }

    return data;
  }

  /**
   * Get developer workload (count of non-completed tasks)
   */
  static async getDeveloperWorkload(developerId: string): Promise<number> {
    const { count, error } = await supabaseAdmin
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to', developerId)
      .neq('status', 'completed');

    if (error) {
      throw new Error(`Failed to get workload: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Get all tasks for a manager's projects
   */
  static async getManagerTasks(managerId: string): Promise<any[]> {
    // Get all projects for this manager
    const { data: projects, error: projError } = await supabaseAdmin
      .from('projects')
      .select('id')
      .eq('manager_id', managerId);

    if (projError) {
      throw new Error(`Failed to fetch projects: ${projError.message}`);
    }

    if (!projects || projects.length === 0) {
      return [];
    }

    const projectIds = projects.map((p) => p.id);

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .select(`
        *,
        assignee:assigned_to (
          id,
          name,
          specialization
        ),
        project:project_id (
          id,
          name
        ),
        code_reviews (
          id,
          review_data,
          issues_found,
          resolved_issues,
          ai_summary,
          final_status,
          created_at
        )
      `)
      .in('project_id', projectIds)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get project for a task
   */
  static async getProjectForTask(taskId: string): Promise<any> {
    const { data: task } = await supabaseAdmin
      .from('tasks')
      .select('project_id')
      .eq('id', taskId)
      .single();

    if (!task) return null;

    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('*')
      .eq('id', task.project_id)
      .single();

    return project;
  }

  /**
   * Developer submits a PR
   * Automatically triggers AI review
   */
  static async submitPR(taskId: string, prLink: string, developerId: string): Promise<{ task: any; review: any }> {
    // Basic PR diff logic: fetching from github if it's a github link, else just mock
    let diffText = "Mock PR Diff: Changes implemented for " + taskId;
    let title = "Fix: PR for " + taskId;
    let body = "Developer submitted PR: " + prLink;
    
    // We try to fetch the actual diff if it's a github pull request link
    if (prLink.includes('github.com') && prLink.includes('/pull/')) {
       try {
         const diffUrl = prLink.endsWith('.diff') ? prLink : prLink + '.diff';
         const resp = await fetch(diffUrl, { headers: { Accept: 'application/vnd.github.v3.diff' } });
         if (resp.ok) diffText = await resp.text();
       } catch (e) {
         console.error('Failed to fetch actual diff, using mock', e);
       }
    }

    const reviewData = await AIService.generateCodeReview(diffText, title, body);

    // Update task
    const timelineEvent = {
        status_changed_to: 'in_review',
        note: 'PR Submitted for Review',
        created_at: new Date().toISOString()
    };
    
    // Fetch current timeline
    const { data: currentTask } = await supabaseAdmin.from('tasks').select('timeline').eq('id', taskId).single();
    const timeline = Array.isArray(currentTask?.timeline) ? currentTask!.timeline : [];
    
    let pr_number = 0;
    const match = prLink.match(/\/pull\/(\d+)/);
    if (match) pr_number = parseInt(match[1], 10);

    const { data: updatedTask, error: taskError } = await supabaseAdmin
      .from('tasks')
      .update({
        status: 'in_review',
        pr_link: prLink,
        github_pr_number: pr_number,
        review_status: 'pending',
        timeline: [...timeline, timelineEvent]
      })
      .eq('id', taskId)
      .eq('assigned_to', developerId)
      .select()
      .single();

    if (taskError) throw new Error(`Failed to submit PR: ${taskError.message}`);

    // Create review record
    const { data: review, error: reviewError } = await supabaseAdmin
      .from('code_reviews')
      .insert({
        task_id: taskId,
        pr_number: pr_number || 0,
        review_data: reviewData,
        issues_found: reviewData.bugs || [],
        final_status: 'pending'
      })
      .select()
      .single();

    if (reviewError) throw new Error(`Failed to save review: ${reviewError.message}`);

    return { task: updatedTask, review };
  }

  /**
   * Manager accepts a PR
   */
  static async acceptPR(taskId: string, managerId: string): Promise<any> {
    const timelineEvent = {
        status_changed_to: 'completed',
        note: 'PR Accepted by Manager',
        created_at: new Date().toISOString()
    };

    const { data: currentTask } = await supabaseAdmin.from('tasks').select('timeline').eq('id', taskId).single();
    const timeline = Array.isArray(currentTask?.timeline) ? currentTask!.timeline : [];

    const { data: task, error } = await supabaseAdmin
      .from('tasks')
      .update({
        status: 'completed',
        review_status: 'approved',
        completed_at: new Date().toISOString(),
        timeline: [...timeline, timelineEvent]
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw new Error(`Failed to accept PR: ${error.message}`);

    // Ensure we update latest review
    await supabaseAdmin
      .from('code_reviews')
      .update({ final_status: 'approved' })
      .eq('task_id', taskId);

    return task;
  }

  /**
   * Manager rejects a PR
   */
  static async rejectPR(taskId: string, comments: string, managerId: string): Promise<any> {
    const timelineEvent = {
        status_changed_to: 'in_progress',
        note: 'PR Rejected, Needs Fix. Comments: ' + comments,
        created_at: new Date().toISOString()
    };

    const { data: currentTask } = await supabaseAdmin.from('tasks').select('timeline, review_comments').eq('id', taskId).single();
    const timeline = Array.isArray(currentTask?.timeline) ? currentTask!.timeline : [];
    const reviewComments = Array.isArray(currentTask?.review_comments) ? currentTask!.review_comments : [];

    const { data: task, error } = await supabaseAdmin
      .from('tasks')
      .update({
        status: 'in_progress', // Move back to dev
        review_status: 'needs_fix',
        review_comments: [...reviewComments, { comments, created_at: new Date().toISOString(), manager_id: managerId }],
        timeline: [...timeline, timelineEvent]
      })
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw new Error(`Failed to reject PR: ${error.message}`);

    // Update review
    await supabaseAdmin
      .from('code_reviews')
      .update({ final_status: 'needs_fix' })
      .eq('task_id', taskId);

    return task;
  }
}

import { supabaseAdmin } from '../config/supabase';
import { Task, TaskStatus } from '../types';

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
        )
      `)
      .in('project_id', projectIds)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }

    return data || [];
  }
}

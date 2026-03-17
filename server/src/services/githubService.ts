import { supabaseAdmin } from '../config/supabase';
import { AIService } from './aiService';
import { sendToUsers, WSEvent } from '../websocket';

export class GitHubService {
  /**
   * Handle incoming GitHub webhook payload
   */
  static async handleWebhook(payload: any, eventType: string | undefined): Promise<void> {
    if (eventType === 'pull_request' && payload.action === 'opened') {
      await this.processNewPullRequest(payload.pull_request, payload.repository);
    } else if (eventType === 'pull_request' && payload.action === 'synchronize') {
      await this.processNewPullRequest(payload.pull_request, payload.repository);
    }
    // we can handle pushes and other events here
  }

  private static async processNewPullRequest(pr: any, repo: any): Promise<void> {
    const repoFullName = repo.full_name; // e.g., 'owner/repo'
    const branchName = pr.head.ref;
    const prNumber = pr.number;
    const diffUrl = pr.diff_url;

    // 1. Find a project tracking this repo
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('id, manager_id, name')
      .eq('github_repo', repoFullName)
      .single();

    if (!project) return;

    // 2. Find internal task assigned to this branch
    const { data: task } = await supabaseAdmin
      .from('tasks')
      .select('id, title, assigned_to')
      .eq('project_id', project.id)
      .eq('github_branch', branchName)
      .single();

    if (task) {
      // Update task with PR number
      await supabaseAdmin
        .from('tasks')
        .update({ github_pr_number: prNumber, status: 'in_review' })
        .eq('id', task.id);
        
      sendToUsers([project.manager_id, task.assigned_to].filter(Boolean) as string[], WSEvent.GITHUB_PR_CREATED, {
        task_id: task.id,
        pr_number: prNumber,
        branch: branchName
      });
    }

    // 3. Fetch PR diff
    const diffText = await this.fetchDiff(diffUrl);
    if (!diffText) return;

    // 4. Trigger AI Code Review
    const reviewData = await AIService.generateCodeReview(diffText, pr.title, pr.body);

    // Save review
    const { data: reviewRecord } = await supabaseAdmin
      .from('code_reviews')
      .insert({
        project_id: project.id,
        task_id: task ? task.id : null,
        pr_number: prNumber,
        review_data: reviewData
      })
      .select()
      .single();

    // Notify manager & dev
    if (reviewRecord) {
      const usersToNotify = [project.manager_id];
      if (task && task.assigned_to) usersToNotify.push(task.assigned_to);

      sendToUsers(usersToNotify, WSEvent.AI_CODE_REVIEW_COMPLETED, {
        review: reviewRecord,
        task_id: task?.id
      });
    }
  }

  private static async fetchDiff(diffUrl: string): Promise<string | null> {
    try {
      const resp = await fetch(diffUrl, {
        headers: { Accept: 'application/vnd.github.v3.diff' }
      });
      if (!resp.ok) return null;
      return await resp.text();
    } catch (e) {
      console.error('Failed to fetch PR diff', e);
      return null;
    }
  }
}

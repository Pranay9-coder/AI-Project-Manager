import { supabaseAdmin } from '../config/supabase';
import { DeveloperAnalytics } from '../types';

export class AnalyticsService {
  /**
   * Get leaderboard / performance stats for all developers
   */
  static async getDeveloperLeaderboard(): Promise<DeveloperAnalytics[]> {
    // 1. Fetch all developers
    const { data: devs, error: devError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, specialization')
      .eq('role_type', 'developer');

    if (devError || !devs) return [];

    // 2. Fetch tasks stats
    const { data: tasks, error: taskError } = await supabaseAdmin
      .from('tasks')
      .select('assigned_to, status, created_at, completed_at')
      .not('assigned_to', 'is', null);

    if (taskError) return [];

    // 3. Fetch reviews
    const { data: reviews, error: reviewError } = await supabaseAdmin
      .from('code_reviews')
      .select('task_id, review_data');

    // Mappings
    const devTaskMap = new Map<string, any[]>();
    tasks.forEach(t => {
      const devId = t.assigned_to;
      if (!devId) return;
      if (!devTaskMap.has(devId)) devTaskMap.set(devId, []);
      devTaskMap.get(devId)!.push(t);
    });

    const taskReviewMap = new Map<string, any>();
    if (!reviewError && reviews) {
      reviews.forEach(r => taskReviewMap.set(r.task_id, r.review_data));
    }

    // 4. Calculate metrics
    const results: DeveloperAnalytics[] = devs.map(dev => {
      const devTasks = devTaskMap.get(dev.id) || [];
      const completedTasks = devTasks.filter(t => t.status === 'completed');
      
      const workload = devTasks.filter(t => t.status !== 'completed').length;
      
      // avg completion time (hrs)
      let totalHrs = 0;
      let validCompletions = 0;
      completedTasks.forEach(t => {
        if (t.completed_at && t.created_at) {
          const diff = new Date(t.completed_at).getTime() - new Date(t.created_at).getTime();
          totalHrs += Math.max(0, diff / (1000 * 60 * 60));
          validCompletions++;
        }
      });
      const avg_completion_time = validCompletions > 0 ? (totalHrs / validCompletions) : 0;

      // review quality metric: baseline 100, minus points for bugs and bad practices
      let reviewQualityScore = 100;
      let reviewCount = 0;
      completedTasks.forEach(t => {
        const review = taskReviewMap.get(t.id);
        if (review) {
          reviewCount++;
          const dedux = (review.bugs?.length || 0) * 10 
                      + (review.vulnerabilities?.length || 0) * 20 
                      + (review.bad_practices?.length || 0) * 5;
          reviewQualityScore -= dedux;
        }
      });
      let review_quality = reviewCount > 0 ? Math.max(0, reviewQualityScore / reviewCount) : 100;

      // Performance Score Algo
      const speedScore = validCompletions > 0 
        ? Math.min(100, Math.max(0, 100 - (avg_completion_time / 2))) // 200 hours = 0 score
        : 50; // default for no completions
        
      const volumeScore = Math.min(100, validCompletions * 5); // 20 tasks = 100

      const performance_score = Math.floor(
        (speedScore * 0.3) + 
        (review_quality * 0.4) + 
        (volumeScore * 0.3)
      );

      return {
        developer_id: dev.id,
        name: dev.name,
        specialization: dev.specialization || 'General',
        tasks_completed: validCompletions,
        avg_completion_time: Math.round(avg_completion_time * 10) / 10,
        review_quality: Math.round(review_quality),
        workload,
        performance_score: isNaN(performance_score) ? 0 : performance_score,
      };
    });

    results.sort((a, b) => b.performance_score - a.performance_score);

    return results;
  }
}

import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { GeneratedTask } from '../types';
import { supabaseAdmin } from '../config/supabase';
import { TaskService } from './taskService';

export class AIService {
  private static genAI = new GoogleGenerativeAI(config.gemini.apiKey);

  /**
   * AI Code Review Agent
   */
  static async generateCodeReview(diff: string, title: string, body: string): Promise<any> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are an expert AI Code Reviewer. Review the following GitHub Pull Request diff.
Identify bugs, security vulnerabilities, bad coding practices, and performance issues.

PR Title: ${title}
PR Body: ${body}

Code Diff:
${diff.substring(0, 8000)} // truncate to avoid massive payload

Return ONLY a valid JSON object in this exact format:
{
  "bugs": ["description of bug 1", "..."],
  "vulnerabilities": ["security finding 1", "..."],
  "bad_practices": ["practice issue 1", "..."],
  "performance_issues": ["perf issue 1", "..."],
  "summary": "Overall summary of the review"
}`;

    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      let jsonStr = text.trim();
      if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
      if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
      if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);
      return JSON.parse(jsonStr.trim());
    } catch (e: any) {
      console.warn('⚠️ Gemini Code Review Error:', e.message);
      return {
        bugs: [],
        vulnerabilities: [],
        bad_practices: [],
        performance_issues: [],
        summary: "Code review generated a fallback response due to an AI processing error."
      };
    }
  }

  /**
   * Generate tasks from project description using Gemini
   */
  static async generateTasksFromDescription(
    projectDescription: string,
    projectName: string
  ): Promise<GeneratedTask[]> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are a project management AI assistant. Based on the following project details, generate a comprehensive list of tasks needed to complete the project.

Project Name: ${projectName}
Project Description: ${projectDescription}

Generate tasks in the following JSON format. Return ONLY a valid JSON array, no markdown, no explanation:

[
  {
    "title": "Task title",
    "description": "Detailed task description",
    "required_role": "One of: frontend, backend, fullstack, devops, designer, qa, mobile, data",
    "priority": "One of: low, medium, high, critical"
  }
]

Guidelines:
- Generate 5-15 tasks depending on project complexity
- Ensure tasks are specific and actionable
- Assign appropriate required_role based on the task nature
- Set priority based on task importance and dependencies
- Cover all aspects: planning, development, testing, deployment`;

    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Parse JSON from response (handle potential markdown wrapping)
      let jsonStr = text.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.slice(7);
      }
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.slice(3);
      }
      if (jsonStr.endsWith('```')) {
        jsonStr = jsonStr.slice(0, -3);
      }
      jsonStr = jsonStr.trim();

      const tasks: GeneratedTask[] = JSON.parse(jsonStr);

      // Validate structure
      return tasks.map((task) => ({
        title: task.title || 'Untitled Task',
        description: task.description || '',
        required_role: task.required_role || 'fullstack',
        priority: task.priority || 'medium',
      }));
    } catch (error: any) {
      if (error.message.includes('429')) {
        console.warn('⚠️ Gemini API Rate Limit Exceeded. Using fallback tasks.');
      } else {
        console.error('⚠️ Gemini API Error. Using fallback tasks.');
      }
      
      // Fallback: return basic tasks
      return [
        {
          title: `Setup project: ${projectName}`,
          description: 'Initialize the project structure and configuration',
          required_role: 'fullstack',
          priority: 'high',
        },
        {
          title: `Implement core features for ${projectName}`,
          description: projectDescription,
          required_role: 'fullstack',
          priority: 'high',
        },
        {
          title: 'Write tests',
          description: 'Create unit and integration tests',
          required_role: 'qa',
          priority: 'medium',
        },
        {
          title: 'Deploy and document',
          description: 'Set up deployment pipeline and write documentation',
          required_role: 'devops',
          priority: 'medium',
        },
      ];
    }
  }

  /**
   * Smart task assignment algorithm
   * 1. Fetch team members
   * 2. Filter by required_role (match specialization or skills)
   * 3. Assign to developer with lowest workload
   */
  static async smartAssignTasks(
    projectId: string,
    teamId: string,
    tasks: GeneratedTask[]
  ): Promise<any[]> {
    // 1. Fetch team members with profiles
    const { data: members, error } = await supabaseAdmin
      .from('team_members')
      .select(`
        developer_id,
        profiles:developer_id (
          id,
          name,
          specialization,
          skills
        )
      `)
      .eq('team_id', teamId);

    if (error || !members || members.length === 0) {
      // No team members — create tasks unassigned
      const createdTasks = await TaskService.createBulkTasks(
        tasks.map((t) => ({
          project_id: projectId,
          title: t.title,
          description: t.description,
          required_role: t.required_role,
          priority: t.priority,
          assigned_to: null,
        }))
      );
      return createdTasks;
    }

    // 2. Build workload map
    const workloadMap = new Map<string, number>();
    for (const member of members) {
      const profile = member.profiles as any;
      if (!profile) continue;
      const workload = await TaskService.getDeveloperWorkload(profile.id);
      workloadMap.set(profile.id, workload);
    }

    // 3. Assign each task
    const assignedTasks = tasks.map((task) => {
      // Filter candidates: match specialization or skills against required_role
      let candidates = members
        .map((m) => m.profiles as any)
        .filter((p) => p !== null);

      // First try: match by specialization
      let matched = candidates.filter(
        (p) =>
          p.specialization?.toLowerCase() === task.required_role.toLowerCase()
      );

      // Second try: match by skills array
      if (matched.length === 0) {
        matched = candidates.filter(
          (p) =>
            Array.isArray(p.skills) &&
            p.skills.some(
              (skill: string) =>
                skill.toLowerCase().includes(task.required_role.toLowerCase()) ||
                task.required_role.toLowerCase().includes(skill.toLowerCase())
            )
        );
      }

      // Fallback: use all candidates
      if (matched.length === 0) {
        matched = candidates;
      }

      // Pick developer with lowest workload
      let bestDev: any = null;
      let lowestWorkload = Infinity;

      for (const dev of matched) {
        const wl = workloadMap.get(dev.id) || 0;
        if (wl < lowestWorkload) {
          lowestWorkload = wl;
          bestDev = dev;
        }
      }

      const assignedTo = bestDev?.id || null;

      // Increment workload for the assigned developer
      if (assignedTo) {
        workloadMap.set(assignedTo, (workloadMap.get(assignedTo) || 0) + 1);
      }

      return {
        project_id: projectId,
        title: task.title,
        description: task.description,
        required_role: task.required_role,
        priority: task.priority,
        assigned_to: assignedTo,
      };
    });

    // Bulk insert
    const createdTasks = await TaskService.createBulkTasks(assignedTasks);
    return createdTasks;
  }

  /**
   * Predict project risk score (0-100)
   */
  static async predictProjectRisk(projectId: string): Promise<number> {
    const { data: tasks } = await supabaseAdmin
      .from('tasks')
      .select('id, status, priority, created_at')
      .eq('project_id', projectId);

    if (!tasks || tasks.length === 0) return 0;

    let riskScore = 0;
    const now = new Date().getTime();

    // Basic heuristic approach as fallback or preprocess
    tasks.forEach(task => {
      const created = new Date(task.created_at).getTime();
      const ageDays = (now - created) / (1000 * 60 * 60 * 24);

      if (task.status !== 'completed') {
        if (task.priority === 'critical') riskScore += 15;
        if (task.priority === 'high') riskScore += 10;
        
        // Age risk: if non-completed task is old
        if (ageDays > 7) riskScore += 10;
        if (ageDays > 14) riskScore += 20;
      }
    });

    const finalScore = Math.min(100, Math.floor(riskScore / Math.max(1, tasks.length / 2)));
    return finalScore;
  }
}

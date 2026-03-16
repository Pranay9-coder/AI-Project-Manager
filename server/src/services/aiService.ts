import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config';
import { GeneratedTask } from '../types';
import { supabaseAdmin } from '../config/supabase';
import { TaskService } from './taskService';

export class AIService {
  private static genAI = new GoogleGenerativeAI(config.gemini.apiKey);

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
}

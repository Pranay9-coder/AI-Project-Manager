import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { ProjectService } from '../services/projectService';
import { AIService } from '../services/aiService';
import { sendToUser, WSEvent } from '../websocket';
import { GeneratedTask } from '../types';

export class ProjectController {
  /**
   * POST /projects
   * Create project + AI-generate tasks + smart assign (manager only)
   */
  static async createProject(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { team_id, name, description } = req.body;

      if (!team_id || !name || !description) {
        res.status(400).json({
          error: 'team_id, name, and description are required',
        });
        return;
      }

      // Create project (validates team ownership + manager has team)
      const project = await ProjectService.createProject(
        req.user!.id,
        team_id,
        name,
        description
      );

      // Generate tasks using Gemini AI
      let generatedTasks: GeneratedTask[];
      try {
        generatedTasks = await AIService.generateTasksFromDescription(
          description,
          name
        );
      } catch (aiError: any) {
        console.error('AI task generation failed:', aiError.message);
        generatedTasks = [];
      }

      // Smart assign tasks to team members
      let tasks: any[] = [];
      if (generatedTasks.length > 0) {
        tasks = await AIService.smartAssignTasks(
          project.id,
          team_id,
          generatedTasks
        );

        // Notify assigned developers via WebSocket
        const assignedDevIds = [
          ...new Set(
            tasks
              .filter((t) => t.assigned_to)
              .map((t) => t.assigned_to as string)
          ),
        ];

        for (const devId of assignedDevIds) {
          const devTasks = tasks.filter((t) => t.assigned_to === devId);
          sendToUser(devId, WSEvent.NEW_TASK_ASSIGNED, {
            project: { id: project.id, name: project.name },
            tasks: devTasks,
          });
        }
      }

      res.status(201).json({
        project,
        tasks,
        tasksGenerated: tasks.length,
      });
    } catch (error: any) {
      if (error.message.includes('Team required')) {
        res.status(400).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /projects
   * Get projects for current user (role-aware)
   */
  static async getProjects(req: AuthRequest, res: Response): Promise<void> {
    try {
      let projects;
      if (req.user!.role_type === 'manager') {
        projects = await ProjectService.getManagerProjects(req.user!.id);
      } else {
        projects = await ProjectService.getDeveloperProjects(req.user!.id);
      }

      res.json({ projects });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /projects/:projectId
   * Get project details
   */
  static async getProjectById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const project = await ProjectService.getProjectById(projectId);

      if (!project) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      res.json({ project });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

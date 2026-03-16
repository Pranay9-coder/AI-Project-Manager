import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { TaskService } from '../services/taskService';
import { sendToUser, WSEvent } from '../websocket';

export class TaskController {
  /**
   * GET /tasks
   * Get tasks based on role
   */
  static async getTasks(req: AuthRequest, res: Response): Promise<void> {
    try {
      let tasks;
      if (req.user!.role_type === 'manager') {
        tasks = await TaskService.getManagerTasks(req.user!.id);
      } else {
        tasks = await TaskService.getDeveloperTasks(req.user!.id);
      }

      res.json({ tasks });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /tasks/project/:projectId
   * Get tasks for specific project
   */
  static async getProjectTasks(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const tasks = await TaskService.getProjectTasks(projectId);
      res.json({ tasks });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PATCH /tasks/:taskId/status
   * Update task status
   */
  static async updateStatus(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { taskId } = req.params;
      const { status } = req.body;

      if (!status || !['todo', 'in_progress', 'in_review', 'completed'].includes(status)) {
        res.status(400).json({
          error: 'Valid status required: todo, in_progress, in_review, completed',
        });
        return;
      }

      const task = await TaskService.updateTaskStatus(taskId, status, req.user!.id);

      // Emit TASK_STATUS_UPDATED to all relevant parties
      // Notify the assignee
      if (task.assigned_to && task.assigned_to !== req.user!.id) {
        sendToUser(task.assigned_to, WSEvent.TASK_STATUS_UPDATED, { task });
      }

      res.json({ task });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PATCH /tasks/:taskId/assign
   * Assign task to a developer
   */
  static async assignTask(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { taskId } = req.params;
      const { developer_id } = req.body;

      if (!developer_id) {
        res.status(400).json({ error: 'developer_id is required' });
        return;
      }

      const task = await TaskService.assignTask(taskId, developer_id);

      // Notify the developer
      sendToUser(developer_id, WSEvent.NEW_TASK_ASSIGNED, { task });

      res.json({ task });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

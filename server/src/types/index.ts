export type RoleType = 'manager' | 'developer';

export interface Profile {
  id: string;
  name: string;
  email?: string;
  role_type: RoleType;
  specialization: string;
  skills: string[];
  created_at?: string;
}

export interface Team {
  id: string;
  team_name: string;
  manager_id: string;
  created_at?: string;
}

export interface TeamMember {
  team_id: string;
  developer_id: string;
  joined_at?: string;
}

export interface Project {
  id: string;
  team_id: string;
  manager_id: string;
  name: string;
  description: string;
  github_repo?: string;
  created_at?: string;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'completed';

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string;
  assigned_to: string | null;
  required_role: string;
  priority: TaskPriority;
  status: TaskStatus;
  github_branch?: string;
  github_pr_number?: number;
  completed_at?: string;
  created_at?: string;
}

export interface CodeReview {
  id: string;
  task_id: string;
  pr_number: number;
  review_data: {
    bugs: string[];
    vulnerabilities: string[];
    bad_practices: string[];
    performance_issues: string[];
    summary: string;
  };
  created_at?: string;
}

export interface DeveloperAnalytics {
  developer_id: string;
  name: string;
  specialization: string;
  tasks_completed: number;
  avg_completion_time: number;
  review_quality: number;
  workload: number;
  performance_score: number;
}

export type InvitationStatus = 'pending' | 'accepted' | 'rejected';

export interface Invitation {
  id: string;
  team_id: string;
  developer_id: string;
  status: InvitationStatus;
  created_at?: string;
}

export interface GeneratedTask {
  title: string;
  description: string;
  required_role: string;
  priority: TaskPriority;
}

export interface AuthenticatedRequest extends Express.Request {
  user?: {
    id: string;
    email: string;
    role?: string;
  };
}

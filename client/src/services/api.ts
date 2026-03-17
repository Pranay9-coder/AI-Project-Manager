const API_BASE = '/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ─── Auth ─────────────────────────────────────
  async signup(data: {
    email: string;
    password: string;
    name: string;
    role_type: string;
    specialization?: string;
    skills?: string[];
  }) {
    return this.request<any>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(email: string, password: string) {
    return this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  async updateProfile(data: { name?: string; specialization?: string; skills?: string[] }) {
    return this.request<any>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // ─── Teams ────────────────────────────────────
  async createTeam(team_name: string) {
    return this.request<any>('/teams', {
      method: 'POST',
      body: JSON.stringify({ team_name }),
    });
  }

  async getTeams() {
    return this.request<any>('/teams');
  }

  async getTeamById(teamId: string) {
    return this.request<any>(`/teams/${teamId}`);
  }

  async getTeamMembers(teamId: string) {
    return this.request<any>(`/teams/${teamId}/members`);
  }

  async removeMember(teamId: string, developerId: string) {
    return this.request<any>(`/teams/${teamId}/members/${developerId}`, {
      method: 'DELETE',
    });
  }

  // ─── Projects ─────────────────────────────────
  async createProject(data: { team_id: string; name: string; description: string }) {
    return this.request<any>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProjects() {
    return this.request<any>('/projects');
  }

  async getProjectById(projectId: string) {
    return this.request<any>(`/projects/${projectId}`);
  }

  // ─── Tasks ────────────────────────────────────
  async getTasks() {
    return this.request<any>('/tasks');
  }

  async getProjectTasks(projectId: string) {
    return this.request<any>(`/tasks/project/${projectId}`);
  }

  async submitPR(taskId: string, prLink: string) {
    return this.request<any>(`/tasks/${taskId}/pr`, {
      method: 'POST',
      body: JSON.stringify({ prLink }),
    });
  }

  async acceptPR(taskId: string) {
    return this.request<any>(`/tasks/${taskId}/pr/accept`, {
      method: 'POST',
    });
  }

  async rejectPR(taskId: string, comments: string) {
    return this.request<any>(`/tasks/${taskId}/pr/reject`, {
      method: 'POST',
      body: JSON.stringify({ comments }),
    });
  }

  async updateTaskStatus(taskId: string, status: string) {
    return this.request<any>(`/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async assignTask(taskId: string, developer_id: string) {
    return this.request<any>(`/tasks/${taskId}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ developer_id }),
    });
  }

  // ─── Invitations ──────────────────────────────
  async getInvitations() {
    return this.request<any>('/invitations');
  }

  async sendInvitation(teamId: string, developerId: string) {
    return this.request<any>(`/teams/${teamId}/invite/${developerId}`, {
      method: 'POST',
    });
  }

  async acceptInvitation(invitationId: string) {
    return this.request<any>(`/invitations/${invitationId}/accept`, {
      method: 'PATCH',
    });
  }

  async rejectInvitation(invitationId: string) {
    return this.request<any>(`/invitations/${invitationId}/reject`, {
      method: 'PATCH',
    });
  }

  // ─── Developers ───────────────────────────────
  async getDevelopers(specialization?: string) {
    const query = specialization ? `?specialization=${encodeURIComponent(specialization)}` : '';
    return this.request<any>(`/developers${query}`);
  }

  async getSpecializations() {
    return this.request<any>('/developers/specializations');
  }

  async recommendDevelopers(description: string) {
    return this.request<any>('/developers/recommend', {
      method: 'POST',
      body: JSON.stringify({ description }),
    });
  }

  // ─── Analytics ────────────────────────────────
  async getLeaderboard() {
    return this.request<any>('/analytics/leaderboard');
  }
}

export const api = new ApiClient();

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { FolderKanban, Users, ListTodo, Clock, TrendingUp, CheckCircle2 } from 'lucide-react';

export function ManagerOverview() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    teams: 0,
    projects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingInvitations: 0,
  });
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [teamsRes, projectsRes, tasksRes, invitationsRes] = await Promise.all([
        api.getTeams(),
        api.getProjects(),
        api.getTasks(),
        api.getInvitations(),
      ]);

      const tasks = tasksRes.tasks || [];
      setStats({
        teams: (teamsRes.teams || []).length,
        projects: (projectsRes.projects || []).length,
        totalTasks: tasks.length,
        completedTasks: tasks.filter((t: any) => t.status === 'completed').length,
        pendingInvitations: (invitationsRes.invitations || []).filter(
          (i: any) => i.status === 'pending'
        ).length,
      });
      setRecentTasks(tasks.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: 'Teams', value: stats.teams, icon: Users, color: 'from-blue-500/20 to-blue-600/20', iconColor: 'text-blue-400' },
    { label: 'Projects', value: stats.projects, icon: FolderKanban, color: 'from-purple-500/20 to-purple-600/20', iconColor: 'text-purple-400' },
    { label: 'Total Tasks', value: stats.totalTasks, icon: ListTodo, color: 'from-amber-500/20 to-amber-600/20', iconColor: 'text-amber-400' },
    { label: 'Completed', value: stats.completedTasks, icon: CheckCircle2, color: 'from-emerald-500/20 to-emerald-600/20', iconColor: 'text-emerald-400' },
    { label: 'Pending Invites', value: stats.pendingInvitations, icon: Clock, color: 'from-rose-500/20 to-rose-600/20', iconColor: 'text-rose-400' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/15 text-emerald-400';
      case 'in_progress': return 'bg-blue-500/15 text-blue-400';
      case 'in_review': return 'bg-amber-500/15 text-amber-400';
      default: return 'bg-surface-700/50 text-surface-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500/15 text-red-400';
      case 'high': return 'bg-orange-500/15 text-orange-400';
      case 'medium': return 'bg-yellow-500/15 text-yellow-400';
      default: return 'bg-surface-700/50 text-surface-400';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-surface-50">
          Welcome back, {profile?.name} 👋
        </h1>
        <p className="text-surface-400 mt-1">Here's an overview of your workspace</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            className="glass-light rounded-2xl p-5 hover:scale-[1.02] transition-transform duration-200 animate-fade-in"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
              <card.icon className={`w-5 h-5 ${card.iconColor}`} />
            </div>
            <p className="text-2xl font-bold text-surface-50">{card.value}</p>
            <p className="text-sm text-surface-400 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Completion Rate */}
      <div className="glass-light rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-primary-400" />
          <h2 className="text-lg font-semibold text-surface-100">Task Completion Rate</h2>
        </div>
        <div className="w-full bg-surface-800 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-600 to-emerald-500 rounded-full transition-all duration-1000"
            style={{
              width: `${stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%`,
            }}
          />
        </div>
        <p className="text-sm text-surface-400 mt-2">
          {stats.totalTasks > 0
            ? `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}% complete (${stats.completedTasks}/${stats.totalTasks})`
            : 'No tasks yet'}
        </p>
      </div>

      {/* Recent Tasks */}
      <div className="glass-light rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-surface-100 mb-4">Recent Tasks</h2>
        {recentTasks.length === 0 ? (
          <p className="text-sm text-surface-500 py-4 text-center">No tasks yet. Create a project to auto-generate tasks!</p>
        ) : (
          <div className="space-y-2">
            {recentTasks.map((task: any) => (
              <div
                key={task.id}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface-800/30 hover:bg-surface-800/50 transition-colors"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-sm font-medium text-surface-200 truncate">{task.title}</p>
                  <p className="text-xs text-surface-500 mt-0.5 truncate">
                    {task.project?.name || 'Unknown project'} • {task.assignee?.name || 'Unassigned'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-lg text-[11px] font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className={`px-2 py-0.5 rounded-lg text-[11px] font-medium ${getStatusColor(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useWebSocket } from '../../hooks/useWebSocket';
import { WSEvent } from '../../services/websocket';
import { FolderKanban, Users, ListTodo, Clock, TrendingUp, CheckCircle2, AlertTriangle, Trophy, Star } from 'lucide-react';

export function ManagerOverview() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    teams: 0,
    projects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingInvitations: 0,
  });
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [riskAlerts, setRiskAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Use the properly typed hook from our hooks file
  useWebSocket(WSEvent.PROJECT_RISK_ALERT, React.useCallback((data: any) => {
    setRiskAlerts((prev) => [...prev, data]);
  }, []));

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [teamsRes, projectsRes, tasksRes, invitationsRes, analyticsRes] = await Promise.all([
        api.getTeams(),
        api.getProjects(),
        api.getTasks(),
        api.getInvitations(),
        api.getLeaderboard().catch(() => ({ leaderboard: [] })),
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
      setAllTasks(tasks);
      setAllProjects(projectsRes.projects || []);
      setLeaderboard(analyticsRes.leaderboard || []);
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
    { label: 'Teams', value: stats.teams, icon: Users, color: 'from-blue-500/20 to-blue-600/20', iconColor: 'text-blue-400', route: '/dashboard/teams' },
    { label: 'Projects', value: stats.projects, icon: FolderKanban, color: 'from-purple-500/20 to-purple-600/20', iconColor: 'text-purple-400', route: '/dashboard/projects' },
    { label: 'Total Tasks', value: stats.totalTasks, icon: ListTodo, color: 'from-amber-500/20 to-amber-600/20', iconColor: 'text-amber-400', route: '/dashboard/tasks' },
    { label: 'Completed', value: stats.completedTasks, icon: CheckCircle2, color: 'from-emerald-500/20 to-emerald-600/20', iconColor: 'text-emerald-400', route: '/dashboard/tasks' },
    { label: 'Pending Invites', value: stats.pendingInvitations, icon: Clock, color: 'from-rose-500/20 to-rose-600/20', iconColor: 'text-rose-400', route: '/dashboard/teams' },
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

      {/* Alerts */}
      {riskAlerts.length > 0 && (
        <div className="space-y-3">
          {riskAlerts.map((alert, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-danger/10 border border-danger/20 text-danger animate-fade-in">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">High Risk Detected: {alert.name}</p>
                <p className="text-xs opacity-90">Risk Score: {alert.riskScore}/100 based on delays and workload.</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, i) => (
          <div
            key={card.label}
            onClick={() => navigate(card.route)}
            className="glass-light rounded-2xl p-5 hover:scale-[1.02] transition-transform duration-200 animate-fade-in cursor-pointer"
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

      {/* Project-Wise Task Completion */}
      <div 
        className="glass-light rounded-2xl p-6" 
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-primary-400" />
            <h2 className="text-lg font-semibold text-surface-100">Project-Wise Task Completion</h2>
          </div>
          <button onClick={() => navigate('/dashboard/projects')} className="text-xs text-primary-400 hover:text-primary-300">View Projects</button>
        </div>
        
        {allProjects.length === 0 ? (
          <p className="text-sm text-surface-500 py-2">No projects yet.</p>
        ) : (
          <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
             {allProjects.map(project => {
                const projTasks = allTasks.filter(t => t.project?.id === project.id || t.project_id === project.id);
                const total = projTasks.length;
                const completed = projTasks.filter(t => t.status === 'completed').length;
                const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
                
                return (
                  <div key={project.id} className="cursor-pointer group" onClick={() => navigate('/dashboard/projects')}>
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-sm font-medium text-surface-200 group-hover:text-primary-400 transition-colors">{project.name}</span>
                      <span className="text-xs text-surface-400">{percentage}% ({completed}/{total})</span>
                    </div>
                    <div className="w-full bg-surface-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-600 to-emerald-500 rounded-full transition-all duration-1000"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
             })}
          </div>
        )}
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

      {/* Developer Leaderboard */}
      <div className="glass-light rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <h2 className="text-lg font-semibold text-surface-100">Developer Leaderboard & Analytics</h2>
        </div>
        {leaderboard.length === 0 ? (
          <p className="text-sm text-surface-500 py-4 text-center">No performance data available yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-surface-300">
              <thead className="text-xs uppercase text-surface-500 bg-surface-800/50">
                <tr>
                  <th className="px-4 py-3 font-medium rounded-l-lg">Developer</th>
                  <th className="px-4 py-3 font-medium">Specialization</th>
                  <th className="px-4 py-3 font-medium text-center">Score</th>
                  <th className="px-4 py-3 font-medium text-center">Tasks Completed</th>
                  <th className="px-4 py-3 font-medium text-center">Avg Completion</th>
                  <th className="px-4 py-3 font-medium text-center">Review Quality</th>
                  <th className="px-4 py-3 font-medium text-center rounded-r-lg">Workload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-700/50">
                {leaderboard.map((dev: any, i: number) => (
                  <tr key={dev.developer_id} className="hover:bg-surface-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium flex items-center gap-2">
                      <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-yellow-500/20 text-yellow-500' : i === 1 ? 'bg-slate-300/20 text-slate-300' : i === 2 ? 'bg-amber-700/20 text-amber-600' : 'bg-surface-700 text-surface-400'}`}>
                        {i + 1}
                      </span>
                      {dev.name}
                    </td>
                    <td className="px-4 py-3">{dev.specialization}</td>
                    <td className="px-4 py-3 text-center font-bold text-primary-400">{dev.performance_score}</td>
                    <td className="px-4 py-3 text-center">{dev.tasks_completed}</td>
                    <td className="px-4 py-3 text-center">{dev.avg_completion_time} hrs</td>
                    <td className="px-4 py-3 text-center">
                      <span className="flex items-center justify-center gap-1">
                        {dev.review_quality}%
                        {dev.review_quality > 80 && <Star className="w-3 h-3 text-yellow-500" />}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs ${dev.workload > 5 ? 'bg-danger/20 text-danger' : 'bg-surface-700 text-surface-300'}`}>
                        {dev.workload} tasks
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

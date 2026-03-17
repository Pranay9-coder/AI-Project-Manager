import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { ListTodo, FolderKanban, Mail, CheckCircle2, Clock, TrendingUp, Activity, ExternalLink, Code2 } from 'lucide-react';
import { TaskDetailModal } from '../../components/TaskDetailModal';

export function DeveloperDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    projects: 0,
    pendingInvitations: 0,
  });
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [myReviews, setMyReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [tasksRes, projectsRes, invRes] = await Promise.all([
        api.getTasks(),
        api.getProjects(),
        api.getInvitations(),
      ]);

      const tasks = tasksRes.tasks || [];
      setStats({
        totalTasks: tasks.length,
        completedTasks: tasks.filter((t: any) => t.status === 'completed').length,
        inProgressTasks: tasks.filter((t: any) => t.status === 'in_progress').length,
        projects: (projectsRes.projects || []).length,
        pendingInvitations: (invRes.invitations || []).filter((i: any) => i.status === 'pending').length,
      });
      setRecentTasks(tasks.slice(0, 5));
      
      const reviews = tasks
        .filter((t: any) => t.code_reviews && t.code_reviews.length > 0)
        .map((t: any) => {
          const latestReview = [...t.code_reviews].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
          return { task: t, review: latestReview };
        });
      setMyReviews(reviews);
      
    } catch (err) {
      console.error(err);
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
    { label: 'My Tasks', value: stats.totalTasks, icon: ListTodo, color: 'from-blue-500/20 to-blue-600/20', iconColor: 'text-blue-400' },
    { label: 'Completed', value: stats.completedTasks, icon: CheckCircle2, color: 'from-emerald-500/20 to-emerald-600/20', iconColor: 'text-emerald-400' },
    { label: 'In Progress', value: stats.inProgressTasks, icon: Clock, color: 'from-amber-500/20 to-amber-600/20', iconColor: 'text-amber-400' },
    { label: 'Projects', value: stats.projects, icon: FolderKanban, color: 'from-purple-500/20 to-purple-600/20', iconColor: 'text-purple-400' },
    { label: 'Invitations', value: stats.pendingInvitations, icon: Mail, color: 'from-rose-500/20 to-rose-600/20', iconColor: 'text-rose-400' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/15 text-emerald-400';
      case 'in_progress': return 'bg-blue-500/15 text-blue-400';
      case 'in_review': return 'bg-amber-500/15 text-amber-400';
      default: return 'bg-surface-700/50 text-surface-400';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-50">Welcome, {profile?.name} 💻</h1>
        <p className="text-surface-400 mt-1">Your development workspace overview</p>
      </div>

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

      <div className="glass-light rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-primary-400" />
          <h2 className="text-lg font-semibold text-surface-100">My Progress</h2>
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
            ? `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}% tasks completed`
            : 'No tasks assigned yet'}
        </p>
      </div>

      <div className="glass-light rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-surface-100 mb-4">Recent Tasks</h2>
        {recentTasks.length === 0 ? (
          <p className="text-sm text-surface-500 py-4 text-center">No tasks assigned yet</p>
        ) : (
          <div className="space-y-2">
            {recentTasks.map((task: any) => (
              <div key={task.id} className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface-800/30 hover:bg-surface-800/50 transition-colors">
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-sm font-medium text-surface-200 truncate">{task.title}</p>
                  <p className="text-xs text-surface-500 mt-0.5">{task.project?.name}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-medium ${getStatusColor(task.status)}`}>
                  {task.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-light rounded-2xl p-6 relative">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-surface-100 flex items-center gap-2">
            My Reviews
            {myReviews.filter((r) => r.task.status === 'in_review').length > 0 && (
              <span className="bg-primary-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                {myReviews.filter((r) => r.task.status === 'in_review').length} New
              </span>
            )}
          </h2>
        </div>
        {myReviews.length === 0 ? (
          <p className="text-sm text-surface-500 py-4 text-center">No PR reviews yet. Submit a fix to get an AI Code Review.</p>
        ) : (
          <div className="space-y-3">
            {myReviews.map(({ task, review }, idx) => (
              <div key={idx} className="bg-surface-800/30 border border-surface-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 hover:bg-surface-800/50 transition-colors">
                 <div className="flex-1">
                   <div className="flex items-center gap-2 mb-1">
                      <Code2 className="w-4 h-4 text-surface-400" />
                      <h3 className="text-sm font-semibold text-surface-200">{task.title}</h3>
                   </div>
                   <p className="text-xs text-surface-500 mb-3">{review?.review_data?.summary || 'No detailed summary available.'}</p>
                   {task.pr_link && (
                     <a href={task.pr_link} target="_blank" rel="noreferrer" className="text-xs font-medium text-primary-400 hover:text-primary-300 flex items-center gap-1">
                        View PR <ExternalLink className="w-3 h-3" />
                     </a>
                   )}
                 </div>
                 <div className="flex flex-col items-start md:items-end justify-between min-w-[120px]">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] uppercase tracking-wider font-bold mb-2 ${
                       task.review_status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' :
                       task.review_status === 'needs_fix' ? 'bg-red-500/20 text-red-400' :
                       'bg-amber-500/20 text-amber-400'
                    }`}>
                      {task.review_status ? task.review_status.replace('_', ' ') : 'Pending'}
                    </span>
                    <button 
                       onClick={() => setSelectedTask(task)} 
                       className="text-xs text-surface-400 hover:text-white transition-colors"
                    >
                       See full details &rarr;
                    </button>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedTask && (
        <TaskDetailModal 
           task={selectedTask} 
           onClose={() => setSelectedTask(null)} 
           onUpdate={() => {
              setSelectedTask(null);
              loadDashboard();
           }} 
        />
      )}
    </div>
  );
}

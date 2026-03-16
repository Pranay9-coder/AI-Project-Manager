import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { ListTodo } from 'lucide-react';

export function MyTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const res = await api.getTasks();
      setTasks(res.tasks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    setUpdating(taskId);
    try {
      await api.updateTaskStatus(taskId, newStatus);
      await loadTasks();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdating(null);
    }
  };

  const filteredTasks = tasks.filter((t) => filter === 'all' || t.status === filter);

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

  const statusOptions = ['todo', 'in_progress', 'in_review', 'completed'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-50">My Tasks</h1>
        <p className="text-surface-400 mt-1">View and update your assigned tasks</p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-surface-800/30 rounded-xl p-1 w-fit">
        {['all', ...statusOptions].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === status
                ? 'bg-primary-600/20 text-primary-400 shadow-sm'
                : 'text-surface-400 hover:text-surface-200'
            }`}
          >
            {status === 'all' ? 'All' : status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {filteredTasks.length === 0 ? (
        <div className="glass-light rounded-2xl p-12 text-center">
          <ListTodo className="w-12 h-12 text-surface-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-surface-300">No tasks</h3>
          <p className="text-sm text-surface-500 mt-1">
            {filter === 'all' ? 'No tasks assigned to you yet' : `No ${filter.replace('_', ' ')} tasks`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task: any) => (
            <div
              key={task.id}
              className="glass-light rounded-xl px-5 py-4 hover:bg-surface-800/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-4">
                  <h3 className="text-sm font-medium text-surface-200">{task.title}</h3>
                  <p className="text-xs text-surface-500 mt-1 line-clamp-1">{task.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-surface-500">
                    <span>{task.project?.name || 'Unknown project'}</span>
                    <span>•</span>
                    <span>{task.required_role}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`px-2.5 py-1 rounded-lg text-[11px] font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>

                  {/* Status dropdown */}
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                    disabled={updating === task.id}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${getStatusColor(task.status)} ${
                      updating === task.id ? 'opacity-50' : ''
                    }`}
                  >
                    {statusOptions.map((s) => (
                      <option key={s} value={s}>
                        {s.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

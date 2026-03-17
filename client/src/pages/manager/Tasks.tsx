import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { ListTodo } from 'lucide-react';
import { TaskDetailModal } from '../../components/TaskDetailModal';

export function ManagerTasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState<any | null>(null);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const statusCounts = {
    all: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    in_review: tasks.filter((t) => t.status === 'in_review').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-50">All Tasks</h1>
        <p className="text-surface-400 mt-1">View tasks across all your projects</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex items-center gap-1 bg-surface-800/30 rounded-xl p-1 w-fit">
        {(['all', 'todo', 'in_progress', 'in_review', 'completed'] as const).map((status) => (
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
            <span className="ml-1.5 text-xs opacity-60">{statusCounts[status]}</span>
          </button>
        ))}
      </div>

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <div className="glass-light rounded-2xl p-12 text-center">
          <ListTodo className="w-12 h-12 text-surface-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-surface-300">No tasks found</h3>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task: any) => (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className="glass-light rounded-xl px-5 py-4 hover:bg-surface-800/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0 mr-4">
                  <h3 className="text-sm font-medium text-surface-200">{task.title}</h3>
                  <p className="text-xs text-surface-500 mt-1 line-clamp-1">{task.description}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-surface-500">
                    <span>{task.project?.name || 'Unknown project'}</span>
                    <span>•</span>
                    <span>{task.assignee?.name || 'Unassigned'}</span>
                    <span>•</span>
                    <span>{task.required_role}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`px-2.5 py-1 rounded-lg text-[11px] font-medium ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <span className={`px-2.5 py-1 rounded-lg text-[11px] font-medium ${getStatusColor(task.status)}`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {selectedTask && (
        <TaskDetailModal 
           task={selectedTask} 
           onClose={() => setSelectedTask(null)} 
           onUpdate={() => {
              setSelectedTask(null);
              loadTasks();
           }} 
        />
      )}
    </div>
  );
}

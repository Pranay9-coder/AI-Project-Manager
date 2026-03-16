import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { FolderKanban } from 'lucide-react';

export function MyProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await api.getProjects();
      setProjects(res.projects || []);
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-50">My Projects</h1>
        <p className="text-surface-400 mt-1">Projects from your teams</p>
      </div>

      {projects.length === 0 ? (
        <div className="glass-light rounded-2xl p-12 text-center">
          <FolderKanban className="w-12 h-12 text-surface-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-surface-300">No projects</h3>
          <p className="text-sm text-surface-500 mt-1">Join a team to see projects</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project: any) => (
            <div
              key={project.id}
              className="glass-light rounded-2xl p-5 hover:scale-[1.01] transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center flex-shrink-0">
                  <FolderKanban className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-surface-100 truncate">{project.name}</h3>
                  <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">{project.description}</p>
                  <p className="text-xs text-surface-600 mt-2">
                    {new Date(project.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

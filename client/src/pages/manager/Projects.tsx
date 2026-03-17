import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { FolderKanban, Plus, Sparkles, Loader2, AlertTriangle } from 'lucide-react';

export function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    team_id: '',
    name: '',
    description: '',
    github_repo: '',
  });
  const [recommendedDevs, setRecommendedDevs] = useState<any[]>([]);
  const [recommending, setRecommending] = useState(false);
  const [creationResult, setCreationResult] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projRes, teamsRes] = await Promise.all([
        api.getProjects(),
        api.getTeams(),
      ]);
      setProjects(projRes.projects || []);
      setTeams(teamsRes.teams || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.team_id || !formData.name || !formData.description) return;
    setCreating(true);
    setCreationResult(null);

    try {
      const res = await api.createProject(formData);
      setCreationResult(res);
      setShowCreate(false);
      setFormData({ team_id: '', name: '', description: '', github_repo: '' });
      setRecommendedDevs([]);
      await loadData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleRecommend = async () => {
    if (!formData.description) return alert('Enter project description first!');
    setRecommending(true);
    try {
      const res = await api.recommendDevelopers(formData.description);
      setRecommendedDevs(res.recommended || []);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRecommending(false);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-50">Projects</h1>
          <p className="text-surface-400 mt-1">AI-powered project creation with automatic task generation</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-medium shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Project
        </button>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary-400" />
              <h2 className="text-lg font-semibold text-surface-50">Create Project</h2>
            </div>
            <p className="text-sm text-surface-400 mb-4">
              Describe your project and AI will automatically generate tasks and assign them to your team.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Team</label>
                <select
                  value={formData.team_id}
                  onChange={(e) => setFormData({ ...formData, team_id: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-800/50 border border-surface-700/50 text-surface-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                >
                  <option value="">Select team...</option>
                  {teams.map((team: any) => (
                    <option key={team.id} value={team.id}>{team.team_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Project Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-800/50 border border-surface-700/50 text-surface-100 text-sm placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                  placeholder="e.g., E-Commerce Platform"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">
                  GitHub Repository <span className="text-surface-500">(Optional: owner/repo)</span>
                </label>
                <input
                  type="text"
                  value={formData.github_repo}
                  onChange={(e) => setFormData({ ...formData, github_repo: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-800/50 border border-surface-700/50 text-surface-100 text-sm placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all mb-4"
                  placeholder="e.g., facebook/react"
                />
              </div>

              <div>

                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-surface-300">
                    Description <span className="text-surface-500">(AI uses this to generate tasks)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleRecommend}
                    disabled={recommending || !formData.description}
                    className="text-xs text-primary-400 font-medium hover:text-primary-300 flex items-center gap-1 disabled:opacity-50"
                  >
                    {recommending ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3" />}
                    Recommend Developers
                  </button>
                </div>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-800/50 border border-surface-700/50 text-surface-100 text-sm placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all resize-none mb-4"
                  placeholder="Describe the project in detail..."
                />

                {recommendedDevs.length > 0 && (
                  <div className="mb-4 bg-primary-500/10 border border-primary-500/20 rounded-xl p-3 max-h-40 overflow-y-auto">
                    <p className="text-xs font-semibold text-primary-400 mb-2">AI Recommended Developers for this project:</p>
                    <div className="space-y-1.5">
                      {recommendedDevs.map(dev => (
                        <div key={dev.developer_id} className="flex justify-between items-center text-xs">
                          <span className="text-surface-200 font-medium">{dev.name} <span className="text-surface-500">({dev.specialization})</span></span>
                          <span className="text-primary-300">Score: {dev.compositeScore}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-xl bg-surface-800 text-surface-300 text-sm font-medium hover:bg-surface-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-medium shadow-lg shadow-primary-500/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      AI Generating Tasks...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Create & Generate
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Creation result */}
      {creationResult && (
        <div className="glass-light rounded-2xl p-6 border border-emerald-500/20 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-emerald-400">
              Project created! {creationResult.tasksGenerated} tasks generated by AI
            </h3>
          </div>
          <div className="space-y-1">
            {creationResult.tasks?.slice(0, 5).map((task: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-sm text-surface-300">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                <span>{task.title}</span>
                <span className="text-surface-500">— {task.assigned_to ? 'Assigned' : 'Unassigned'}</span>
              </div>
            ))}
            {(creationResult.tasks?.length || 0) > 5 && (
              <p className="text-xs text-surface-500 pl-4">
                +{creationResult.tasks.length - 5} more tasks
              </p>
            )}
          </div>
          <button
            onClick={() => setCreationResult(null)}
            className="mt-3 text-xs text-surface-500 hover:text-surface-300 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Projects grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.length === 0 ? (
          <div className="col-span-3 glass-light rounded-2xl p-12 text-center">
            <FolderKanban className="w-12 h-12 text-surface-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-surface-300">No projects yet</h3>
            <p className="text-sm text-surface-500 mt-1">
              Create a project and let AI generate tasks automatically
            </p>
          </div>
        ) : (
          projects.map((project: any) => (
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
                  <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">
                    {project.description}
                  </p>
                  <p className="text-xs text-surface-600 mt-2 flex justify-between items-center">
                    <span>{new Date(project.created_at).toLocaleDateString()}</span>
                    {project.riskScore > 60 && (
                      <span className="text-danger flex items-center gap-1 font-medium bg-danger/10 px-2 py-0.5 rounded">
                        <AlertTriangle className="w-3 h-3" /> Risk: {project.riskScore}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

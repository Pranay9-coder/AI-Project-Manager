import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Users, Plus, ChevronRight, UserMinus, FolderKanban, CheckCircle2, Clock } from 'lucide-react';

export function TeamsPage() {
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [allTasks, setAllTasks] = useState<any[]>([]);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      const [res, projectsRes, tasksRes] = await Promise.all([
         api.getTeams(),
         api.getProjects(),
         api.getTasks(),
      ]);
      setTeams(res.teams || []);
      setAllProjects(projectsRes.projects || []);
      setAllTasks(tasksRes.tasks || []);
    } catch (err) {
      console.error('Failed to load teams/projects/tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamDetails = async (teamId: string) => {
    try {
      const res = await api.getTeamById(teamId);
      setSelectedTeam(res.team);
      setMembers(res.members || []);
    } catch (err) {
      console.error('Failed to load team:', err);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    setCreating(true);
    try {
      await api.createTeam(teamName.trim());
      setTeamName('');
      setShowCreate(false);
      await loadTeams();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleRemoveMember = async (teamId: string, devId: string) => {
    if (!confirm('Remove this member from the team?')) return;
    try {
      await api.removeMember(teamId, devId);
      await loadTeamDetails(teamId);
    } catch (err: any) {
      alert(err.message);
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
          <h1 className="text-2xl font-bold text-surface-50">Teams</h1>
          <p className="text-surface-400 mt-1">Manage your development teams</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-medium shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Team
        </button>
      </div>

      {/* Create team modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in">
            <h2 className="text-lg font-semibold text-surface-50 mb-4">Create New Team</h2>
            <form onSubmit={handleCreateTeam}>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Team name"
                className="w-full px-4 py-2.5 rounded-xl bg-surface-800/50 border border-surface-700/50 text-surface-100 text-sm placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                autoFocus
                required
              />
              <div className="flex gap-2 mt-4">
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
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-medium shadow-lg shadow-primary-500/25 disabled:opacity-50 transition-all"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {teams.length === 0 ? (
          <div className="col-span-2 glass-light rounded-2xl p-12 text-center">
            <Users className="w-12 h-12 text-surface-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-surface-300">No teams yet</h3>
            <p className="text-sm text-surface-500 mt-1">Create your first team to get started</p>
          </div>
        ) : (
          teams.map((team: any) => (
            <div
              key={team.id}
              onClick={() => loadTeamDetails(team.id)}
              className={`glass-light rounded-2xl p-5 cursor-pointer hover:scale-[1.01] transition-all duration-200 ${
                selectedTeam?.id === team.id ? 'ring-2 ring-primary-500/50' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-600/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-surface-100">{team.team_name}</h3>
                    <p className="text-xs text-surface-500">
                      Created {new Date(team.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-surface-500" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Team detail panel */}
      {selectedTeam && (
        <div className="glass-light rounded-2xl p-6 animate-fade-in">
          <h2 className="text-lg font-semibold text-surface-100 mb-4">
            {selectedTeam.team_name}
          </h2>
          
          {/* Assigned Projects */}
          <div className="mb-6">
             <h3 className="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FolderKanban className="w-4 h-4" /> Assigned Projects
             </h3>
             {allProjects.filter((p) => p.team_id === selectedTeam.id).length === 0 ? (
                <p className="text-sm text-surface-500 py-2">No projects assigned.</p>
             ) : (
                <div className="space-y-2">
                   {allProjects.filter((p) => p.team_id === selectedTeam.id).map(p => (
                      <div key={p.id} className="bg-surface-800/20 border border-surface-800 rounded-lg p-3 text-sm text-surface-200">
                         {p.name}
                      </div>
                   ))}
                </div>
             )}
          </div>

          <h3 className="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-3">Team Members & Task Distribution</h3>
          {members.length === 0 ? (
            <p className="text-sm text-surface-500 py-4 text-center">
              No members yet. Send invitations from the Developers page.
            </p>
          ) : (
            <div className="space-y-2">
              {members.map((m: any) => {
                const profile = m.profiles;
                if (!profile) return null;
                
                const myTasks = allTasks.filter(t => t.assigned_to === m.developer_id && t.project?.team_id === selectedTeam.id);
                const completedTasks = myTasks.filter(t => t.status === 'completed').length;
                const inProgressTasks = myTasks.filter(t => t.status === 'in_progress').length;
                
                return (
                  <div
                    key={m.developer_id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 rounded-xl bg-surface-800/30 hover:bg-surface-800/50 transition-colors gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 flex items-center justify-center text-emerald-400 text-xs font-bold">
                        {profile.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-surface-200">{profile.name}</p>
                        <p className="text-xs text-surface-500">{profile.specialization || 'No specialization'}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-surface-400">
                       <span className="flex items-center gap-1"><FolderKanban className="w-3.5 h-3.5" /> Total: {myTasks.length}</span>
                       <span className="flex items-center gap-1 text-blue-400"><Clock className="w-3.5 h-3.5" /> Dev: {inProgressTasks}</span>
                       <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Done: {completedTasks}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {profile.skills?.slice(0, 2).map((skill: string) => (
                        <span
                          key={skill}
                          className="px-2 py-0.5 rounded-lg bg-primary-600/15 text-primary-400 text-[11px] font-medium hidden md:inline-block"
                        >
                          {skill}
                        </span>
                      ))}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveMember(selectedTeam.id, m.developer_id);
                        }}
                        className="ml-2 p-1.5 rounded-lg text-surface-500 hover:text-danger hover:bg-danger/10 transition-all"
                        title="Remove member"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

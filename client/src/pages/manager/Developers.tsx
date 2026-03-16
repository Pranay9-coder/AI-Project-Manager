import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Code2, Send, Filter, Loader2 } from 'lucide-react';

export function DevelopersPage() {
  const [developers, setDevelopers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [selectedSpec, setSelectedSpec] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadDevelopers();
  }, [selectedSpec]);

  const loadData = async () => {
    try {
      const [specRes, teamsRes] = await Promise.all([
        api.getSpecializations(),
        api.getTeams(),
      ]);
      setSpecializations(specRes.specializations || []);
      setTeams(teamsRes.teams || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadDevelopers = async () => {
    setLoading(true);
    try {
      const res = await api.getDevelopers(selectedSpec || undefined);
      setDevelopers(res.developers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (developerId: string) => {
    if (!selectedTeam) {
      alert('Please select a team first');
      return;
    }
    setInviting(developerId);
    try {
      await api.sendInvitation(selectedTeam, developerId);
      alert('Invitation sent!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setInviting(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-surface-50">Developer Directory</h1>
        <p className="text-surface-400 mt-1">Browse and invite developers to your teams</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-surface-500" />
          <select
            value={selectedSpec}
            onChange={(e) => setSelectedSpec(e.target.value)}
            className="px-4 py-2 rounded-xl bg-surface-800/50 border border-surface-700/50 text-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
          >
            <option value="">All specializations</option>
            {specializations.map((spec) => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Send className="w-4 h-4 text-surface-500" />
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="px-4 py-2 rounded-xl bg-surface-800/50 border border-surface-700/50 text-surface-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
          >
            <option value="">Select team to invite to...</option>
            {teams.map((team: any) => (
              <option key={team.id} value={team.id}>{team.team_name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Developer list */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : developers.length === 0 ? (
        <div className="glass-light rounded-2xl p-12 text-center">
          <Code2 className="w-12 h-12 text-surface-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-surface-300">No developers found</h3>
          <p className="text-sm text-surface-500 mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {developers.map((dev: any) => (
            <div
              key={dev.id}
              className="glass-light rounded-2xl p-5 hover:scale-[1.01] transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 flex items-center justify-center text-cyan-400 text-sm font-bold">
                    {dev.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-surface-100">{dev.name}</h3>
                    <p className="text-xs text-surface-500">{dev.specialization || 'General'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-surface-800/50 text-xs">
                  <span className="text-surface-500">Workload:</span>
                  <span className={`font-medium ${
                    dev.workload > 5 ? 'text-danger' : dev.workload > 3 ? 'text-warning' : 'text-success'
                  }`}>
                    {dev.workload}
                  </span>
                </div>
              </div>

              {/* Skills */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {(dev.skills || []).map((skill: string) => (
                  <span
                    key={skill}
                    className="px-2 py-0.5 rounded-lg bg-primary-600/15 text-primary-400 text-[11px] font-medium"
                  >
                    {skill}
                  </span>
                ))}
                {(!dev.skills || dev.skills.length === 0) && (
                  <span className="text-xs text-surface-600">No skills listed</span>
                )}
              </div>

              <button
                onClick={() => handleInvite(dev.id)}
                disabled={inviting === dev.id || !selectedTeam}
                className="w-full py-2 rounded-xl bg-primary-600/15 text-primary-400 text-sm font-medium hover:bg-primary-600/25 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {inviting === dev.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                {inviting === dev.id ? 'Sending...' : 'Invite to Team'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

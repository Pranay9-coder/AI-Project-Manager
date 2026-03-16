import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Mail, CheckCircle, XCircle, Clock } from 'lucide-react';

export function InvitationsPage() {
  const { profile } = useAuth();
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      const res = await api.getInvitations();
      setInvitations(res.invitations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (id: string, action: 'accept' | 'reject') => {
    setResponding(id);
    try {
      if (action === 'accept') {
        await api.acceptInvitation(id);
      } else {
        await api.rejectInvitation(id);
      }
      await loadInvitations();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setResponding(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-amber-400" />;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-emerald-500/15 text-emerald-400';
      case 'rejected': return 'bg-red-500/15 text-red-400';
      default: return 'bg-amber-500/15 text-amber-400';
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
        <h1 className="text-2xl font-bold text-surface-50">Invitations</h1>
        <p className="text-surface-400 mt-1">
          {profile?.role_type === 'manager'
            ? 'Track sent invitations'
            : 'Manage your team invitations'}
        </p>
      </div>

      {invitations.length === 0 ? (
        <div className="glass-light rounded-2xl p-12 text-center">
          <Mail className="w-12 h-12 text-surface-600 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-surface-300">No invitations</h3>
          <p className="text-sm text-surface-500 mt-1">
            {profile?.role_type === 'manager'
              ? 'Invite developers from the Developers page'
              : 'No pending invitations'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {invitations.map((inv: any) => (
            <div
              key={inv.id}
              className="glass-light rounded-xl px-5 py-4 hover:bg-surface-800/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/20 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    {profile?.role_type === 'manager' ? (
                      <>
                        <p className="text-sm font-medium text-surface-200">
                          Invited {inv.developer?.name || 'Developer'}
                        </p>
                        <p className="text-xs text-surface-500">
                          To {inv.team?.team_name || 'Unknown team'} • {inv.developer?.specialization || ''}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-surface-200">
                          {inv.team?.team_name || 'Unknown team'}
                        </p>
                        <p className="text-xs text-surface-500">
                          From {inv.team?.profiles?.name || 'Manager'}
                        </p>
                      </>
                    )}
                    <p className="text-xs text-surface-600 mt-0.5">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {inv.status === 'pending' && profile?.role_type === 'developer' ? (
                    <>
                      <button
                        onClick={() => handleRespond(inv.id, 'accept')}
                        disabled={responding === inv.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 text-sm font-medium hover:bg-emerald-500/25 disabled:opacity-50 transition-all"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleRespond(inv.id, 'reject')}
                        disabled={responding === inv.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 text-sm font-medium hover:bg-red-500/25 disabled:opacity-50 transition-all"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </>
                  ) : (
                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusStyle(inv.status)}`}>
                      {getStatusIcon(inv.status)}
                      {inv.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

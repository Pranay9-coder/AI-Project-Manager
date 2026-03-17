import { X, ExternalLink, Activity, Clock, FileWarning, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

interface TaskDetailModalProps {
  task: any;
  onClose: () => void;
  onUpdate: () => void;
}

export function TaskDetailModal({ task, onClose, onUpdate }: TaskDetailModalProps) {
  const { profile } = useAuth();
  const isManager = profile?.role_type === 'manager';
  const isDeveloper = profile?.role_type === 'developer';
  
  const [prLinkInput, setPrLinkInput] = useState(task.pr_link || '');
  const [rejectComments, setRejectComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [managerActionAction, setManagerActionAction] = useState<'accept' | 'reject' | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/15 text-emerald-400';
      case 'in_progress': return 'bg-blue-500/15 text-blue-400';
      case 'in_review': return 'bg-amber-500/15 text-amber-400';
      default: return 'bg-surface-700/50 text-surface-400';
    }
  };

  const codeReview = task.code_reviews && task.code_reviews.length > 0 
    ? [...task.code_reviews].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    : null;

  const handleSubmitPR = async () => {
    if (!prLinkInput) return alert('Please provide a PR Link');
    setSubmitting(true);
    try {
      await api.submitPR(task.id, prLinkInput);
      onUpdate();
    } catch (err: any) {
      alert(err.message || 'Error submitting PR');
    } finally {
      setSubmitting(false);
    }
  };

  const handleManagerAction = async (action: 'accept' | 'reject') => {
    if (action === 'reject' && !rejectComments) return alert('Please enter rejection comments');
    
    setSubmitting(true);
    try {
      if (action === 'accept') {
        await api.acceptPR(task.id);
      } else {
        await api.rejectPR(task.id, rejectComments);
      }
      onUpdate();
    } catch(err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in text-left">
      <div className="bg-surface-900 border border-surface-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-surface-900/90 backdrop-blur border-b border-surface-800 p-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-surface-50">{task.title}</h2>
              <span className={`px-2.5 py-0.5 rounded-lg text-xs font-medium ${getStatusColor(task.status)}`}>
                {task.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm text-surface-400 mt-1">From Project: {task.project?.name || 'Unknown'}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-surface-800 text-surface-400 hover:text-surface-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <section>
              <h3 className="text-sm border-b border-surface-800 pb-2 font-semibold text-surface-100 mb-3 flex items-center gap-2">
                <FileWarning className="w-4 h-4 text-primary-400" /> Task Description
              </h3>
              <div className="text-sm text-surface-300 leading-relaxed bg-surface-800/20 p-4 rounded-xl border border-surface-800/50">
                {task.description || 'No description provided.'}
              </div>
            </section>

            {/* AI Review Secion */}
            {task.status === 'in_review' || task.status === 'completed' || codeReview ? (
              <section className="bg-primary-900/10 border border-primary-500/20 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-primary-200 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary-400" /> AI Code Review
                </h3>
                {codeReview ? (
                  <div className="space-y-4">
                    <p className="text-sm text-surface-200 bg-surface-900/50 p-3 rounded-lg border border-surface-800">
                      {codeReview.review_data?.summary || 'No summary available.'}
                    </p>
                    {codeReview.review_data?.bugs?.length > 0 && (
                      <div>
                         <h4 className="text-xs font-semibold text-red-400 mb-2 uppercase tracking-wider">Bugs & Issues</h4>
                         <ul className="list-disc list-inside text-sm text-surface-300 space-y-1">
                           {codeReview.review_data.bugs.map((b: string, i: number) => <li key={i}>{b}</li>)}
                         </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-surface-400 italic">Review is pending or no review data found.</p>
                )}
              </section>
            ) : null}

            {/* Developer Action: Submit Fix */}
            {isDeveloper && (task.status === 'in_progress' || task.status === 'todo') && (
              <section className="bg-surface-800/30 p-5 rounded-xl border border-surface-800">
                <h3 className="text-sm font-semibold text-surface-100 mb-3">Submit PR for Review</h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={prLinkInput}
                    onChange={e => setPrLinkInput(e.target.value)}
                    placeholder="https://github.com/owner/repo/pull/123"
                    className="flex-1 bg-surface-900 border border-surface-700 rounded-xl px-4 py-2 text-sm text-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button 
                    onClick={handleSubmitPR}
                    disabled={submitting || !prLinkInput}
                    className="bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors"
                  >
                    {submitting ? 'Submitting...' : 'Submit Fix'}
                  </button>
                </div>
              </section>
            )}

            {/* Manager Action: Accept/Reject PR */}
            {isManager && task.status === 'in_review' && (
              <section className="bg-surface-800/30 p-5 rounded-xl border border-surface-800">
                <h3 className="text-sm font-semibold text-surface-100 mb-4 flex items-center gap-2">
                   Manager Decision
                </h3>
                {managerActionAction === 'reject' ? (
                  <div className="space-y-3 animate-fade-in">
                    <textarea
                       value={rejectComments}
                       onChange={e => setRejectComments(e.target.value)}
                       placeholder="Explain what needs to be fixed..."
                       className="w-full bg-surface-900 border border-surface-700 rounded-xl p-3 text-sm text-surface-100 h-24 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setManagerActionAction(null)} className="px-4 py-2 text-sm text-surface-400 hover:text-surface-200">Cancel</button>
                      <button 
                        onClick={() => handleManagerAction('reject')}
                        disabled={submitting || !rejectComments}
                        className="bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        {submitting ? 'Rejecting...' : 'Confirm Reject'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleManagerAction('accept')} 
                      disabled={submitting}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                       <CheckCircle className="w-4 h-4" /> Accept PR
                    </button>
                    <button
                      onClick={() => setManagerActionAction('reject')}
                      disabled={submitting}
                      className="flex-1 bg-surface-700 hover:bg-surface-600 text-red-400 hover:text-red-300 py-2.5 rounded-xl text-sm font-medium transition-colors"
                    >
                       Reject / Request Changes
                    </button>
                  </div>
                )}
              </section>
            )}
          </div>

          <div className="space-y-6">
            {/* Sidebar Details */}
            <div className="bg-surface-800/20 p-5 rounded-xl border border-surface-800 space-y-4">
               <div>
                  <p className="text-xs text-surface-500 uppercase tracking-wider mb-1">Status</p>
                  <p className="text-sm font-medium text-surface-200 capitalize">{task.status.replace('_', ' ')}</p>
               </div>
               <div>
                  <p className="text-xs text-surface-500 uppercase tracking-wider mb-1">Priority</p>
                  <p className="text-sm font-medium text-surface-200 capitalize">{task.priority}</p>
               </div>
               {task.pr_link && (
                 <div>
                    <p className="text-xs text-surface-500 uppercase tracking-wider mb-1">PR Link</p>
                    <a href={task.pr_link} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary-400 hover:text-primary-300 flex items-center gap-1 transition-colors">
                      View Pull Request <ExternalLink className="w-3 h-3" />
                    </a>
                 </div>
               )}
            </div>

            {/* Timeline */}
            <div className="bg-surface-800/20 p-5 rounded-xl border border-surface-800">
              <h3 className="text-sm font-semibold text-surface-100 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary-400" /> Activity Timeline
              </h3>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-surface-700 before:to-transparent">
                 <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    <div className="flex items-center justify-center w-4 h-4 rounded-full bg-primary-500 border-4 border-surface-900 z-10 text-white shrink-0 ml-0 md:ml-[-8px]"></div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1rem)] p-3 rounded-lg border border-surface-800 bg-surface-800/50 shadow">
                        <p className="text-xs font-semibold text-surface-200">Task Created</p>
                        <time className="text-[10px] text-surface-500">{new Date(task.created_at).toLocaleString()}</time>
                    </div>
                </div>
                {task.timeline?.map((evt: any, i: number) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    <div className="flex items-center justify-center w-4 h-4 rounded-full bg-primary-500 border-4 border-surface-900 z-10 text-white shrink-0 ml-0 md:ml-[-8px]"></div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1rem)] p-3 rounded-lg border border-surface-800 bg-surface-800/50 shadow">
                        <p className="text-xs font-medium text-surface-200">{evt.note || evt.status_changed_to}</p>
                        <time className="text-[10px] text-surface-500">{new Date(evt.created_at).toLocaleString()}</time>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

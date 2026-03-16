import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Save, Plus, X, Loader2 } from 'lucide-react';

export function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    specialization: profile?.specialization || '',
    skills: profile?.skills || [],
  });
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const addSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, skillInput.trim()],
      }));
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      await api.updateProfile(formData);
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-surface-50">Profile</h1>
        <p className="text-surface-400 mt-1">Manage your profile information</p>
      </div>

      <div className="glass-light rounded-2xl p-8">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-surface-800/50">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500/30 to-primary-700/30 flex items-center justify-center text-primary-400 text-2xl font-bold">
            {profile?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-surface-100">{profile?.name}</h2>
            <p className="text-sm text-surface-500">{profile?.email}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-lg bg-primary-600/15 text-primary-400 text-xs font-medium capitalize">
              {profile?.role_type}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-800/50 border border-surface-700/50 text-surface-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Specialization</label>
            <input
              type="text"
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-800/50 border border-surface-700/50 text-surface-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
              placeholder="e.g., frontend, backend, fullstack"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Skills</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                className="flex-1 px-4 py-2.5 rounded-xl bg-surface-800/50 border border-surface-700/50 text-surface-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all"
                placeholder="Add a skill"
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-3 py-2.5 rounded-xl bg-primary-600/20 text-primary-400 hover:bg-primary-600/30 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {formData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-600/15 text-primary-400 text-xs font-medium"
                  >
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-medium shadow-lg shadow-primary-500/25 disabled:opacity-50 transition-all"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { User, Mail, FileText, CheckCircle2, AlertCircle, Loader2, Save } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSuccess('');
    setError('');

    try {
      setLoading(true);
      await updateProfile({ name, bio, avatar });
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 text-dark-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Profile & Account Settings</h1>
          <p className="text-sm text-dark-300">Manage your public presence and developer profile</p>
        </div>

        <div className="glass-panel rounded-2xl p-8 border border-dark-700">
          {success && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-3 text-emerald-400 text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-3 text-rose-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleUpdate} className="space-y-6">
            <div className="flex items-center space-x-6 pb-6 border-b border-dark-700">
              <img
                src={avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${name || 'User'}`}
                alt="Profile Avatar"
                className="w-20 h-20 rounded-2xl bg-dark-800 border-2 border-brand-500/40 p-1 shadow-lg"
              />
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-white">{name || 'Developer'}</h3>
                <p className="text-xs text-dark-400">{user?.email}</p>
                <button
                  type="button"
                  onClick={() =>
                    setAvatar(
                      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(
                        Math.random().toString()
                      )}`
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-750 text-xs font-medium text-brand-400 border border-dark-600 transition-colors"
                >
                  Generate New Avatar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-dark-300 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-dark-600 rounded-xl text-white focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-dark-300 mb-2">
                  Email (Immutable)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full pl-10 pr-4 py-2.5 bg-dark-850 border border-dark-700 rounded-xl text-dark-400 cursor-not-allowed text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-dark-300 mb-2">
                  Developer Bio
                </label>
                <div className="relative">
                  <textarea
                    rows="3"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Full Stack Engineer passionate about distributed systems and real-time collaboration..."
                    className="w-full p-3.5 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-medium rounded-xl shadow-lg shadow-brand-600/30 transition-all flex items-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

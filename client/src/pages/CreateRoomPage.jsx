import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import {
  Code2,
  Sparkles,
  Lock,
  Globe,
  Loader2,
  ArrowRight,
  AlertCircle,
  FileCode,
} from 'lucide-react';

const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', ext: '.js', color: '#f7df1e', desc: 'Node.js runtime environment' },
  { id: 'typescript', name: 'TypeScript', ext: '.ts', color: '#3178c6', desc: 'Static typed JavaScript' },
  { id: 'python', name: 'Python', ext: '.py', color: '#3776ab', desc: 'Python 3.8+ runtime' },
  { id: 'cpp', name: 'C++', ext: '.cpp', color: '#00599c', desc: 'GCC 9.2+ with STL' },
  { id: 'c', name: 'C', ext: '.c', color: '#a8b9cc', desc: 'Standard GCC C compiler' },
  { id: 'java', name: 'Java', ext: '.java', color: '#ea2d2e', desc: 'OpenJDK 13.0 environment' },
  { id: 'go', name: 'Go', ext: '.go', color: '#00add8', desc: 'Go 1.13+ runtime' },
];

export default function CreateRoomPage() {
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide a name for your coding room');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/rooms', {
        name: name.trim(),
        language,
        isPublic,
      });

      if (res.data.success && res.data.room?.roomId) {
        navigate(`/room/${res.data.room.roomId}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 text-dark-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-10">
        <div className="mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-600/10 border border-brand-500/30 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instant Workspace Creation</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Create a Coding Room</h1>
          <p className="text-sm text-dark-300 mt-1">
            Configure your environment and start collaborating in real time with your team
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-3 text-rose-400 text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-8">
          {/* Room Name */}
          <div className="glass-panel p-6 rounded-2xl border border-dark-700 space-y-4">
            <label className="block text-sm font-semibold text-white">
              Room Title / Description
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., LeetCode 75 Practice, Mock Tech Interview, Pair Programming"
              className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm transition-all"
            />
          </div>

          {/* Language Selection */}
          <div className="glass-panel p-6 rounded-2xl border border-dark-700 space-y-4">
            <label className="block text-sm font-semibold text-white">
              Primary Language & Environment
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {LANGUAGES.map((lang) => (
                <button
                  type="button"
                  key={lang.id}
                  onClick={() => setLanguage(lang.id)}
                  className={`p-4 rounded-xl border text-left transition-all relative ${
                    language === lang.id
                      ? 'bg-brand-600/15 border-brand-500 ring-1 ring-brand-500/50 shadow-md shadow-brand-500/10'
                      : 'bg-dark-800 border-dark-600 hover:border-dark-500 hover:bg-dark-750'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white text-sm">{lang.name}</span>
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-dark-900 text-dark-300 border border-dark-700">
                      {lang.ext}
                    </span>
                  </div>
                  <p className="text-xs text-dark-400">{lang.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Privacy & Access */}
          <div className="glass-panel p-6 rounded-2xl border border-dark-700 space-y-4">
            <label className="block text-sm font-semibold text-white">
              Access Permissions
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={`p-4 rounded-xl border flex items-start space-x-3 text-left transition-all ${
                  isPublic
                    ? 'bg-brand-600/15 border-brand-500 ring-1 ring-brand-500/50'
                    : 'bg-dark-800 border-dark-600 hover:bg-dark-750'
                }`}
              >
                <Globe className={`w-5 h-5 mt-0.5 ${isPublic ? 'text-brand-400' : 'text-dark-400'}`} />
                <div>
                  <h4 className="text-sm font-semibold text-white">Public Room</h4>
                  <p className="text-xs text-dark-400 mt-0.5">
                    Anyone with the Room ID can join and collaborate immediately
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={`p-4 rounded-xl border flex items-start space-x-3 text-left transition-all ${
                  !isPublic
                    ? 'bg-brand-600/15 border-brand-500 ring-1 ring-brand-500/50'
                    : 'bg-dark-800 border-dark-600 hover:bg-dark-750'
                }`}
              >
                <Lock className={`w-5 h-5 mt-0.5 ${!isPublic ? 'text-brand-400' : 'text-dark-400'}`} />
                <div>
                  <h4 className="text-sm font-semibold text-white">Restricted Room</h4>
                  <p className="text-xs text-dark-400 mt-0.5">
                    Only invited participants can view and edit the code
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-5 py-2.5 rounded-xl border border-dark-600 text-sm font-medium text-dark-300 hover:text-white hover:bg-dark-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-medium rounded-xl shadow-lg shadow-brand-600/30 transition-all flex items-center space-x-2 disabled:opacity-50 hover:scale-105 active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Launching Workspace...</span>
                </>
              ) : (
                <>
                  <span>Create & Launch Room</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

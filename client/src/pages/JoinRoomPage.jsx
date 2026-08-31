import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { LogIn, ArrowRight, AlertCircle, Loader2, KeyRound } from 'lucide-react';

export default function JoinRoomPage() {
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleFormatChange = (e) => {
    let val = e.target.value.toUpperCase().replace(/\s/g, '');
    setRoomId(val);
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError('');

    const formattedId = roomId.trim().toUpperCase();
    if (!formattedId) {
      setError('Please enter a Room ID');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post(`/rooms/${formattedId}/join`);

      if (res.data.success) {
        navigate(`/room/${formattedId}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join room. Verify the Room ID.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 text-dark-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-lg mx-auto w-full px-6 py-16 flex flex-col justify-center">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center text-brand-cyan mx-auto mb-4 shadow-lg shadow-brand-cyan/10">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Join Existing Coding Room</h1>
          <p className="text-sm text-dark-300 mt-1">
            Enter the unique 6-character room identifier provided by your peer
          </p>
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-dark-700 shadow-2xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center space-x-3 text-rose-400 text-sm animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-dark-300 mb-2">
                Room Identifier (e.g. CS-8F3K29)
              </label>
              <input
                type="text"
                required
                value={roomId}
                onChange={handleFormatChange}
                placeholder="CS-XXXXXX"
                className="w-full px-4 py-3 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan font-mono text-center text-lg tracking-widest uppercase transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !roomId.trim()}
              className="w-full py-3 bg-gradient-to-r from-brand-600 to-brand-cyan hover:from-brand-500 hover:to-brand-cyan/80 text-white font-medium rounded-xl shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting to Room...</span>
                </>
              ) : (
                <>
                  <span>Join Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

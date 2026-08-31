import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ShortcutsModal from '../components/modals/ShortcutsModal';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  PlusCircle,
  LogIn,
  Code2,
  Users,
  Clock,
  Copy,
  Check,
  Trash2,
  Loader2,
  ArrowRight,
  Search,
  SlidersHorizontal,
  Layers,
  Sparkles,
  Keyboard,
  ExternalLink,
  Activity,
} from 'lucide-react';

const LANGUAGE_COLORS = {
  javascript: { bg: '#f7df1e20', text: '#f7df1e', border: '#f7df1e40' },
  typescript: { bg: '#3178c620', text: '#3178c6', border: '#3178c640' },
  python: { bg: '#3776ab20', text: '#3776ab', border: '#3776ab40' },
  cpp: { bg: '#00599c20', text: '#00599c', border: '#00599c40' },
  c: { bg: '#a8b9cc20', text: '#a8b9cc', border: '#a8b9cc40' },
  java: { bg: '#ea2d2e20', text: '#ea2d2e', border: '#ea2d2e40' },
  go: { bg: '#00add820', text: '#00add8', border: '#00add840' },
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [copiedId, setCopiedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const navigate = useNavigate();

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const res = await api.get('/rooms');
      if (res.data.success) {
        setRooms(res.data.rooms);
      }
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleCopy = (roomId) => {
    navigator.clipboard.writeText(roomId);
    setCopiedId(roomId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (roomId, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to permanently delete room ${roomId}?`)) {
      return;
    }

    try {
      setDeletingId(roomId);
      const res = await api.delete(`/rooms/${roomId}`);
      if (res.data.success) {
        setRooms(rooms.filter((r) => r.roomId !== roomId));
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete room');
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered Rooms
  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchesSearch =
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.roomId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLang =
        selectedLanguage === 'all' || room.language === selectedLanguage;
      return matchesSearch && matchesLang;
    });
  }, [rooms, searchQuery, selectedLanguage]);

  // Statistics
  const ownedRoomsCount = rooms.filter(
    (r) => r.owner?._id === user?.id || r.owner === user?.id
  ).length;

  const totalCollaborators = rooms.reduce(
    (acc, r) => acc + (r.participants?.length || 1),
    0
  );

  return (
    <div className="min-h-screen bg-dark-900 text-dark-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-dark-700">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-600/10 border border-brand-500/30 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Developer Workspace</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="text-brand-400">{user?.name}</span>
            </h1>
            <p className="text-sm text-dark-300 mt-1">
              Manage your real-time sessions, invite teammates, and resume coding
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setIsShortcutsOpen(true)}
              className="p-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 border border-dark-600 text-dark-300 hover:text-white transition-colors"
              title="Keyboard Shortcuts"
            >
              <Keyboard className="w-4 h-4" />
            </button>
            <Link
              to="/join-room"
              className="px-4 py-2.5 rounded-xl bg-dark-800 hover:bg-dark-750 border border-dark-600 text-sm font-medium text-dark-200 hover:text-white flex items-center space-x-2 transition-all"
            >
              <LogIn className="w-4 h-4 text-brand-cyan" />
              <span>Join Room</span>
            </Link>
            <Link
              to="/create-room"
              className="px-5 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-sm font-medium rounded-xl shadow-lg shadow-brand-600/30 transition-all flex items-center space-x-2 hover:scale-105"
            >
              <PlusCircle className="w-4 h-4" />
              <span>New Room</span>
            </Link>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="glass-panel p-5 rounded-2xl border border-dark-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-dark-400 uppercase tracking-wider">Total Rooms</span>
              <Layers className="w-4 h-4 text-brand-400" />
            </div>
            <p className="text-2xl font-bold text-white font-mono">{rooms.length}</p>
            <p className="text-[11px] text-dark-400 mt-1">{ownedRoomsCount} owned by you</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-dark-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-dark-400 uppercase tracking-wider">Collaborations</span>
              <Users className="w-4 h-4 text-brand-cyan" />
            </div>
            <p className="text-2xl font-bold text-white font-mono">{totalCollaborators}</p>
            <p className="text-[11px] text-dark-400 mt-1">Active participant connections</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-dark-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-dark-400 uppercase tracking-wider">Supported Runtimes</span>
              <Code2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-white font-mono">7</p>
            <p className="text-[11px] text-dark-400 mt-1">JS, TS, Py, C++, C, Java, Go</p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-dark-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-dark-400 uppercase tracking-wider">Execution Sandbox</span>
              <Activity className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-white font-mono">Judge0 Engine</p>
            <p className="text-[11px] text-dark-400 mt-1">Zero latency cloud runtime</p>
          </div>
        </div>

        {/* Search and Filters Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-dark-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by room name or ID..."
              className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-dark-600 rounded-xl text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 text-xs transition-all"
            />
          </div>

          {/* Language Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
            {['all', 'javascript', 'typescript', 'python', 'cpp', 'java', 'go'].map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all shrink-0 ${
                  selectedLanguage === lang
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-dark-800 text-dark-400 hover:text-white border border-dark-700'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Room Grid */}
        <div>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
              <p className="text-sm font-mono text-dark-400">Loading your workspaces...</p>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center border border-dashed border-dark-700 max-w-lg mx-auto space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-600/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mx-auto">
                <Code2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                {searchQuery || selectedLanguage !== 'all'
                  ? 'No matching rooms found'
                  : 'No active rooms yet'}
              </h3>
              <p className="text-sm text-dark-300">
                {searchQuery || selectedLanguage !== 'all'
                  ? 'Try adjusting your search query or language filter.'
                  : 'Get started by creating your first collaborative coding workspace.'}
              </p>
              <div className="pt-2">
                <Link
                  to="/create-room"
                  className="inline-flex items-center space-x-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-medium shadow-md shadow-brand-600/30 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create New Room</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRooms.map((room) => {
                const isOwner = room.owner?._id === user?.id || room.owner === user?.id;
                const langColor = LANGUAGE_COLORS[room.language] || {
                  bg: '#6366f120',
                  text: '#6366f1',
                  border: '#6366f140',
                };

                return (
                  <div
                    key={room._id}
                    onClick={() => navigate(`/room/${room.roomId}`)}
                    className="glass-panel glass-panel-hover rounded-2xl p-6 border border-dark-700 cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-brand-cyan bg-brand-cyan/10 border border-brand-cyan/20 px-2 py-0.5 rounded-lg">
                            {room.roomId}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(room.roomId);
                            }}
                            className="p-1 rounded-md text-dark-400 hover:text-white hover:bg-dark-700 transition-colors"
                            title="Copy Room ID"
                          >
                            {copiedId === room.roomId ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        <span
                          className="text-xs font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-md border"
                          style={{
                            backgroundColor: langColor.bg,
                            color: langColor.text,
                            borderColor: langColor.border,
                          }}
                        >
                          {room.language}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors mb-2 line-clamp-1">
                        {room.name}
                      </h3>

                      {/* Metadata */}
                      <div className="flex items-center space-x-4 text-xs text-dark-400 mb-4">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{new Date(room.updatedAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>{room.participants?.length || 1} members</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-4 border-t border-dark-750 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <img
                          src={
                            room.owner?.avatar ||
                            `https://api.dicebear.com/7.x/bottts/svg?seed=${room.owner?.name || 'Owner'}`
                          }
                          alt="Owner"
                          className="w-6 h-6 rounded-md bg-dark-800 border border-dark-600"
                        />
                        <span className="text-xs text-dark-300">
                          {isOwner ? 'You (Owner)' : room.owner?.name}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {isOwner && (
                          <button
                            type="button"
                            disabled={deletingId === room.roomId}
                            onClick={(e) => handleDelete(room.roomId, e)}
                            className="p-1.5 rounded-lg text-dark-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete Room"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <span className="text-xs font-semibold text-brand-400 group-hover:translate-x-0.5 transition-transform flex items-center">
                          Open <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Keyboard Shortcuts Cheatsheet Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}

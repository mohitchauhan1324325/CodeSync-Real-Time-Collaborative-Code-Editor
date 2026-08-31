import React, { useState, useEffect } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import api from '../../services/api';
import {
  GitBranch,
  History,
  RotateCcw,
  Clock,
  User,
  Calendar,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileCode,
} from 'lucide-react';

export default function VersionHistoryModal({
  isOpen,
  onClose,
  roomId,
  currentCode,
  currentLanguage,
  onRestoreSuccess,
}) {
  const [versions, setVersions] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !roomId) return;

    const fetchVersions = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/rooms/${roomId}/versions`);
        if (res.data.success) {
          setVersions(res.data.versions);
          if (res.data.versions.length > 0) {
            setSelectedVersion(res.data.versions[0]);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch version history');
      } finally {
        setLoading(false);
      }
    };

    fetchVersions();
  }, [isOpen, roomId]);

  if (!isOpen) return null;

  const handleRestore = async () => {
    if (!selectedVersion) return;
    if (
      !window.confirm(
        `Are you sure you want to restore code from milestone '${selectedVersion.title}'? Current edits will be replaced.`
      )
    ) {
      return;
    }

    try {
      setRestoring(true);
      const res = await api.post(
        `/rooms/${roomId}/versions/${selectedVersion._id}/restore`
      );

      if (res.data.success) {
        if (onRestoreSuccess) {
          onRestoreSuccess(res.data.code, res.data.language, selectedVersion.title);
        }
        onClose();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to restore version');
    } finally {
      setRestoring(false);
    }
  };

  const getMonacoLanguage = (lang) => {
    switch (lang) {
      case 'javascript':
        return 'javascript';
      case 'typescript':
        return 'typescript';
      case 'python':
        return 'python';
      case 'cpp':
        return 'cpp';
      case 'c':
        return 'c';
      case 'java':
        return 'java';
      case 'go':
        return 'go';
      default:
        return 'javascript';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
      <div className="w-full max-w-6xl h-[85vh] glass-panel rounded-2xl border border-dark-600 shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="h-14 px-6 border-b border-dark-700 bg-dark-850 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base tracking-tight">
                Version History & Visual Diffs
              </h2>
              <p className="text-xs text-dark-400">Room: {roomId}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {selectedVersion && (
              <button
                type="button"
                onClick={handleRestore}
                disabled={restoring}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-xs font-semibold shadow-md shadow-brand-600/20 transition-all flex items-center space-x-1.5 disabled:opacity-50 hover:scale-105"
              >
                {restoring ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Restoring...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore This Version</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-dark-400 hover:text-white hover:bg-dark-750 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Split */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Version Timeline */}
          <div className="w-80 border-r border-dark-700 bg-dark-900 flex flex-col shrink-0">
            <div className="p-3 border-b border-dark-700 text-xs font-semibold text-dark-400 uppercase tracking-wider flex items-center justify-between">
              <span>Saved Snapshots</span>
              <span className="font-mono">{versions.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-2 text-dark-400">
                  <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                  <p className="text-xs font-mono">Loading history...</p>
                </div>
              ) : versions.length === 0 ? (
                <div className="py-12 text-center text-dark-400 text-xs px-4">
                  No previous versions recorded yet. Save code snapshots to track milestones.
                </div>
              ) : (
                versions.map((ver, idx) => {
                  const isSelected = selectedVersion?._id === ver._id;
                  return (
                    <button
                      key={ver._id}
                      onClick={() => setSelectedVersion(ver)}
                      className={`w-full p-3 rounded-xl border text-left transition-all relative ${
                        isSelected
                          ? 'bg-brand-600/15 border-brand-500 ring-1 ring-brand-500/40 shadow-sm'
                          : 'bg-dark-850/60 border-dark-700 hover:border-dark-600 hover:bg-dark-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-xs text-white truncate max-w-[170px]">
                          {ver.title || `Snapshot #${versions.length - idx}`}
                        </span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-dark-800 text-dark-300 border border-dark-700">
                          {ver.language}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-[11px] text-dark-400 mt-2">
                        <img
                          src={
                            ver.savedBy?.avatar ||
                            `https://api.dicebear.com/7.x/bottts/svg?seed=${ver.savedBy?.name || 'User'}`
                          }
                          alt={ver.savedBy?.name}
                          className="w-4 h-4 rounded-md bg-dark-700"
                        />
                        <span className="truncate">{ver.savedBy?.name || 'Collaborator'}</span>
                        <span>•</span>
                        <span className="truncate">{new Date(ver.createdAt).toLocaleTimeString()}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Monaco Diff Editor */}
          <div className="flex-1 flex flex-col bg-dark-900 overflow-hidden">
            {/* Diff Header Bar */}
            <div className="h-9 px-4 border-b border-dark-700 bg-dark-850 flex items-center justify-between text-xs font-mono text-dark-400 shrink-0">
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1.5 text-rose-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Snapshot Code (Left)</span>
                </span>
                <span>vs</span>
                <span className="flex items-center space-x-1.5 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Current Active Code (Right)</span>
                </span>
              </div>

              {selectedVersion && (
                <span>
                  {new Date(selectedVersion.createdAt).toLocaleString()}
                </span>
              )}
            </div>

            {/* Diff Editor Container */}
            <div className="flex-1 relative overflow-hidden">
              {selectedVersion ? (
                <DiffEditor
                  height="100%"
                  language={getMonacoLanguage(selectedVersion.language || currentLanguage)}
                  original={selectedVersion.code || ''}
                  modified={currentCode || ''}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    fontSize: 13,
                    fontFamily: "'Fira Code', 'JetBrains Mono', 'Menlo', Consolas, monospace",
                    fontLigatures: true,
                    renderSideBySide: true,
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    minimap: { enabled: false },
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-dark-500 text-sm">
                  Select a version on the left to inspect differences
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

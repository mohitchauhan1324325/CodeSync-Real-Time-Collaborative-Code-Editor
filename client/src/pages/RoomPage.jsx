import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import CodeEditor from '../components/editor/CodeEditor';
import EditorToolbar from '../components/editor/EditorToolbar';
import PresenceSidebar from '../components/presence/PresenceSidebar';
import ExecutionPanel from '../components/execution/ExecutionPanel';
import VersionHistoryModal from '../components/history/VersionHistoryModal';
import { useAuth } from '../context/AuthContext';
import { useRoomSocket } from '../hooks/useRoomSocket';
import api from '../services/api';
import {
  Copy,
  Check,
  Play,
  Save,
  Users,
  LogOut,
  Loader2,
  AlertCircle,
  Clock,
  Circle,
  FileCode,
  Wifi,
  WifiOff,
  Sparkles,
  History,
} from 'lucide-react';

export default function RoomPage() {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isPresenceOpen, setIsPresenceOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Saving State
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'unsaved'
  const [autoSave, setAutoSave] = useState(true);
  const [lastSavedTime, setLastSavedTime] = useState(null);

  // Execution State
  const [stdin, setStdin] = useState('');
  const [executionResult, setExecutionResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  // Editor Preferences State
  const [fontSize, setFontSize] = useState(14);
  const [minimap, setMinimap] = useState(false);
  const [wordWrap, setWordWrap] = useState(false);
  const [isCopiedCode, setIsCopiedCode] = useState(false);

  const editorInstanceRef = useRef(null);
  const autoSaveTimerRef = useRef(null);
  const currentCodeRef = useRef(code);
  const currentLangRef = useRef(language);

  currentCodeRef.current = code;
  currentLangRef.current = language;

  // Fetch Initial Room Metadata
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/rooms/${roomId}`);
        if (res.data.success) {
          setRoom(res.data.room);
          setCode(res.data.room.code || '');
          setLanguage(res.data.room.language || 'javascript');
          setLastSavedTime(new Date(res.data.room.updatedAt).toLocaleTimeString());
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load room details');
      } finally {
        setLoading(false);
      }
    };

    fetchRoom();
  }, [roomId]);

  // Real-Time Socket Handlers
  const handleRemoteCodeChange = useCallback((newRemoteCode) => {
    setCode(newRemoteCode);
    setSaveStatus('unsaved');
  }, []);

  const handleRemoteLanguageChange = useCallback((newRemoteLang) => {
    setLanguage(newRemoteLang);
  }, []);

  const {
    socket,
    activeUsers,
    currentUser,
    isConnected,
    remoteCursors,
    typingUsers,
    saveAlert,
    emitCodeChange,
    emitLanguageChange,
    emitCursorChange,
    emitCodeSaved,
  } = useRoomSocket({
    roomId,
    user,
    onRemoteCodeChange: handleRemoteCodeChange,
    onRemoteLanguageChange: handleRemoteLanguageChange,
  });

  // Save Code Function
  const handleSaveCode = async (createVersion = true, title = null) => {
    try {
      setIsSaving(true);
      setSaveStatus('saving');

      const res = await api.post(`/rooms/${roomId}/save`, {
        code: currentCodeRef.current,
        language: currentLangRef.current,
        createVersion,
        title: title || `Manual Save - ${new Date().toLocaleTimeString()}`,
      });

      if (res.data.success) {
        setSaveStatus('saved');
        const saveTime = new Date().toLocaleTimeString();
        setLastSavedTime(saveTime);
        emitCodeSaved(title || `Saved at ${saveTime}`, user?.name);
      }
    } catch (err) {
      console.error('Save failed:', err);
      setSaveStatus('unsaved');
    } finally {
      setIsSaving(false);
    }
  };

  // Run Code in Sandboxed Environment
  const handleRunCode = async () => {
    try {
      setIsRunning(true);
      setIsTerminalOpen(true);

      const res = await api.post(`/rooms/${roomId}/execute`, {
        code: currentCodeRef.current,
        language: currentLangRef.current,
        stdin,
      });

      if (res.data.success) {
        setExecutionResult(res.data.data);
      }
    } catch (err) {
      setExecutionResult({
        stdout: '',
        stderr: err.response?.data?.message || 'Execution error encountered',
        status: 'Error',
        executionTime: 0,
        memoryUsage: 0,
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Debounced Auto-Save Trigger
  const triggerAutoSave = useCallback(() => {
    if (!autoSave) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    setSaveStatus('unsaved');

    autoSaveTimerRef.current = setTimeout(() => {
      handleSaveCode(false);
    }, 3000);
  }, [autoSave, roomId]);

  // Keyboard Shortcuts: Ctrl+S (Save), Ctrl+Enter (Run)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveCode(true, `Quick Save (Ctrl+S) - ${new Date().toLocaleTimeString()}`);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRunCode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [roomId, user, stdin]);

  const handleLocalCodeChange = (newVal) => {
    const updated = newVal || '';
    setCode(updated);
    emitCodeChange(updated);
    triggerAutoSave();
  };

  const handleLanguageSelect = (newLang) => {
    setLanguage(newLang);
    emitLanguageChange(newLang);
    handleSaveCode(false);
  };

  const handleRestoreSuccess = (restoredCode, restoredLanguage, versionTitle) => {
    setCode(restoredCode);
    if (restoredLanguage) setLanguage(restoredLanguage);
    emitCodeChange(restoredCode);
    if (restoredLanguage) emitLanguageChange(restoredLanguage);
    emitCodeSaved(`Restored from '${versionTitle}'`, user?.name);
    setSaveStatus('saved');
    setLastSavedTime(new Date().toLocaleTimeString());
  };

  const handleCursorChange = (position, selection) => {
    emitCursorChange(position, selection);
  };

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setIsCopiedCode(true);
    setTimeout(() => setIsCopiedCode(false), 2000);
  };

  const handleFormatCode = () => {
    if (editorInstanceRef.current) {
      editorInstanceRef.current.getAction('editor.action.formatDocument')?.run();
    }
  };

  const handleResetCode = () => {
    if (window.confirm('Reset code to default template?')) {
      const defaultTemplates = {
        javascript: `// CodeSync Collaborative Environment - JavaScript\nfunction main() {\n  console.log("Welcome to CodeSync!");\n  const items = [1, 2, 3, 4, 5];\n  const sum = items.reduce((a, b) => a + b, 0);\n  console.log("Sum:", sum);\n}\n\nmain();\n`,
        typescript: `// CodeSync Collaborative Environment - TypeScript\nconst greet = (name: string): string => \`Hello, \${name}\`;\nconsole.log(greet("Developer"));\n`,
        python: `# CodeSync Collaborative Environment - Python\ndef main():\n    print("Welcome to CodeSync!")\n    numbers = [x * 2 for x in range(1, 6)]\n    print("Computed:", numbers)\n\nif __name__ == "__main__":\n    main()\n`,
        cpp: `// CodeSync Collaborative Environment - C++\n#include <iostream>\n\nint main() {\n    std::cout << "Welcome to CodeSync in C++!" << std::endl;\n    return 0;\n}\n`,
        c: `// CodeSync Collaborative Environment - C\n#include <stdio.h>\n\nint main() {\n    printf("Welcome to CodeSync in C!\\n");\n    return 0;\n}\n`,
        java: `// CodeSync Collaborative Environment - Java\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Welcome to CodeSync in Java!");\n    }\n}\n`,
        go: `// CodeSync Collaborative Environment - Go\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Welcome to CodeSync in Go!")\n}\n`,
      };
      const resetContent = defaultTemplates[language] || '// Happy Coding!';
      setCode(resetContent);
      emitCodeChange(resetContent);
      handleSaveCode(true, 'Template Reset');
    }
  };

  const handleEditorMount = (editor) => {
    editorInstanceRef.current = editor;
  };

  const handleLeaveRoom = async () => {
    try {
      await api.post(`/rooms/${roomId}/leave`);
      navigate('/dashboard');
    } catch {
      navigate('/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
        <p className="text-sm font-mono text-dark-300">Synchronizing workspace {roomId}...</p>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-dark-900 text-white flex flex-col items-center justify-center p-6 space-y-4">
        <div className="p-6 glass-panel rounded-2xl border border-rose-500/30 text-center max-w-md space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h2 className="text-lg font-bold">Room Unavailable</h2>
          <p className="text-sm text-dark-300">{error || 'This room does not exist or has been deleted.'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 rounded-xl text-sm font-medium transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-dark-900 text-dark-100 flex flex-col overflow-hidden">
      {/* Top Header Bar */}
      <header className="h-14 bg-dark-850 border-b border-dark-700 px-4 flex items-center justify-between shrink-0 z-20">
        {/* Left: Brand & Room Info */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-white hover:text-brand-400 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <FileCode className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm hidden sm:inline">CodeSync</span>
          </button>

          <div className="h-5 w-px bg-dark-700 hidden sm:block" />

          {/* Room ID Badge & Copy */}
          <div className="flex items-center space-x-2 bg-dark-800 border border-dark-700 px-2.5 py-1 rounded-lg">
            <span className="text-xs text-dark-400 font-medium">Room:</span>
            <span className="font-mono text-xs font-bold text-brand-cyan">{room.roomId}</span>
            <button
              onClick={handleCopyRoomId}
              className="text-dark-400 hover:text-white transition-colors"
              title="Copy Room ID"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <h2 className="text-xs font-semibold text-dark-200 hidden md:block max-w-xs truncate">
            {room.name}
          </h2>
        </div>

        {/* Right: Presence & Actions */}
        <div className="flex items-center space-x-3">
          {/* WebSocket Status */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-dark-800 border border-dark-700 text-xs">
            {isConnected ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span className={`text-[11px] font-medium hidden sm:inline ${isConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isConnected ? 'Live' : 'Reconnecting'}
            </span>
          </div>

          {/* Active Collaborators Toggle Button */}
          <button
            type="button"
            onClick={() => setIsPresenceOpen(!isPresenceOpen)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all flex items-center space-x-2 ${
              isPresenceOpen
                ? 'bg-brand-600/20 border-brand-500/40 text-brand-400'
                : 'bg-dark-800 border-dark-700 text-dark-300 hover:text-white hover:bg-dark-750'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-brand-400" />
            <span className="hidden sm:inline">Collaborators:</span>
            <span className="font-bold text-white bg-dark-900 px-1.5 py-0.5 rounded text-[11px]">
              {activeUsers.length || 1}
            </span>
          </button>

          {/* Leave Room Button */}
          <button
            onClick={handleLeaveRoom}
            className="px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-rose-500/15 text-dark-300 hover:text-rose-400 border border-dark-700 hover:border-rose-500/30 text-xs font-medium transition-all flex items-center space-x-1.5"
            title="Leave Room"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Leave</span>
          </button>
        </div>
      </header>

      {/* Editor Toolbar with History, Run & Save Integration */}
      <EditorToolbar
        language={language}
        onLanguageChange={handleLanguageSelect}
        fontSize={fontSize}
        setFontSize={setFontSize}
        minimap={minimap}
        setMinimap={setMinimap}
        wordWrap={wordWrap}
        setWordWrap={setWordWrap}
        onFormat={handleFormatCode}
        onReset={handleResetCode}
        onCopyCode={handleCopyCode}
        isCopied={isCopiedCode}
        onSave={() => handleSaveCode(true)}
        isSaving={isSaving}
        saveStatus={saveStatus}
        autoSave={autoSave}
        setAutoSave={setAutoSave}
        onRun={handleRunCode}
        isRunning={isRunning}
        onToggleTerminal={() => setIsTerminalOpen(!isTerminalOpen)}
        isTerminalOpen={isTerminalOpen}
        onOpenHistory={() => setIsHistoryOpen(true)}
      />

      {/* Peer Save Alert Banner */}
      {saveAlert && (
        <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-4 py-1.5 flex items-center justify-between text-xs text-emerald-400 animate-in slide-in-from-top-1">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              <strong>{saveAlert.savedBy}</strong> saved a new snapshot: <em>{saveAlert.versionTitle}</em>
            </span>
          </div>
          <span className="text-[10px] text-emerald-300 font-mono">Synced to MongoDB</span>
        </div>
      )}

      {/* Main Monaco Workspace & Presence Sidebar */}
      <div className="flex-1 w-full flex relative overflow-hidden">
        <main className="flex-1 h-full flex flex-col relative overflow-hidden">
          <div className="flex-1 w-full relative overflow-hidden">
            <CodeEditor
              code={code}
              language={language}
              onChange={handleLocalCodeChange}
              onMount={handleEditorMount}
              onCursorChange={handleCursorChange}
              remoteCursors={remoteCursors}
              fontSize={fontSize}
              minimap={minimap}
              wordWrap={wordWrap}
            />
          </div>

          {/* Execution Terminal & Custom Input Panel */}
          <ExecutionPanel
            isOpen={isTerminalOpen}
            onToggle={() => setIsTerminalOpen(!isTerminalOpen)}
            stdin={stdin}
            setStdin={setStdin}
            executionResult={executionResult}
            isRunning={isRunning}
            onRun={handleRunCode}
            onClear={() => setExecutionResult(null)}
          />
        </main>

        {/* Real-time Presence Drawer */}
        <PresenceSidebar
          isOpen={isPresenceOpen}
          onClose={() => setIsPresenceOpen(false)}
          activeUsers={activeUsers}
          currentUserId={user?.id || user?._id}
          ownerId={room.owner?._id || room.owner}
          typingUsers={typingUsers}
        />
      </div>

      {/* Version History & Diff Viewer Modal */}
      <VersionHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        roomId={room.roomId}
        currentCode={code}
        currentLanguage={language}
        onRestoreSuccess={handleRestoreSuccess}
      />

      {/* Bottom Status Bar */}
      <footer className="h-7 bg-dark-850 border-t border-dark-700 px-4 flex items-center justify-between text-[11px] text-dark-400 shrink-0 font-mono">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 text-emerald-400">
            <Circle className="w-2 h-2 fill-emerald-400" />
            <span>Sandbox Ready</span>
          </div>
          {lastSavedTime && (
            <span className="hidden sm:inline">Last Saved: {lastSavedTime}</span>
          )}
          {typingUsers.length > 0 ? (
            <span className="text-brand-400 animate-pulse hidden sm:inline">
              {typingUsers.map((u) => u.name).join(', ')} is typing...
            </span>
          ) : (
            <span className="hidden sm:inline">Shortcut: Ctrl+Enter (Run), Ctrl+S (Save)</span>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <span>Lang: {language.toUpperCase()}</span>
          <span>Font: {fontSize}px</span>
        </div>
      </footer>
    </div>
  );
}

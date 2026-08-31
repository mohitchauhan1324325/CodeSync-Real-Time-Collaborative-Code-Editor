import React from 'react';
import {
  Code,
  FileCode,
  Type,
  MapPin,
  AlignLeft,
  Wand2,
  RotateCcw,
  Copy,
  Check,
  Save,
  Loader2,
  Clock,
  Play,
  Terminal,
  History,
} from 'lucide-react';

const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', ext: '.js' },
  { id: 'typescript', name: 'TypeScript', ext: '.ts' },
  { id: 'python', name: 'Python', ext: '.py' },
  { id: 'cpp', name: 'C++', ext: '.cpp' },
  { id: 'c', name: 'C', ext: '.c' },
  { id: 'java', name: 'Java', ext: '.java' },
  { id: 'go', name: 'Go', ext: '.go' },
];

export default function EditorToolbar({
  language,
  onLanguageChange,
  fontSize,
  setFontSize,
  minimap,
  setMinimap,
  wordWrap,
  setWordWrap,
  onFormat,
  onReset,
  onCopyCode,
  isCopied,
  onSave,
  isSaving,
  saveStatus,
  autoSave,
  setAutoSave,
  onRun,
  isRunning,
  onToggleTerminal,
  isTerminalOpen,
  onOpenHistory,
}) {
  return (
    <div className="bg-dark-850 border-b border-dark-700 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
      {/* Left side: Language Selector, Run & Save */}
      <div className="flex items-center space-x-3">
        {/* Run Code Button */}
        <button
          type="button"
          onClick={onRun}
          disabled={isRunning}
          className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold shadow-md shadow-emerald-600/30 text-xs transition-all flex items-center space-x-1.5 disabled:opacity-50 hover:scale-105 active:scale-95"
          title="Run Code (Ctrl+Enter)"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Running...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Run</span>
            </>
          )}
        </button>

        {/* Manual Cloud Save Button */}
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium shadow-md shadow-brand-600/20 text-xs transition-all flex items-center space-x-1.5 disabled:opacity-50 hover:scale-105 active:scale-95"
          title="Save to MongoDB (Ctrl+S)"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Save</span>
            </>
          )}
        </button>

        {/* Version History Trigger */}
        <button
          type="button"
          onClick={onOpenHistory}
          className="px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-750 border border-dark-600 text-dark-200 hover:text-white text-xs font-medium transition-all flex items-center space-x-1.5"
          title="View Version History & Diffs"
        >
          <History className="w-3.5 h-3.5 text-brand-400" />
          <span className="hidden sm:inline">History</span>
        </button>

        <div className="h-4 w-px bg-dark-700" />

        {/* Language Selector */}
        <div className="flex items-center space-x-2">
          <FileCode className="w-4 h-4 text-brand-400" />
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            aria-label="Select Programming Language"
            className="bg-dark-800 border border-dark-600 rounded-lg px-2.5 py-1.5 text-white font-medium focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 cursor-pointer"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name} ({lang.ext})
              </option>
            ))}
          </select>
        </div>

        {/* Save Status Badge */}
        <div className="hidden xl:flex items-center space-x-1.5 text-[11px] text-dark-400 font-mono pl-2 border-l border-dark-700">
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 text-brand-400 animate-spin" />
              <span className="text-brand-300">Saving to Cloud...</span>
            </>
          ) : saveStatus === 'saved' ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Synced</span>
            </>
          ) : saveStatus === 'unsaved' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-300">Unsaved edits</span>
            </>
          ) : null}
        </div>
      </div>

      {/* Right side: Editor Preferences Controls & Terminal Toggle */}
      <div className="flex items-center space-x-2">
        {/* Terminal Toggle Button */}
        <button
          type="button"
          onClick={onToggleTerminal}
          className={`p-1.5 rounded-lg border text-xs font-medium flex items-center space-x-1 transition-colors ${
            isTerminalOpen
              ? 'bg-brand-cyan/15 border-brand-cyan/30 text-brand-cyan'
              : 'bg-dark-800 border-dark-600 text-dark-400 hover:text-white'
          }`}
          title="Toggle Terminal Console"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Console</span>
        </button>

        {/* Auto-Save Toggle */}
        <button
          type="button"
          onClick={() => setAutoSave(!autoSave)}
          className={`p-1.5 rounded-lg border text-xs font-medium flex items-center space-x-1 transition-colors ${
            autoSave
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              : 'bg-dark-800 border-dark-600 text-dark-400 hover:text-white'
          }`}
          title="Toggle Auto-Save (3s idle)"
        >
          <Clock className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Auto: {autoSave ? 'ON' : 'OFF'}</span>
        </button>

        {/* Font Size Selector */}
        <div className="flex items-center space-x-1.5 bg-dark-800 border border-dark-600 rounded-lg px-2 py-1 text-dark-300">
          <Type className="w-3.5 h-3.5" />
          <select
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            aria-label="Select Font Size"
            className="bg-transparent text-white font-mono text-xs focus:outline-none cursor-pointer"
          >
            <option value={12} className="bg-dark-850">12px</option>
            <option value={14} className="bg-dark-850">14px</option>
            <option value={16} className="bg-dark-850">16px</option>
            <option value={18} className="bg-dark-850">18px</option>
            <option value={20} className="bg-dark-850">20px</option>
          </select>
        </div>

        {/* Word Wrap Toggle */}
        <button
          type="button"
          onClick={() => setWordWrap(!wordWrap)}
          className={`p-1.5 rounded-lg border text-xs font-medium flex items-center space-x-1 transition-colors ${
            wordWrap
              ? 'bg-brand-600/20 border-brand-500/40 text-brand-400'
              : 'bg-dark-800 border-dark-600 text-dark-400 hover:text-white'
          }`}
          title="Toggle Word Wrap"
        >
          <AlignLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Wrap</span>
        </button>

        {/* Minimap Toggle */}
        <button
          type="button"
          onClick={() => setMinimap(!minimap)}
          className={`p-1.5 rounded-lg border text-xs font-medium flex items-center space-x-1 transition-colors ${
            minimap
              ? 'bg-brand-600/20 border-brand-500/40 text-brand-400'
              : 'bg-dark-800 border-dark-600 text-dark-400 hover:text-white'
          }`}
          title="Toggle Minimap"
        >
          <MapPin className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Minimap</span>
        </button>

        {/* Format Document Button */}
        <button
          type="button"
          onClick={onFormat}
          className="p-1.5 rounded-lg bg-dark-800 border border-dark-600 text-dark-300 hover:text-brand-400 hover:border-brand-500/40 transition-colors flex items-center space-x-1"
          title="Format Code"
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Format</span>
        </button>

        {/* Copy Code Button */}
        <button
          type="button"
          onClick={onCopyCode}
          className="p-1.5 rounded-lg bg-dark-800 border border-dark-600 text-dark-300 hover:text-white transition-colors flex items-center space-x-1"
          title="Copy Code"
        >
          {isCopied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

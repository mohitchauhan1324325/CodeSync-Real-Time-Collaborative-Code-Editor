import React, { useState } from 'react';
import {
  Terminal,
  Play,
  RotateCcw,
  Clock,
  Cpu,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  FileText,
  Trash2,
} from 'lucide-react';

export default function ExecutionPanel({
  isOpen,
  onToggle,
  stdin,
  setStdin,
  executionResult,
  isRunning,
  onRun,
  onClear,
}) {
  const [activeTab, setActiveTab] = useState('output'); // 'output' | 'input'
  const [isExpanded, setIsExpanded] = useState(false);

  // Determine badge colour based on Judge0 status label
  const getStatusColor = (status) => {
    if (!status) return 'bg-dark-700 text-dark-300';
    const s = status.toLowerCase();
    if (s === 'accepted') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (s.includes('queue') || s.includes('processing')) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    if (s === 'success') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
  };


  if (!isOpen) {
    return (
      <div className="h-9 bg-dark-850 border-t border-dark-700 px-4 flex items-center justify-between text-xs shrink-0 z-20">
        <button
          onClick={onToggle}
          className="flex items-center space-x-2 text-dark-300 hover:text-white font-medium transition-colors"
        >
          <Terminal className="w-4 h-4 text-brand-cyan" />
          <span>Execution Terminal & Input</span>
          <ChevronUp className="w-3.5 h-3.5" />
        </button>

        {executionResult && (
          <div className="flex items-center space-x-3 text-[11px] font-mono">
            <span className={`px-2 py-0.5 rounded border ${getStatusColor(executionResult.status)}`}>
              {executionResult.status}
            </span>
            {executionResult.executionTime > 0 && (
              <span className="text-dark-400">{executionResult.executionTime}ms</span>
            )}
          </div>
        )}
      </div>
    );
  }

  const hasOutput = executionResult && (
    executionResult.stdout ||
    executionResult.stderr ||
    executionResult.compileOutput ||
    executionResult.status === 'No Execution Engine'
  );

  return (
    <div
      className={`bg-dark-850 border-t border-dark-700 flex flex-col shrink-0 z-20 transition-all duration-200 ${
        isExpanded ? 'h-96' : 'h-64'
      }`}
    >
      {/* Panel Header & Tabs */}
      <div className="h-10 px-4 border-b border-dark-700 flex items-center justify-between bg-dark-900/60 shrink-0">
        <div className="flex items-center space-x-2">
          {/* Tab Buttons */}
          <button
            onClick={() => setActiveTab('output')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              activeTab === 'output'
                ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                : 'text-dark-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Output Console</span>
          </button>

          <button
            onClick={() => setActiveTab('input')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
              activeTab === 'input'
                ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                : 'text-dark-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Custom Input (stdin)</span>
            {stdin.trim() && (
              <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan" />
            )}
          </button>
        </div>

        {/* Telemetry Metrics & Panel Controls */}
        <div className="flex items-center space-x-3">
          {executionResult && (
            <div className="hidden sm:flex items-center space-x-3 text-xs font-mono">
              <div className="flex items-center space-x-1 text-dark-300">
                <Clock className="w-3.5 h-3.5 text-brand-cyan" />
                <span>{executionResult.executionTime}ms</span>
              </div>
              <div className="flex items-center space-x-1 text-dark-300">
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
                <span>{Math.round(executionResult.memoryUsage / 1024) || 8} MB</span>
              </div>
            </div>
          )}

          {activeTab === 'output' && hasOutput && (
            <button
              onClick={onClear}
              className="p-1 rounded text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
              title="Clear Output"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={onToggle}
            className="p-1 rounded text-dark-400 hover:text-white hover:bg-dark-800 transition-colors"
            title="Close Panel"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Panel Body */}
      <div className="flex-1 p-3 overflow-auto font-mono text-xs bg-dark-900">
        {activeTab === 'output' ? (
          <div className="space-y-2">
            {isRunning ? (
              <div className="flex items-center space-x-2 text-brand-400 animate-pulse py-4">
                <span className="w-2 h-2 rounded-full bg-brand-cyan animate-ping" />
                <span>Executing code inside sandbox container...</span>
              </div>
            ) : hasOutput ? (
              <div className="space-y-2">
                {/* Status description */}
                {executionResult.status && executionResult.status !== 'No Execution Engine' && (
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-[11px] uppercase font-bold text-dark-400">Exit Status:</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getStatusColor(executionResult.status)}`}>
                      {executionResult.status}
                    </span>
                  </div>
                )}

                {/* No Execution Engine notice */}
                {executionResult.status === 'No Execution Engine' && (
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/25 space-y-2">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="text-xs font-bold text-amber-400">Judge0 API Key Required</span>
                    </div>
                    <pre className="text-amber-300/80 text-[11px] whitespace-pre-wrap leading-relaxed">
                      {executionResult.stderr}
                    </pre>
                  </div>
                )}

                {/* Standard Output */}
                {executionResult.stdout && (
                  <pre className="text-dark-100 whitespace-pre-wrap leading-relaxed">
                    {executionResult.stdout}
                  </pre>
                )}

                {/* Standard Error / Compiler Error */}
                {(executionResult.stderr || executionResult.compileOutput) && (
                  <pre className="text-rose-400 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 whitespace-pre-wrap leading-relaxed">
                    {executionResult.stderr || executionResult.compileOutput}
                  </pre>
                )}
              </div>
            ) : (
              <div className="text-dark-500 italic py-6 text-center">
                Click "Run" or press <kbd className="px-1.5 py-0.5 rounded bg-dark-800 text-dark-300 border border-dark-700 text-[10px]">Ctrl+Enter</kbd> to execute your code.
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <label className="block text-[11px] uppercase font-bold text-dark-400 mb-2">
              Standard Input (stdin passed to program at runtime):
            </label>
            <textarea
              value={stdin}
              onChange={(e) => setStdin(e.target.value)}
              placeholder="Enter custom input values (e.g. numbers, strings, multiline test cases)..."
              className="flex-1 w-full p-3 bg-dark-800 border border-dark-700 rounded-lg text-dark-100 placeholder-dark-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none"
            />
          </div>
        )}
      </div>
    </div>
  );
}

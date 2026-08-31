import React from 'react';
import { Keyboard, X, Command } from 'lucide-react';

const SHORTCUTS = [
  { key: 'Ctrl + Enter / ⌘ + Enter', desc: 'Execute code inside sandboxed runtime' },
  { key: 'Ctrl + S / ⌘ + S', desc: 'Quick save snapshot to MongoDB cloud' },
  { key: 'Shift + Alt + F / ⇧ + ⌥ + F', desc: 'Auto-format source code document' },
  { key: 'Ctrl + F / ⌘ + F', desc: 'Find & replace within Monaco Editor' },
  { key: 'Ctrl + / / ⌘ + /', desc: 'Toggle single-line comment' },
  { key: 'Ctrl + Space', desc: 'Trigger autocomplete / IntelliSense suggestions' },
  { key: 'Alt + Click', desc: 'Insert multiple cursors in editor' },
];

export default function ShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg glass-panel rounded-2xl border border-dark-600 shadow-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-dark-700 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <Keyboard className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-white">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-dark-400 hover:text-white hover:bg-dark-750 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5">
          {SHORTCUTS.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-xl bg-dark-800/80 border border-dark-700 text-xs"
            >
              <span className="text-dark-300">{item.desc}</span>
              <kbd className="px-2 py-1 rounded bg-dark-900 border border-dark-600 text-white font-mono font-semibold shadow-inner">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-dark-800 hover:bg-dark-750 text-white text-xs font-semibold rounded-xl border border-dark-600 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

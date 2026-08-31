import React from 'react';
import { Loader2 } from 'lucide-react';

export default function EditorSkeleton() {
  return (
    <div className="w-full h-full bg-dark-900 flex flex-col items-center justify-center space-y-4 border border-dark-700 rounded-b-xl">
      <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      <div className="text-center space-y-1">
        <p className="text-sm font-semibold text-white">Initializing Monaco Engine...</p>
        <p className="text-xs text-dark-400 font-mono">Loading syntax highlighters and language servers</p>
      </div>
    </div>
  );
}

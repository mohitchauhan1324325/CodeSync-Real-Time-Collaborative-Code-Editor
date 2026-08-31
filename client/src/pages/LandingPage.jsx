import React from 'react';
import { Link } from 'react-router-dom';
import { Code2, Users, Cpu, ShieldCheck, Zap, ArrowRight, GitBranch, Terminal } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dark-900 text-dark-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-dark-700 bg-dark-850/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-cyan flex items-center justify-center shadow-lg shadow-brand-500/20">
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-dark-100 to-brand-300">
              Code<span className="text-brand-500">Sync</span>
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/login"
              className="px-4 py-2 text-sm font-medium text-dark-300 hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 text-sm font-medium bg-brand-600 hover:bg-brand-500 text-white rounded-lg shadow-md shadow-brand-600/30 transition-all hover:scale-105 active:scale-95"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 flex flex-col justify-center">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-600/10 border border-brand-500/30 text-brand-400 text-xs font-semibold uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5" />
            <span>Next-Gen Real-Time Collaboration</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Code together in real-time, <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-500 via-brand-cyan to-brand-emerald">
              zero latency, seamless sync.
            </span>
          </h1>

          <p className="text-lg text-dark-300 leading-relaxed">
            A production-ready collaborative coding platform engineered for pair programming, live interviews, and multi-language sandboxed execution with live multi-cursor presence.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-medium rounded-xl shadow-lg shadow-brand-600/30 transition-all flex items-center justify-center space-x-2 hover:scale-105"
            >
              <span>Start Coding Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 bg-dark-800 hover:bg-dark-750 text-dark-200 border border-dark-600 font-medium rounded-xl transition-all flex items-center justify-center space-x-2"
            >
              <Terminal className="w-4 h-4 text-brand-400" />
              <span>Join a Room</span>
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
          <div className="glass-panel p-6 rounded-2xl border border-dark-700">
            <div className="w-12 h-12 rounded-xl bg-brand-600/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Live Multi-User Cursors</h3>
            <p className="text-sm text-dark-300 leading-relaxed">
              Track peer cursor positions, selections, and typing events smoothly with throttled WebSocket streams.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-dark-700">
            <div className="w-12 h-12 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center text-brand-cyan mb-4">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Sandboxed Code Execution</h3>
            <p className="text-sm text-dark-300 leading-relaxed">
              Run JavaScript, Python, C++, Java, and Go instantly with custom stdin inputs and real-time execution telemetry.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border border-dark-700">
            <div className="w-12 h-12 rounded-xl bg-brand-emerald/10 border border-brand-emerald/20 flex items-center justify-center text-brand-emerald mb-4">
              <GitBranch className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Version Snapshots</h3>
            <p className="text-sm text-dark-300 leading-relaxed">
              Save key milestones, inspect version history diffs, and restore prior code states with a single click.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-800 py-6 text-center text-xs text-dark-400">
        <p>CodeSync — Real-Time Collaborative Code Editor Architecture &copy; 2026</p>
      </footer>
    </div>
  );
}

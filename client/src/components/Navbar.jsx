import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Code2, LayoutDashboard, PlusCircle, LogIn, User, LogOut, ChevronDown } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="border-b border-dark-700 bg-dark-850/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-cyan flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-dark-100 to-brand-300">
            Code<span className="text-brand-500">Sync</span>
          </span>
        </Link>

        {/* Center Navigation */}
        {isAuthenticated && (
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              to="/dashboard"
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                isActive('/dashboard')
                  ? 'bg-brand-600/15 text-brand-400 border border-brand-500/30'
                  : 'text-dark-300 hover:text-white hover:bg-dark-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/create-room"
              className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                isActive('/create-room')
                  ? 'bg-brand-600/15 text-brand-400 border border-brand-500/30'
                  : 'text-dark-300 hover:text-white hover:bg-dark-800'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Room</span>
            </Link>
          </nav>
        )}

        {/* Right User Actions */}
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-3 p-1.5 rounded-xl hover:bg-dark-800 border border-transparent hover:border-dark-700 transition-all"
              >
                <img
                  src={user?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.name || 'User'}`}
                  alt={user?.name}
                  className="w-8 h-8 rounded-lg bg-dark-700 border border-dark-600"
                />
                <span className="text-sm font-medium text-dark-200 hidden sm:inline-block">
                  {user?.name}
                </span>
                <ChevronDown className="w-4 h-4 text-dark-400" />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 glass-panel rounded-xl shadow-2xl py-1.5 z-50 border border-dark-600 animate-in fade-in slide-in-from-top-2 duration-150"
                  onMouseLeave={() => setDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-dark-700">
                    <p className="text-xs text-dark-400">Signed in as</p>
                    <p className="text-sm font-semibold text-white truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center px-4 py-2 text-sm text-dark-200 hover:bg-dark-750 hover:text-white transition-colors"
                  >
                    <User className="w-4 h-4 mr-2.5 text-brand-400" />
                    Profile & Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-2.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center space-x-3">
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
          )}
        </div>
      </div>
    </header>
  );
}

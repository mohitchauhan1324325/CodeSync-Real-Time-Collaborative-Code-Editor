import React from 'react';
import { Users, Crown, Sparkles, X } from 'lucide-react';

export default function PresenceSidebar({
  isOpen,
  onClose,
  activeUsers = [],
  currentUserId,
  ownerId,
  typingUsers = [],
}) {
  if (!isOpen) return null;

  return (
    <aside className="w-72 bg-dark-850 border-l border-dark-700 h-full flex flex-col shrink-0 z-30 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-dark-700 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-brand-400" />
          <h3 className="font-bold text-sm text-white">Active Collaborators</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-600/20 text-brand-400 font-mono font-semibold">
            {activeUsers.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-dark-400 hover:text-white hover:bg-dark-750 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Typing Indicator Bar */}
      {typingUsers.length > 0 && (
        <div className="bg-brand-600/10 border-b border-brand-500/20 px-4 py-2 flex items-center space-x-2 text-xs text-brand-400 animate-pulse">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {typingUsers.map((u) => u.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </span>
        </div>
      )}

      {/* User List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {activeUsers.map((user) => {
          const isMe = user.id === currentUserId;
          const isOwner = user.id === ownerId || user.role === 'owner';
          const userColor = user.color || '#6366f1';

          return (
            <div
              key={user.socketId || user.id}
              className="p-2.5 rounded-xl bg-dark-800/60 border border-dark-700/80 hover:border-dark-600 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center space-x-3 min-w-0">
                {/* Avatar with dynamic color ring */}
                <div className="relative shrink-0">
                  <img
                    src={
                      user.avatar ||
                      `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name || 'User'}`
                    }
                    alt={user.name}
                    className="w-8 h-8 rounded-lg bg-dark-700 border"
                    style={{ borderColor: userColor }}
                  />
                  {/* Status dot */}
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-dark-850"
                    style={{ backgroundColor: userColor }}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-semibold text-white truncate">
                      {user.name} {isMe && '(You)'}
                    </span>
                    {isOwner && (
                      <Crown className="w-3 h-3 text-amber-400 shrink-0" title="Room Owner" />
                    )}
                  </div>
                  <p className="text-[11px] text-dark-400 truncate">{user.email || 'Online'}</p>
                </div>
              </div>

              {/* User Color Chip */}
              <div
                className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: userColor }}
                title={`Remote cursor color: ${userColor}`}
              />
            </div>
          );
        })}
      </div>
    </aside>
  );
}

import React from 'react';
import type { User } from '@supabase/supabase-js';
import { Settings, SlidersHorizontal, ArrowLeft, UserCircle, Clock, Moon, Sun, FlaskConical, Home } from 'lucide-react';
import { Logo } from './Logo';

export type AppView = 'dashboard' | 'setup' | 'chat';

interface HeaderProps {
  currentView: AppView;
  onNavigateBack: () => void;
  onNavigateHome: () => void;
  onSignOut: () => Promise<void>;
  onOpenUserSettings: () => void;
  onOpenHistory: () => void;
  onOpenExperiments: () => void;
  user: User;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export function Header({
  currentView, onNavigateBack, onNavigateHome, onSignOut,
  onOpenUserSettings, onOpenHistory, onOpenExperiments,
  user, isDarkMode, onToggleDarkMode,
}: HeaderProps) {
  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Account';

  const backLabel = currentView === 'chat' ? 'Back to setup'
    : currentView === 'setup' ? 'Back to dashboard'
    : 'Back to landing page';

  return (
    <header className="glass sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {currentView !== 'dashboard' && (
            <button
              onClick={onNavigateBack}
              aria-label={backLabel}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              title={backLabel}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <Logo />
          {currentView !== 'dashboard' && (
            <>
              <button
                onClick={onNavigateHome}
                aria-label="Back to dashboard"
                title="Back to dashboard"
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <Home className="w-3.5 h-3.5" />
                <span className="hidden sm:block">Dashboard</span>
              </button>
              <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
                {currentView === 'setup' ? 'Configure' : 'Conversation'}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={onOpenExperiments} data-tour="experiments-btn" aria-label="Saved experiments" title="Saved experiments"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <FlaskConical className="w-3.5 h-3.5" />
            <span className="hidden sm:block">Experiments</span>
          </button>
          <button onClick={onOpenHistory} aria-label="Conversation history" title="Conversation history"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden sm:block">History</span>
          </button>
          {currentView === 'chat' && (
            <button onClick={onNavigateBack}
              aria-label="Edit bot config" title="Edit bot config"
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          )}
          <button onClick={onOpenUserSettings} aria-label="Account settings" title="Account settings & API keys"
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <Settings className="w-4 h-4" />
          </button>
          <button onClick={onToggleDarkMode}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-600 dark:text-gray-400">
            <UserCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
            <span className="hidden sm:block max-w-[100px] truncate">{displayName}</span>
          </div>
          <button onClick={onSignOut} title="Sign out"
            className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}

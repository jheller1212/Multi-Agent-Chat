import React from 'react';
import { Logo } from './Logo';

interface NavigationProps {
  onAuthClick: () => void;
  onSignUpClick: () => void;
  isAuthenticated: boolean;
}

export function Navigation({ onAuthClick, onSignUpClick, isAuthenticated }: NavigationProps) {
  return (
    <nav className="fixed w-full bg-white/80 backdrop-blur-sm z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Logo />
          <div className="flex items-center gap-4">
            {!isAuthenticated && (
              <button
                onClick={onAuthClick}
                className="px-4 py-2 text-sm font-medium text-orange-600 hover:text-orange-500"
              >
                Sign in
              </button>
            )}
            <button
              onClick={isAuthenticated ? onAuthClick : onSignUpClick}
              className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-sky-500 rounded-lg hover:from-orange-400 hover:to-sky-400 shadow-md hover:shadow-lg transition-all"
            >
              {isAuthenticated ? 'Open App' : 'Get Started'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

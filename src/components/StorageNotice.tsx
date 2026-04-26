import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const NOTICE_KEY = 'ai2ai_storage_notice_dismissed';

interface StorageNoticeProps {
  onPrivacyClick: () => void;
}

export function StorageNotice({ onPrivacyClick }: StorageNoticeProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(NOTICE_KEY)) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(NOTICE_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 text-gray-200 border-t border-gray-700 px-4 py-3">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-sm leading-snug">
          This site uses <strong>localStorage</strong> (not cookies) to store your theme preference and
          chat settings on your device. No tracking scripts are used.{' '}
          <button
            onClick={() => { dismiss(); onPrivacyClick(); }}
            className="underline hover:text-white transition-colors"
          >
            Privacy Policy
          </button>
        </p>
        <button
          onClick={dismiss}
          aria-label="Dismiss notice"
          className="flex-shrink-0 flex items-center gap-1.5 text-sm bg-gray-700 hover:bg-gray-600 transition-colors px-3 py-1.5 rounded-md"
        >
          <X className="w-3.5 h-3.5" />
          Got it
        </button>
      </div>
    </div>
  );
}

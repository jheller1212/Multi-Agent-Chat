import React, { useState } from 'react';
import { X, GraduationCap } from 'lucide-react';

interface WorkshopBannerProps {
  name: string;
  welcome: string;
}

export function WorkshopBanner({ name, welcome }: WorkshopBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 relative">
      <div className="max-w-5xl mx-auto flex items-start gap-3">
        <GraduationCap className="w-5 h-5 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{name}</p>
          {welcome && <p className="text-sm text-indigo-100 mt-0.5">{welcome}</p>}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-indigo-200 hover:text-white transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

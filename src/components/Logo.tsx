import React from 'react';
import { Bot } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center">
      <div className="relative flex items-center">
        <Bot className="h-7 w-7 text-orange-500" />
        <Bot className="h-7 w-7 text-sky-500 -ml-2" />
      </div>
      <span className="ml-2 text-xl font-heading font-bold text-lab-heading dark:text-white">
        AI2AI-Chat
      </span>
      <span className="ml-2 text-xs font-medium text-lab-body dark:text-gray-400 tracking-wide uppercase">
        for Research
      </span>
    </div>
  );
}

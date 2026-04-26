import React from 'react';
import { Bot, Mail } from 'lucide-react';

interface FooterProps {
  onPrivacyClick: () => void;
  onTermsClick: () => void;
}

export function Footer({ onPrivacyClick, onTermsClick }: FooterProps) {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8">

          {/* Brand */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                <Bot className="h-5 w-5 text-orange-400" />
                <Bot className="h-5 w-5 text-sky-400 -ml-1.5" />
              </div>
              <span className="text-white font-bold text-lg">AI2AI-Chat</span>
            </div>
            <p className="text-sm max-w-xs">
              A free research tool for AI-to-AI conversations. Configure, compare, and export. Bring your own API keys.
            </p>
            <p className="text-xs text-gray-400">
              API keys are encrypted and stored securely. They persist across sessions and devices.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-3 text-sm">
            <a
              href="mailto:hello@ai2ai-chat.com"
              className="flex items-center gap-2 hover:text-orange-400 transition-colors"
            >
              <Mail className="w-4 h-4" />
              hello@ai2ai-chat.com
            </a>
            <a
              href="#faq"
              className="hover:text-orange-400 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              FAQ
            </a>
            <button
              onClick={onPrivacyClick}
              className="text-left hover:text-orange-400 transition-colors"
            >
              Privacy Policy
            </button>
            <button
              onClick={onTermsClick}
              className="text-left hover:text-orange-400 transition-colors"
            >
              Terms of Use
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <span>© {new Date().getFullYear()} AI2AI-Chat · All rights reserved</span>
          <span>Conversations stored with Supabase · Not affiliated with OpenAI, Anthropic, Google, or Mistral</span>
        </div>
      </div>
    </footer>
  );
}

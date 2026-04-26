import React from 'react';
import { Settings2, Zap, Download } from 'lucide-react';

export function ResearchAreas() {
  return (
    <div className="py-8 bg-white/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-900">What it does</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card
            icon={<Settings2 className="h-6 w-6 text-orange-600" />}
            title="Configure & compare"
            description="Pick any two AI models, give each its own role and system prompt, then watch them interact. Compare how GPT, Claude, Gemini, or Mistral handle the same scenario."
            bgColor="bg-orange-100"
          />
          <Card
            icon={<Zap className="h-6 w-6 text-sky-600" />}
            title="Start in seconds"
            description="Choose a built-in scenario — comedy roast, B2B negotiation, therapy session — or create your own. Pre-filled prompts mean you can start running experiments in seconds."
            bgColor="bg-sky-100"
          />
          <Card
            icon={<Download className="h-6 w-6 text-orange-600" />}
            title="Export everything"
            description="Download full conversation logs as CSV — word counts, response times, model settings, and message content — ready for analysis, reporting, or sharing with your team."
            bgColor="bg-orange-100"
          />
        </div>
      </div>
    </div>
  );
}

interface CardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  bgColor: string;
}

function Card({ icon, title, description, bgColor }: CardProps) {
  return (
    <div className="p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all">
      <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

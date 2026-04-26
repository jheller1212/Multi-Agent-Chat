import React from 'react';

interface HeroSectionProps {
  onSignUpClick: () => void;
}

export function HeroSection({ onSignUpClick }: HeroSectionProps) {
  return (
    <div className="pt-24 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Run multi-agent{' '}
            <span className="bg-gradient-to-r from-orange-500 to-sky-500 text-transparent bg-clip-text">
              LLM experiments.
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto">
            Configure AI agents, design factorial experiments, and collect structured
            research data — all from the browser. Built for procurement, law, mediation,
            and any multi-agent scenario.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <button
              onClick={onSignUpClick}
              className="px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-orange-500 to-sky-500 rounded-lg hover:from-orange-400 hover:to-sky-400 shadow-lg hover:shadow-xl transition-all"
            >
              Create free account
            </button>
          </div>
          <p className="text-sm text-gray-500">Free to use · Bring your own API keys · 6 LLM providers supported</p>
        </div>
      </div>
    </div>
  );
}

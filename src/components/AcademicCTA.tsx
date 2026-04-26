import React from 'react';

interface AcademicCTAProps {
  onSignUpClick: () => void;
}

export function AcademicCTA({ onSignUpClick }: AcademicCTAProps) {
  return (
    <div className="py-10 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Ready to try it?</h2>
        <p className="text-gray-600 mb-6 max-w-xl mx-auto">
          Free for researchers, teams, and educators. Bring your own API keys from OpenAI, Anthropic, Google, or Mistral.
        </p>
        <button
          onClick={onSignUpClick}
          className="px-8 py-4 text-lg font-medium text-white bg-gradient-to-r from-orange-500 to-sky-500 rounded-lg hover:from-orange-400 hover:to-sky-400 shadow-lg hover:shadow-xl transition-all"
        >
          Create free account
        </button>
      </div>
    </div>
  );
}

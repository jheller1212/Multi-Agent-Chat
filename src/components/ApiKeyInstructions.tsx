import React, { useEffect } from 'react';
import { X, ShieldAlert, ExternalLink } from 'lucide-react';

interface ApiKeyInstructionsProps {
  isOpen: boolean;
  onClose: () => void;
  instructions: { url: string; label: string; steps: string[] };
  modelName: string;
}

export function ApiKeyInstructions({ isOpen, onClose, instructions, modelName }: ApiKeyInstructionsProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const titleId = 'api-key-instructions-title';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 relative">
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h3 id={titleId} className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            How to get {modelName} API Key
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          {/* Security Notice */}
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <ShieldAlert className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-400">Security Notice</h3>
                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Never share your API keys with anyone</li>
                    <li>API keys are encrypted (AES-256) and stored securely on our server</li>
                    <li>Keys persist across sessions and devices when you're signed in</li>
                    <li>Treat your API keys like passwords</li>
                    <li>Regularly rotate your API keys for better security</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <ol className="space-y-3">
            <li className="flex items-start">
              <span className="flex items-center justify-center w-6 h-6 bg-indigo-100 dark:bg-indigo-900/40 rounded-full text-indigo-600 dark:text-indigo-400 text-sm font-medium mr-3 shrink-0">
                1
              </span>
              <span className="text-gray-600 dark:text-gray-300">
                Go to{' '}
                <a
                  href={instructions.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  {instructions.label}
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </span>
            </li>
            {instructions.steps.map((step, index) => (
              <li key={index} className="flex items-start">
                <span className="flex items-center justify-center w-6 h-6 bg-indigo-100 dark:bg-indigo-900/40 rounded-full text-indigo-600 dark:text-indigo-400 text-sm font-medium mr-3 shrink-0">
                  {index + 2}
                </span>
                <span className="text-gray-600 dark:text-gray-300">{step}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-b-lg flex gap-3">
          <a
            href={instructions.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            Open {instructions.label}
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorDisplayProps {
  errors: string[];
  onClear?: () => void;
}

export function ErrorDisplay({ errors, onClear }: ErrorDisplayProps) {
  if (errors.length === 0) return null;

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 rounded">
      <div className="flex items-start justify-between gap-2">
        <div className="flex gap-2">
          <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
              {errors.length === 1 ? 'Error' : 'Please fix the following errors:'}
            </h3>
            <ul className="mt-1 text-sm text-red-700 dark:text-red-400 list-disc list-inside space-y-0.5">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
        {onClear && (
          <button
            onClick={onClear}
            className="p-1 text-red-400 hover:text-red-600 dark:hover:text-red-300 rounded flex-shrink-0"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

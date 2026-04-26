import React, { useState } from 'react';
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  text: string;
  /** 'center' (default) centers the bubble above the icon; 'right' aligns it to the right edge of the icon (extends leftward) */
  align?: 'center' | 'right';
}

export function InfoTooltip({ text, align = 'center' }: InfoTooltipProps) {
  const [visible, setVisible] = useState(false);

  const positionClass =
    align === 'right'
      ? 'right-0'
      : 'left-1/2 -translate-x-1/2';

  const arrowClass =
    align === 'right'
      ? 'right-1.5'
      : 'left-1/2 -translate-x-1/2';

  return (
    <span className="relative inline-flex items-center">
      <Info
        className="w-3.5 h-3.5 text-gray-400 cursor-help flex-shrink-0"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      />
      {visible && (
        <span className={`absolute bottom-full ${positionClass} mb-2 w-60 p-2.5 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 pointer-events-none leading-relaxed`}>
          {text}
          <span className={`absolute top-full ${arrowClass} border-4 border-transparent border-t-gray-900`} />
        </span>
      )}
    </span>
  );
}


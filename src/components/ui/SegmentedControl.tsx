import { useId } from 'react';
import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { motion } from 'framer-motion';

import { spring } from '../../lib/motion';

export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: SegmentedControlOption<T>[];
  'aria-label': string;
  className?: string;
}

/**
 * macOS-style segmented control: sunken track, white thumb sliding between
 * segments via shared layoutId (design-system.md §6). 2-5 options max —
 * more than that should be a Select.
 */
export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  className = '',
  ...aria
}: SegmentedControlProps<T>) {
  const layoutGroup = useId();

  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      onValueChange={(next) => {
        // Radix emits '' when the active item is re-clicked; keep selection.
        if (next) onValueChange(next as T);
      }}
      aria-label={aria['aria-label']}
      className={`inline-flex rounded-[8px] bg-bg-sunken p-0.5 ${className}`}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <ToggleGroup.Item
            key={option.value}
            value={option.value}
            disabled={option.disabled}
            className={`relative h-[26px] select-none px-3 text-caption transition-colors duration-fast ease-out
              focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-soft-2 focus-visible:z-10
              disabled:pointer-events-none disabled:opacity-40
              ${active ? 'text-label-1' : 'text-label-2 hover:text-label-1'}`}
          >
            {active && (
              <motion.span
                layoutId={`segmented-thumb-${layoutGroup}`}
                transition={spring.snappy}
                className="absolute inset-0 rounded-[6px] bg-bg-elevated shadow-1"
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </ToggleGroup.Item>
        );
      })}
    </ToggleGroup.Root>
  );
}

import { useId } from 'react';
import * as RadixSwitch from '@radix-ui/react-switch';
import { motion } from 'framer-motion';

import { spring } from '../../lib/motion';

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
}

/**
 * Apple-style toggle. Track 36x22, 18px thumb travelling 14px on a snappy
 * spring. With `label`, renders a full-width row where the whole label
 * toggles (design-system.md §6).
 */
export function Switch({ checked, onCheckedChange, label, description, disabled, id }: SwitchProps) {
  const autoId = useId();
  const switchId = id ?? autoId;

  const control = (
    <RadixSwitch.Root
      id={switchId}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={`relative h-[22px] w-9 shrink-0 rounded-full transition-colors duration-fast ease-out
        focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-soft-2
        disabled:pointer-events-none disabled:opacity-40
        ${checked ? 'bg-accent-fill' : 'bg-fill-1'}`}
    >
      <RadixSwitch.Thumb asChild>
        <motion.span
          className="block h-[18px] w-[18px] rounded-full bg-white shadow-1"
          initial={false}
          animate={{ x: checked ? 16 : 2 }}
          transition={spring.snappy}
        />
      </RadixSwitch.Thumb>
    </RadixSwitch.Root>
  );

  if (!label) return control;

  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <label htmlFor={switchId} className={`min-w-0 ${disabled ? 'opacity-40' : 'cursor-pointer'}`}>
        <span className="block text-callout font-medium text-label-1">{label}</span>
        {description && <span className="mt-0.5 block text-caption font-normal text-label-2">{description}</span>}
      </label>
      {control}
    </div>
  );
}

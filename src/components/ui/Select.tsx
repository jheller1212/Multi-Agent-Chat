import * as RadixSelect from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react';
import type { ReactNode } from 'react';

export interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

export interface SelectGroup {
  label?: string;
  options: SelectOption[];
}

export interface SelectProps {
  value: string | undefined;
  onValueChange: (value: string) => void;
  groups: SelectGroup[];
  placeholder?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
  'aria-label'?: string;
  className?: string;
}

/**
 * Input-like trigger + elevated menu with a 22px checkmark gutter
 * (design-system.md §6). Pass a single group for a flat list.
 */
export function Select({
  value,
  onValueChange,
  groups,
  placeholder = 'Select…',
  disabled,
  size = 'md',
  className = '',
  ...aria
}: SelectProps) {
  return (
    <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <RadixSelect.Trigger
        aria-label={aria['aria-label']}
        className={`inline-flex ${size === 'sm' ? 'h-7' : 'h-8'} w-full items-center justify-between gap-2
          rounded-sm border border-separator-opaque bg-bg-base px-2.5 text-callout text-label-1
          transition-colors duration-instant ease-out hover:bg-fill-3
          focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-soft-2
          disabled:pointer-events-none disabled:opacity-40
          data-[placeholder]:text-label-3 ${className}`}
      >
        <span className="truncate">
          <RadixSelect.Value placeholder={placeholder} />
        </span>
        <RadixSelect.Icon>
          <ChevronsUpDown size={14} className="shrink-0 text-label-3" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={4}
          className="z-50 max-h-80 min-w-[var(--radix-select-trigger-width)] overflow-hidden
            rounded-md bg-bg-elevated shadow-2"
        >
          <RadixSelect.ScrollUpButton className="flex h-6 items-center justify-center text-label-3">
            <ChevronUp size={14} />
          </RadixSelect.ScrollUpButton>
          <RadixSelect.Viewport className="p-1">
            {groups.map((group, gi) => (
              <RadixSelect.Group key={group.label ?? gi}>
                {group.label && (
                  <RadixSelect.Label className="px-2 pb-1 pt-2 text-caption-2 uppercase tracking-[0.06em] text-label-3">
                    {group.label}
                  </RadixSelect.Label>
                )}
                {group.options.map((option) => (
                  <RadixSelect.Item
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className="relative flex h-7 cursor-default select-none items-center rounded-[6px]
                      pl-[26px] pr-2 text-callout text-label-1 outline-none
                      data-[highlighted]:bg-fill-2 data-[disabled]:pointer-events-none data-[disabled]:opacity-40"
                  >
                    <RadixSelect.ItemIndicator className="absolute left-1.5 text-accent">
                      <Check size={14} strokeWidth={2.5} />
                    </RadixSelect.ItemIndicator>
                    <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                  </RadixSelect.Item>
                ))}
              </RadixSelect.Group>
            ))}
          </RadixSelect.Viewport>
          <RadixSelect.ScrollDownButton className="flex h-6 items-center justify-center text-label-3">
            <ChevronDown size={14} />
          </RadixSelect.ScrollDownButton>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  );
}

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface StepperProps {
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  'aria-label': string;
  className?: string;
}

const HOLD_DELAY_MS = 400;
const HOLD_INTERVAL_MS = 60;

/**
 * Numeric stepper: mono value field + split −/+ pair with hold-to-repeat;
 * out-of-range input clamps and flashes on blur (design-system.md §6).
 */
export function Stepper({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  disabled,
  className = '',
  ...aria
}: StepperProps) {
  const [draft, setDraft] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout>>();
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => () => clearTimeout(holdTimer.current), []);

  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  const nudge = (direction: 1 | -1) => {
    onValueChange(clamp(valueRef.current + direction * step));
  };

  const startHold = (direction: 1 | -1) => {
    nudge(direction);
    const repeat = () => {
      nudge(direction);
      holdTimer.current = setTimeout(repeat, HOLD_INTERVAL_MS);
    };
    holdTimer.current = setTimeout(repeat, HOLD_DELAY_MS);
  };

  const endHold = () => clearTimeout(holdTimer.current);

  const commitDraft = () => {
    if (draft === null) return;
    const parsed = Number(draft);
    if (Number.isFinite(parsed)) {
      const clamped = clamp(parsed);
      if (clamped !== parsed) {
        setFlash(true);
        setTimeout(() => setFlash(false), 160);
      }
      onValueChange(clamped);
    }
    setDraft(null);
  };

  const buttonClass = `flex h-4 w-6 items-center justify-center text-label-2
    transition-colors duration-instant ease-out hover:bg-fill-2 active:bg-fill-1
    focus-visible:outline-none focus-visible:bg-accent-soft-2
    disabled:pointer-events-none disabled:opacity-40`;

  return (
    <div
      className={`inline-flex h-8 items-stretch overflow-hidden rounded-sm border border-separator-opaque
        bg-bg-base transition-colors duration-fast ease-out
        focus-within:ring-[3px] focus-within:ring-accent-soft-2
        ${flash ? 'bg-destructive-soft' : ''}
        ${disabled ? 'pointer-events-none opacity-40' : ''} ${className}`}
    >
      <input
        type="text"
        inputMode="numeric"
        value={draft ?? String(value)}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commitDraft}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commitDraft();
          if (e.key === 'ArrowUp') { e.preventDefault(); nudge(1); }
          if (e.key === 'ArrowDown') { e.preventDefault(); nudge(-1); }
        }}
        disabled={disabled}
        aria-label={aria['aria-label']}
        className="tnum w-14 bg-transparent px-2 text-right font-mono text-mono-data text-label-1 outline-none"
      />
      <div className="flex flex-col border-l border-separator-opaque">
        <button
          type="button"
          tabIndex={-1}
          aria-label="Increment"
          disabled={disabled || value >= max}
          onPointerDown={() => startHold(1)}
          onPointerUp={endHold}
          onPointerLeave={endHold}
          className={buttonClass}
        >
          <ChevronUp size={12} />
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-label="Decrement"
          disabled={disabled || value <= min}
          onPointerDown={() => startHold(-1)}
          onPointerUp={endHold}
          onPointerLeave={endHold}
          className={`${buttonClass} border-t border-separator-opaque`}
        >
          <ChevronDown size={12} />
        </button>
      </div>
    </div>
  );
}

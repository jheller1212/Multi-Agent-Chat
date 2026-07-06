import * as RadixSlider from '@radix-ui/react-slider';

export interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  /** Formats the mono readout to the right of the track. */
  formatValue?: (value: number) => string;
  showValue?: boolean;
  'aria-label': string;
  className?: string;
}

/**
 * 4px track, 20px thumb that grows while dragging, mono-data readout beside
 * the track — no floating bubble (design-system.md §6).
 */
export function Slider({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  disabled,
  formatValue = String,
  showValue = true,
  className = '',
  ...aria
}: SliderProps) {
  return (
    <div className={`flex items-center gap-3 ${disabled ? 'opacity-40' : ''} ${className}`}>
      <RadixSlider.Root
        value={[value]}
        onValueChange={([next]) => onValueChange(next)}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        aria-label={aria['aria-label']}
        className="relative flex h-5 min-w-0 flex-1 touch-none select-none items-center"
      >
        <RadixSlider.Track className="relative h-1 grow rounded-full bg-bg-sunken">
          <RadixSlider.Range className="absolute h-full rounded-full bg-accent-fill" />
        </RadixSlider.Track>
        <RadixSlider.Thumb
          className="block h-5 w-5 rounded-full border border-separator bg-white shadow-2
            transition-transform duration-instant ease-out active:scale-110
            focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-soft-2"
        />
      </RadixSlider.Root>
      {showValue && (
        <span className="tnum w-10 shrink-0 text-right font-mono text-mono-data text-label-2">
          {formatValue(value)}
        </span>
      )}
    </div>
  );
}

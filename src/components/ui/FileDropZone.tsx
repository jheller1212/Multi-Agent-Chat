import { useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { Upload } from 'lucide-react';

import { spring } from '../../lib/motion';

export interface FileDropZoneProps {
  /** Accepted extensions, e.g. ['.json', '.csv']. Empty = accept anything. */
  accept?: string[];
  onFiles: (files: File[]) => void;
  multiple?: boolean;
  label?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * File drop zone per design-system.md §6: dashed 2px border (the one 2px
 * exception), accent highlight on drag-over, shake + inline error on
 * rejected files.
 */
export function FileDropZone({
  accept = [],
  onFiles,
  multiple = false,
  label = 'Drop file or click to browse',
  disabled,
  className = '',
}: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shake = useAnimationControls();

  const acceptsFile = (file: File) =>
    accept.length === 0 || accept.some((ext) => file.name.toLowerCase().endsWith(ext.toLowerCase()));

  const handleFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const files = Array.from(list).slice(0, multiple ? undefined : 1);
    const rejected = files.filter((f) => !acceptsFile(f));
    if (rejected.length > 0) {
      setError(`${rejected[0].name} is not a supported file. Accepted: ${accept.join(', ')}`);
      shake.start({ x: [0, -6, 6, -3, 0], transition: { duration: 0.3 } });
      return;
    }
    setError(null);
    onFiles(files);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!disabled) handleFiles(e.dataTransfer.files);
  };

  return (
    <div className={className}>
      <motion.button
        type="button"
        animate={shake}
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        aria-label={label}
        className={`flex min-h-40 w-full flex-col items-center justify-center gap-2 rounded-lg
          border-2 border-dashed p-6 transition-colors duration-fast ease-out
          focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-soft-2
          disabled:pointer-events-none disabled:opacity-40
          ${
            dragOver
              ? 'border-solid border-accent bg-accent-soft'
              : error
                ? 'border-destructive bg-bg-sunken/50'
                : 'border-separator-opaque bg-bg-sunken/50 hover:border-label-4'
          }`}
        style={dragOver ? { scale: 1.01 } : undefined}
        transition={spring.snappy}
      >
        <Upload size={28} strokeWidth={1.5} className={dragOver ? 'text-accent' : 'text-label-3'} />
        <span className="text-headline text-label-1">{label}</span>
        {accept.length > 0 && (
          <span className="text-caption font-normal text-label-3">
            Accepts {accept.join(', ')}
          </span>
        )}
      </motion.button>
      {error && <p className="mt-2 text-caption font-normal text-destructive">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        hidden
        multiple={multiple}
        accept={accept.join(',') || undefined}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}

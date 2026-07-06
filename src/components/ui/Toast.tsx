import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

/**
 * App-wide toaster per design-system.md §6: bottom-center, elevated surface,
 * max 3 stacked, 5s auto-dismiss (errors persist). Mount once at app root.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      visibleToasts={3}
      duration={5000}
      gap={8}
      toastOptions={{
        unstyled: true,
        className:
          'flex w-[380px] max-w-[calc(100vw-32px)] items-start gap-2.5 rounded-md bg-bg-elevated p-3 shadow-3 font-sans',
      }}
    />
  );
}

interface ToastOptions {
  /** Optional callout-size second line. */
  detail?: string;
  /** Single optional action, rendered as an accent text button. */
  action?: { label: string; onClick: () => void };
}

function renderToast(
  icon: React.ReactNode,
  message: string,
  options?: ToastOptions,
  opts?: { duration?: number },
) {
  return sonnerToast.custom(
    (id) => (
      <div className="flex w-[380px] max-w-[calc(100vw-32px)] items-start gap-2.5 rounded-md bg-bg-elevated p-3 shadow-3">
        <span className="mt-px shrink-0">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-headline text-label-1">{message}</p>
          {options?.detail && <p className="mt-0.5 text-callout text-label-2">{options.detail}</p>}
        </div>
        {options?.action && (
          <button
            type="button"
            onClick={() => {
              options.action?.onClick();
              sonnerToast.dismiss(id);
            }}
            className="shrink-0 text-callout font-semibold text-accent hover:text-accent-hover
              focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-soft-2 rounded-xs"
          >
            {options.action.label}
          </button>
        )}
      </div>
    ),
    opts,
  );
}

/** Toast helpers. Not for validation errors (inline them) — see §6. */
export const toast = {
  success: (message: string, options?: ToastOptions) =>
    renderToast(<CheckCircle2 size={17} className="text-success" />, message, options),
  info: (message: string, options?: ToastOptions) =>
    renderToast(<Info size={17} className="text-accent" />, message, options),
  warning: (message: string, options?: ToastOptions) =>
    renderToast(<AlertTriangle size={17} className="text-warning" />, message, options),
  /** Errors persist until dismissed. */
  error: (message: string, options?: ToastOptions) =>
    renderToast(<XCircle size={17} className="text-destructive" />, message, options, {
      duration: Infinity,
    }),
  dismiss: sonnerToast.dismiss,
};

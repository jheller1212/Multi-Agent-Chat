import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

import { exitFade, spring } from '../../lib/motion';

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  /** Right-aligned footer actions (primary rightmost). */
  footer?: ReactNode;
  /** 'modal' centered dialog, or 'side' right-anchored inspector panel. */
  variant?: 'modal' | 'side';
  /** Modal width preset: forms 480px, content 720px. Ignored for side sheets. */
  width?: 'form' | 'content';
  /** Block Esc/scrim dismissal, e.g. while a form is dirty. */
  preventDismiss?: boolean;
}

/**
 * Sheet/modal per design-system.md §6: opaque elevated surface over a
 * blurred scrim; modal enters with the overlay spring, side sheet slides in
 * from the right. Exits are plain fast fades.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  variant = 'modal',
  width = 'form',
  preventDismiss,
}: SheetProps) {
  const guard = preventDismiss ? (e: Event) => e.preventDefault() : undefined;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="material-scrim fixed inset-0 z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.24 } }}
                exit={{ opacity: 0, transition: exitFade }}
              />
            </Dialog.Overlay>
            <Dialog.Content
              asChild
              forceMount
              onEscapeKeyDown={guard}
              onPointerDownOutside={guard}
            >
              {variant === 'modal' ? (
                <motion.div
                  className={`fixed left-1/2 top-1/2 z-50 flex max-h-[85vh] w-[calc(100vw-32px)]
                    ${width === 'form' ? 'max-w-[480px]' : 'max-w-[720px]'}
                    -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg bg-bg-elevated shadow-3`}
                  initial={{ opacity: 0, scale: 0.97, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0, transition: spring.standard }}
                  exit={{ opacity: 0, transition: exitFade }}
                  style={{ x: '-50%', y: '-50%' }}
                >
                  <SheetChrome title={title} description={description} footer={footer}>
                    {children}
                  </SheetChrome>
                </motion.div>
              ) : (
                <motion.div
                  className="fixed bottom-0 right-0 top-0 z-50 flex w-[420px] max-w-[calc(100vw-32px)]
                    flex-col border-l border-separator bg-bg-elevated shadow-3"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0, transition: spring.standard }}
                  exit={{ opacity: 0, transition: exitFade }}
                >
                  <SheetChrome title={title} description={description} footer={footer}>
                    {children}
                  </SheetChrome>
                </motion.div>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

function SheetChrome({
  title,
  description,
  footer,
  children,
}: Pick<SheetProps, 'title' | 'description' | 'footer' | 'children'>) {
  return (
    <>
      <header className="flex items-start justify-between gap-4 px-5 pb-3 pt-4">
        <div className="min-w-0">
          <Dialog.Title className="text-title-3 text-label-1">{title}</Dialog.Title>
          {description ? (
            <Dialog.Description className="mt-1 text-callout text-label-2">
              {description}
            </Dialog.Description>
          ) : (
            // Radix warns if no description is present; keep a11y tree quiet.
            <Dialog.Description className="sr-only">{typeof title === 'string' ? title : 'Dialog'}</Dialog.Description>
          )}
        </div>
        <Dialog.Close
          aria-label="Close"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-label-3
            transition-colors duration-instant ease-out hover:bg-fill-2 hover:text-label-1
            focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent-soft-2"
        >
          <X size={15} />
        </Dialog.Close>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-2">{children}</div>
      {footer && (
        <footer className="flex justify-end gap-2 border-t border-separator px-5 py-3">
          {footer}
        </footer>
      )}
    </>
  );
}

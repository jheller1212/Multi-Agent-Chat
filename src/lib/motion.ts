// Design system v1 motion presets (docs/design-system.md §5).
// Springs for anything spatial; duration/easing only for opacity and color.
import type { Transition } from 'framer-motion';

export const spring = {
  /** Chrome: menus, popovers, toggles, segmented thumb. Fast, no overshoot. */
  snappy: { type: 'spring', stiffness: 480, damping: 38, mass: 0.7 },
  /** Default: cards, list reordering, layout shifts, sheet presentation. */
  standard: { type: 'spring', stiffness: 340, damping: 32, mass: 0.8 },
  /** Large/soft: full-screen transitions, drawers, coachmark spotlight moves. */
  gentle: { type: 'spring', stiffness: 220, damping: 28, mass: 1.0 },
} as const satisfies Record<string, Transition>;

/** Exit fades — exits are always faster than entrances. */
export const exitFade: Transition = { duration: 0.16, ease: [0.25, 0.1, 0.25, 1] };

/** Overlay entrance per §5: opacity + scale 0.97 + y 8px. */
export const overlayEnter = {
  initial: { opacity: 0, scale: 0.97, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0, transition: spring.standard },
  exit: { opacity: 0, transition: exitFade },
} as const;

/** Menu/popover entrance per §5: scale from 0.95 at trigger origin. */
export const menuEnter = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: spring.snappy },
  exit: { opacity: 0, transition: exitFade },
} as const;

// Framer Motion animation variants — reusable across all components.

import type { Variants, Transition } from 'framer-motion';

// ── Spring presets
export const springs = {
  snappy: { type: 'spring', stiffness: 400, damping: 30 } satisfies Transition,
  smooth: { type: 'spring', stiffness: 300, damping: 25 } satisfies Transition,
  bouncy: { type: 'spring', stiffness: 500, damping: 20 } satisfies Transition,
  easeInOut: { duration: 0.2, ease: [0.4, 0, 0.2, 1] } satisfies Transition,
  easeOut:   { duration: 0.15, ease: [0, 0, 0.2, 1] } satisfies Transition,
} as const;

// ── Fade
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: springs.easeInOut },
  exit: { opacity: 0, transition: springs.easeOut },
};

// ── Slide up (panels, modals on mobile)
export const slideUp: Variants = {
  hidden: { y: 16, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: springs.smooth },
  exit: { y: 16, opacity: 0, transition: springs.easeOut },
};

// ── Slide in from right (detail panel, chat preview)
export const slideInRight: Variants = {
  hidden: { x: 60, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: springs.smooth },
  exit: { x: 60, opacity: 0, transition: springs.easeOut },
};

// ── Scale in (dropdowns, popovers)
export const scaleIn: Variants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: springs.snappy },
  exit: { scale: 0.95, opacity: 0, transition: springs.easeOut },
};

// ── Modal (desktop: scale+fade, always)
export const modalVariants: Variants = {
  hidden: { scale: 0.97, opacity: 0, y: 4 },
  visible: { scale: 1, opacity: 1, y: 0, transition: springs.smooth },
  exit: { scale: 0.97, opacity: 0, y: 4, transition: springs.easeOut },
};

// ── Backdrop
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

// ── Stagger children
export const staggerContainer = (delayPerItem = 0.04): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: delayPerItem },
  },
});

// ── Stagger item (used with staggerContainer)
export const staggerItem: Variants = {
  hidden: { y: 12, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: springs.smooth },
};

// ── Shake (form errors)
export const shake: Variants = {
  shake: {
    x: [0, -4, 4, -4, 4, 0],
    transition: { duration: 0.35, ease: 'easeInOut' },
  },
};

// ── Step slide transitions (wizard)
export const stepVariants = {
  enter: (dir: number): Variants['enter'] => ({
    x: dir > 0 ? 40 : -40,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: springs.smooth,
  },
  exit: (dir: number): Variants['exit'] => ({
    x: dir > 0 ? -40 : 40,
    opacity: 0,
    transition: springs.easeOut,
  }),
};

// ── Command palette
export const commandPaletteVariants: Variants = {
  hidden: { scale: 0.97, opacity: 0, y: -8 },
  visible: { scale: 1, opacity: 1, y: 0, transition: springs.snappy },
  exit: { scale: 0.97, opacity: 0, y: -8, transition: springs.easeOut },
};

// ── Height collapse (accordion-like)
export const collapseVariants: Variants = {
  hidden: { height: 0, opacity: 0 },
  visible: { height: 'auto', opacity: 1, transition: springs.smooth },
  exit: { height: 0, opacity: 0, transition: springs.easeOut },
};

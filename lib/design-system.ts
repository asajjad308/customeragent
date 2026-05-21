// Design System Tokens — single source of truth.
// All components consume from here. No hardcoded hex values in components.

export const colors = {
  // ── Neutrals
  bgBase:       'var(--color-bg-base)',
  bgSubtle:     'var(--color-bg-subtle)',
  bgMuted:      'var(--color-bg-muted)',
  bgEmphasis:   'var(--color-bg-emphasis)',
  borderSubtle: 'var(--color-border-subtle)',
  borderDefault:'var(--color-border-default)',
  borderStrong: 'var(--color-border-strong)',
  textPrimary:  'var(--color-text-primary)',
  textSecondary:'var(--color-text-secondary)',
  textTertiary: 'var(--color-text-tertiary)',
  textDisabled: 'var(--color-text-disabled)',

  // ── Accent / Brand
  accent:       'var(--color-accent)',
  accentHover:  'var(--color-accent-hover)',
  accentSubtle: 'var(--color-accent-subtle)',
  accentMuted:  'var(--color-accent-muted)',

  // ── Semantic
  success:        '#16A34A',
  successSubtle:  '#F0FDF4',
  successMuted:   '#BBF7D0',
  warning:        '#D97706',
  warningSubtle:  '#FFFBEB',
  warningMuted:   '#FDE68A',
  danger:         '#DC2626',
  dangerSubtle:   '#FEF2F2',
  dangerMuted:    '#FECACA',
  info:           '#0891B2',
  infoSubtle:     '#ECFEFF',
  infoMuted:      '#A5F3FC',
} as const;

// ── Agent type palette
export const agentTypeColors = {
  SUPPORT:    { base: '#2563EB', subtle: '#EFF6FF', dark: '#1E40AF', label: 'Support' },
  TECHNICAL:  { base: '#0891B2', subtle: '#ECFEFF', dark: '#0E7490', label: 'Technical' },
  SALES:      { base: '#059669', subtle: '#ECFDF5', dark: '#047857', label: 'Sales' },
  LEAD_GEN:   { base: '#D97706', subtle: '#FFFBEB', dark: '#B45309', label: 'Lead Gen' },
  ONBOARDING: { base: '#7C3AED', subtle: '#F5F3FF', dark: '#6D28D9', label: 'Onboarding' },
  HR:         { base: '#DC2626', subtle: '#FEF2F2', dark: '#B91C1C', label: 'HR' },
  BOOKING:    { base: '#0D9488', subtle: '#F0FDFA', dark: '#0F766E', label: 'Booking' },
  CUSTOM:     { base: '#6B7280', subtle: '#F9FAFB', dark: '#4B5563', label: 'Custom' },
} as const;

export const agentStatusColors = {
  ACTIVE:   { base: '#16A34A', subtle: '#F0FDF4', label: 'Active' },
  PAUSED:   { base: '#D97706', subtle: '#FFFBEB', label: 'Paused' },
  DRAFT:    { base: '#6B7280', subtle: '#F9FAFB', label: 'Draft' },
  ARCHIVED: { base: '#DC2626', subtle: '#FEF2F2', label: 'Archived' },
} as const;

export const spacing = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
} as const;

export const radius = {
  sm:   '4px',
  md:   '8px',
  lg:   '12px',
  xl:   '16px',
  '2xl':'24px',
  full: '9999px',
} as const;

export const shadows = {
  xs: '0 1px 2px rgba(0,0,0,0.05)',
  sm: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
  md: '0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.04)',
  lg: '0 10px 15px rgba(0,0,0,0.06), 0 4px 6px rgba(0,0,0,0.04)',
} as const;

export const typography = {
  '2xs': ['10px', { lineHeight: '1.4' }],
  xs:    ['11px', { lineHeight: '1.5' }],
  sm:    ['12px', { lineHeight: '1.6' }],
  base:  ['13px', { lineHeight: '1.6' }],
  md:    ['14px', { lineHeight: '1.5' }],
  lg:    ['16px', { lineHeight: '1.4' }],
  xl:    ['18px', { lineHeight: '1.3' }],
  '2xl': ['22px', { lineHeight: '1.2' }],
  '3xl': ['28px', { lineHeight: '1.1' }],
  '4xl': ['36px', { lineHeight: '1.0' }],
} as const;

export const fontWeights = { regular: 400, medium: 500, semibold: 600 } as const;

export const SIDEBAR_WIDTH = 220;
export const DETAIL_WIDTH = 440;
export const CHAT_PREVIEW_WIDTH = 380;

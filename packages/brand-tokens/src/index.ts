/**
 * Salon Black & White brand tokens — single source of truth for the landing
 * and the panel. Mirrors src/tokens.css 1:1 (enforced by tokens.test.ts).
 * Rules (palette, contrast, typography): .claude/skills/salonbw-brand/SKILL.md
 */
export const color = {
    'brand-black': '#0d0d0d',
    'brand-hero-black': '#080808',
    'brand-surface-dark': '#181819',
    'brand-white': '#ffffff',
    'brand-silver': '#b4b8be',
    'brand-silver-dark': '#8e9298',
    'brand-silver-ink': '#6e7278',
    'brand-silver-on-dark': '#b9bcc1',
    'brand-warm-ink': '#23252a',
    'brand-warm-deep': '#31343a',
    'brand-warm-soft': '#4d5158',
    'brand-warm-secondary': '#595d64',
    'brand-warm-muted': '#5f6369',
    'brand-warm-label': '#5f6369',
    'brand-warm-bg': '#f6f6f7',
    'brand-warm-bg-2': '#eff0f1',
    'brand-warm-bg-3': '#e4e5e8',
    'brand-warm-border': '#e6e7ea',
    'brand-rule': '#d9dadd',
    'state-error': '#e35a5a',
    'state-error-on-light': '#b3261e',
} as const;

export const whiteOnDark = {
    'white-label': 'rgba(255, 255, 255, 0.55)',
    'white-muted': 'rgba(255, 255, 255, 0.6)',
    'white-soft': 'rgba(255, 255, 255, 0.65)',
    'white-strong': 'rgba(255, 255, 255, 0.75)',
} as const;

export const scrim = {
    'scrim-strong': 'rgba(13, 13, 13, 0.88)',
    'scrim-soft': 'rgba(13, 13, 13, 0.55)',
} as const;

export const tracking = {
    'tracking-label': '0.08em',
    'tracking-cta': '0.14em',
    'tracking-eyebrow': '0.2em',
} as const;

export const font = {
    'font-display': "var(--font-playfair), 'Playfair Display', Georgia, serif",
    'font-body': "var(--font-open-sans), 'Open Sans', Arial, Helvetica, sans-serif",
} as const;

export const layout = {
    'page-gutter': 'max(1rem, 5vw, calc((100vw - 1540px) / 2))',
    'page-max': '1400px',
} as const;

export const type = {
    'text-label': '0.72rem',
    'text-small': '0.875rem',
    'text-body': '1rem',
    'text-lead': 'clamp(1.05rem, 0.5vw + 0.9rem, 1.25rem)',
    'text-h3': 'clamp(1.5rem, 2vw + 0.75rem, 2.75rem)',
    'text-h2': 'clamp(2.2rem, 3.6vw + 0.6rem, 4.5rem)',
    'text-h1': 'clamp(2.8rem, 5.4vw + 0.6rem, 7.25rem)',
    'text-display': 'clamp(3.4rem, 7.2vw + 0.6rem, 11rem)',
} as const;

export const space = {
    'space-section': 'clamp(4.5rem, 8vw, 7rem)',
    'space-block': 'clamp(2rem, 4vw, 3.5rem)',
} as const;

export const shape = {
    'radius-sharp': '2px',
    'shadow-soft': '0 8px 20px rgba(0, 0, 0, 0.18)',
} as const;

export const motion = {
    'duration-fast': '150ms',
    'duration-base': '250ms',
    'ease-out': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
} as const;

export const tokens = {
    ...color, ...whiteOnDark, ...scrim, ...tracking, ...font, ...layout, ...type, ...space, ...shape, ...motion,
} as const;
export type TokenName = keyof typeof tokens;

/** CSS custom-property reference, e.g. cssVar('brand-black') → 'var(--brand-black)'. */
export const cssVar = (name: TokenName): string => `var(--${name})`;

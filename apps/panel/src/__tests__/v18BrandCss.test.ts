import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// The approved palette and typography live in .claude/skills/salonbw-brand/SKILL.md.
const stylesDir = join(__dirname, '..', 'styles');
const files = readdirSync(stylesDir).filter((file) =>
    /^V18.*[.]module[.]css$/.test(file),
);

const contrast = (first: string, second: string) => {
    const luminance = (color: string) => {
        const rgb = [1, 3, 5].map((i) =>
            parseInt(color.slice(i, i + 2), 16) / 255,
        );
        const linear = rgb.map((value) =>
            value <= 0.04045
                ? value / 12.92
                : ((value + 0.055) / 1.055) ** 2.4,
        );
        return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
    };
    const a = luminance(first);
    const b = luminance(second);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

describe('V18 brand CSS contract', () => {
    it('checks every V18 CSS module', () => {
        expect(files).toHaveLength(17);
    });

    it.each(files)('%s uses monochrome tokens and no gradients or Inter', (file) => {
        const css = readFileSync(join(stylesDir, file), 'utf8');
        expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
        expect(css).not.toMatch(/%23(?!6e7278)[0-9a-f]{3,8}/i);
        expect(css).not.toMatch(/(?:linear|radial|conic)-gradient\s*\(/i);
        expect(css).not.toMatch(/\bInter\b/);
        expect(css).toContain('var(--salon-');
    });

    it('preserves contrast for primary silver controls and muted text', () => {
        expect(contrast('#1a1a1a', '#b4b8be')).toBeGreaterThanOrEqual(4.5);
        expect(contrast('#1a1a1a', '#8e9298')).toBeGreaterThanOrEqual(4.5);
        expect(contrast('#6b7280', '#ffffff')).toBeGreaterThanOrEqual(4.5);
        const css = readFileSync(join(stylesDir, 'V18BookingDrawer.module.css'), 'utf8');
        expect(css).toContain('background: var(--salon-accent)');
        expect(css).toContain('color: var(--salon-text)');
        expect(css).toContain('Playfair Display');
        expect(css).toContain('Open Sans');
    });

    it('uses non-color cues for distinguishable appointment states', () => {
        const css = readFileSync(join(stylesDir, 'V18Calendar.module.css'), 'utf8');
        for (const status of [
            'confirmed',
            'in_progress',
            'online_pending',
            'rescheduled_pending',
            'completed',
            'cancelled',
            'no_show',
        ]) {
            expect(css).toContain("data-appointment-status='" + status + "'");
        }
        expect(css).toContain('border-left-style: dashed');
        expect(css).toContain('border-left-style: double');
        expect(css).toContain('border-left-style: dotted');
    });
});

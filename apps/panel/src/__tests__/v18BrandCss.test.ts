import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// The approved palette and typography live in .claude/skills/salonbw-brand/SKILL.md.
const stylesDir = join(__dirname, '..', 'styles');
const files = readdirSync(stylesDir).filter((file) =>
    /^V18.*[.]module[.]css$/.test(file),
);

const contrast = (first: string, second: string) => {
    const channel = (color: string, position: number) =>
        Number.parseInt(color.slice(position, position + 2), 16) / 255;
    const gamma = (value: number) =>
        value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    const luminance = (color: string) => {
        const red = gamma(channel(color, 1));
        const green = gamma(channel(color, 3));
        const blue = gamma(channel(color, 5));
        return red * 0.2126 + green * 0.7152 + blue * 0.0722;
    };
    const a = luminance(first);
    const b = luminance(second);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

describe('V18 brand CSS contract', () => {
    it('checks every V18 CSS module', () => {
        expect(files).toHaveLength(18);
    });

    for (const file of files) {
        it(file + ' uses monochrome tokens, without gradients or Inter', () => {
            const css = readFileSync(join(stylesDir, file), 'utf8');
            expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
            expect(css).not.toMatch(/%23(?!6e7278)[0-9a-f]{3,8}/i);
            expect(css).not.toMatch(/(?:linear|radial|conic)-gradient\s*\(/i);
            expect(css).not.toMatch(/\bInter\b/);
            expect(css).toContain('var(--salon-');
        });
    }

    it('preserves contrast for primary silver controls and muted text', () => {
        expect(contrast('#1a1a1a', '#b4b8be')).toBeGreaterThanOrEqual(4.5);
        expect(contrast('#1a1a1a', '#8e9298')).toBeGreaterThanOrEqual(4.5);
        expect(contrast('#6b7280', '#ffffff')).toBeGreaterThanOrEqual(4.5);
        expect(contrast('#b4b8be', '#1a1a1a')).toBeGreaterThanOrEqual(4.5);
        const css = readFileSync(
            join(stylesDir, 'V18BookingDrawer.module.css'),
            'utf8',
        );
        expect(css).toContain('background: var(--salon-accent)');
        expect(css).toContain('color: var(--salon-text)');
        expect(css).toContain('Playfair Display');
        expect(css).toContain('Open Sans');
    });

    it('uses non-color cues for distinguishable appointment states', () => {
        const css = readFileSync(
            join(stylesDir, 'V18Calendar.module.css'),
            'utf8',
        );
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

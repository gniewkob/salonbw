import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Studio V18 is monochrome-first with vivid functional color. No landing,
// legacy calendar or production stylesheet should be changed by this contract.
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

describe('V18 Black & White + Vivid Colors contract', () => {
    it('includes every existing V18 CSS module', () => {
        expect(files).toHaveLength(18);
    });

    for (const file of files) {
        it(file + ' stays scoped to existing Studio V18 tokens', () => {
            const css = readFileSync(join(stylesDir, file), 'utf8');
            // The foundation alone declares raw palette values; other
            // modules inherit them instead of inventing pastel shades.
            if (file !== 'V18Foundation.module.css') {
                expect(css).not.toMatch(/#[0-9a-f]{3,8}\b/i);
            }
            expect(css).not.toMatch(/%23(?!6e7278)[0-9a-f]{3,8}/i);
            expect(css).not.toMatch(/(?:linear|radial|conic)-gradient\s*\(/i);
            expect(css).toContain('var(--salon-');
        });
    }

    it('keeps the dashboard and calendar on the same monochrome base', () => {
        const reference = readFileSync(
            join(stylesDir, 'StudioV18.module.css'),
            'utf8',
        );
        const foundation = readFileSync(
            join(stylesDir, 'V18Foundation.module.css'),
            'utf8',
        );
        for (const token of [
            '--v18-canvas: #f5f5f5;',
            '--v18-ink: #171717;',
            '--v18-accent: #1d4ed8;',
            '--v18-status-confirmed: #15803d;',
            '--v18-status-progress: #1d4ed8;',
            '--v18-status-pending: #d97706;',
            '--v18-status-rescheduled: #6d28d9;',
            '--v18-status-no-show: #b91c1c;',
        ]) {
            expect(reference).toContain(token);
            expect(foundation).toContain(token);
        }
        for (const moduleName of [
            'V18Foundation.module.css',
            'V18Calendar.module.css',
            'V18BookingDrawer.module.css',
        ]) {
            const css = readFileSync(join(stylesDir, moduleName), 'utf8');
            expect(css).toContain('font-family: Inter');
        }
        // Main actions remain black and white. Only status, focus and
        // selected functional affordances carry saturated colors.
        expect(foundation).toContain('--salon-accent: var(--v18-ink)');
        expect(foundation).toContain('color: var(--v18-paper)');
        expect(contrast('#ffffff', '#171717')).toBeGreaterThanOrEqual(7);
        expect(contrast('#ffffff', '#525252')).toBeGreaterThanOrEqual(4.5);
        expect(contrast('#ffffff', '#1d4ed8')).toBeGreaterThanOrEqual(4.5);
    });

    it('has no pastel literal colors in the Studio dashboard', () => {
        const css = readFileSync(
            join(stylesDir, 'StudioV18.module.css'),
            'utf8',
        );
        const approvedVivid = new Set([
            '#1d4ed8',
            '#15803d',
            '#d97706',
            '#6d28d9',
            '#52525b',
            '#737373',
            '#b91c1c',
            '#facc15',
            '#16a34a',
            '#b45309',
            '#a21caf',
            '#be123c',
            '#166534',
            '#0e7490',
        ]);
        for (const [raw] of css.matchAll(/#[0-9a-f]{3,6}\b/gi)) {
            const hex = raw.toLowerCase();
            if (approvedVivid.has(hex)) continue;
            const full =
                hex.length === 4
                    ? '#' +
                      hex
                          .slice(1)
                          .split('')
                          .map((part) => part + part)
                          .join('')
                    : hex;
            expect(full.slice(1, 3)).toBe(full.slice(3, 5));
            expect(full.slice(3, 5)).toBe(full.slice(5, 7));
        }
        expect(css).toContain('background: #171717;');
        expect(css).toContain('background: var(--v18-accent);');
    });

    it('uses monochrome booking buttons with readable labels', () => {
        const css = readFileSync(
            join(stylesDir, 'V18BookingDrawer.module.css'),
            'utf8',
        );
        expect(css).toContain('background: var(--salon-accent)');
        expect(css).toContain('color: var(--v18-paper)');
        expect(css).toContain('font-family: Inter');
    });

    it('distinguishes appointments using saturated borders and non-color cues', () => {
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
        for (const token of [
            '--v18-status-confirmed',
            '--v18-status-progress',
            '--v18-status-pending',
            '--v18-status-rescheduled',
            '--v18-status-completed',
            '--v18-status-cancelled',
            '--v18-status-no-show',
        ]) {
            expect(css).toContain('var(' + token + ')');
        }
        expect(css).toContain('background-color: var(--v18-paper)');
        expect(css).toContain('border-left-style: dashed');
        expect(css).toContain('border-left-style: double');
        expect(css).toContain('border-left-style: dotted');
        expect(css).not.toContain('background-color: var(--v18-lavender)');
        expect(css).not.toContain('background-color: var(--v18-blush)');
        expect(css).not.toContain('background-color: var(--v18-sage)');
    });
});

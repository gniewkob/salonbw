import {
    DEV_PANEL_ACCESS_END_MS,
    DEV_PANEL_ACCESS_START_MS,
    isDevPanelPreviewWindow,
} from '@/utils/temporaryDevPanelAccess';

describe('time-limited development panel preview', () => {
    const dev = {
        APP_ENV: 'development',
        NEXT_PUBLIC_DEPLOYMENT_ENV: 'development',
    };
    const host = 'dev-panel.salon-bw.pl';

    it('is active for the exact panel host during its window', () => {
        expect(
            isDevPanelPreviewWindow(host, dev, DEV_PANEL_ACCESS_START_MS),
        ).toBe(true);
        expect(
            isDevPanelPreviewWindow(
                'DEV-PANEL.SALON-BW.PL',
                dev,
                DEV_PANEL_ACCESS_START_MS + 1,
            ),
        ).toBe(true);
        expect(
            isDevPanelPreviewWindow(
                host + ':443',
                dev,
                DEV_PANEL_ACCESS_END_MS - 1,
            ),
        ).toBe(true);
    });

    it('closes automatically at the precise expiry and stays closed', () => {
        expect(
            isDevPanelPreviewWindow(host, dev, DEV_PANEL_ACCESS_START_MS - 1),
        ).toBe(false);
        expect(
            isDevPanelPreviewWindow(host, dev, DEV_PANEL_ACCESS_END_MS),
        ).toBe(false);
        expect(
            isDevPanelPreviewWindow(host, dev, DEV_PANEL_ACCESS_END_MS + 1000),
        ).toBe(false);
        expect(isDevPanelPreviewWindow(host, dev, Number.NaN)).toBe(false);
    });

    it('does not affect production or sibling API and landing hosts', () => {
        for (const otherHost of [
            'panel.salon-bw.pl',
            'dev-api.salon-bw.pl',
            'api.salon-bw.pl',
            'dev.salon-bw.pl',
            'dev-panel.salon-bw.pl.evil.invalid',
            undefined,
        ]) {
            expect(
                isDevPanelPreviewWindow(
                    otherHost,
                    dev,
                    DEV_PANEL_ACCESS_START_MS,
                ),
            ).toBe(false);
        }
        expect(
            isDevPanelPreviewWindow(
                host,
                { ...dev, APP_ENV: 'production' },
                DEV_PANEL_ACCESS_START_MS,
            ),
        ).toBe(false);
        expect(
            isDevPanelPreviewWindow(
                host,
                {
                    ...dev,
                    NEXT_PUBLIC_DEPLOYMENT_ENV: 'production',
                },
                DEV_PANEL_ACCESS_START_MS,
            ),
        ).toBe(false);
        expect(
            isDevPanelPreviewWindow(host, {}, DEV_PANEL_ACCESS_START_MS),
        ).toBe(false);
    });
});

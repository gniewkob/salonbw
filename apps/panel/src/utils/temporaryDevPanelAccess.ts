/**
 * Temporary owner-approved access window for the development panel.
 * This never grants an application session and never applies to the API host.
 * Expiration is checked on each request; no cron or background job required.
 */
export const DEV_PANEL_ACCESS_START_MS = Date.parse('2026-11-04T17:15:00.000Z');
export const DEV_PANEL_ACCESS_END_MS = Date.parse('2026-11-11T17:15:00.000Z');

export function isDevPanelPreviewWindow(
    hostHeader: string | undefined,
    environment: Record<string, string | undefined>,
    now: number = Date.now(),
): boolean {
    const host = hostHeader?.toLowerCase().split(':')[0];
    return (
        environment.APP_ENV === 'development' &&
        environment.NEXT_PUBLIC_DEPLOYMENT_ENV === 'development' &&
        host === 'dev-panel.salon-bw.pl' &&
        Number.isFinite(now) &&
        now >= DEV_PANEL_ACCESS_START_MS &&
        now < DEV_PANEL_ACCESS_END_MS
    );
}

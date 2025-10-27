import type { NextWebVitalsMetric } from 'next/app';
import * as Sentry from '@sentry/nextjs';

export function isAnalyticsEnabled(): boolean {
    return (
        typeof window !== 'undefined' &&
        process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true' &&
        !!process.env.NEXT_PUBLIC_GA_ID
    );
}

export function getGAId(): string {
    return process.env.NEXT_PUBLIC_GA_ID || '';
}

declare global {
    interface Window {
        gtag: (...args: any[]) => void;
        dataLayer: any[];
    }
}

export function pageview(url: string) {
    if (!isAnalyticsEnabled()) return;
    try {
        window.gtag('event', 'page_view', {
            page_location: url,
        });
    } catch {
        // ignore
    }
}

export function sendWebVital(metric: NextWebVitalsMetric) {
    // Sentry metrics (best-effort)
    try {
        // @ts-ignore optional API in Sentry SDK v8+
        if (Sentry.metrics && typeof Sentry.metrics.distribution === 'function') {
            // Use a stable metric name, e.g. web_vital.LCP
            // CLS is scaled to ms like GA convention below
            const value = metric.name === 'CLS' ? metric.value * 1000 : metric.value;
            // @ts-ignore
            Sentry.metrics.distribution(`web_vital.${metric.name}`, value, {
                tags: { id: metric.id },
            });
        }
    } catch {
        // ignore
    }

    // Google Analytics 4 (best-effort)
    if (!isAnalyticsEnabled()) return;
    try {
        const value = metric.name === 'CLS' ? Math.round(metric.value * 1000) : Math.round(metric.value);
        window.gtag('event', metric.name, {
            // Recommended mapping for GA4 custom events
            value,
            event_label: metric.id,
            non_interaction: true,
        });
    } catch {
        // ignore
    }
}


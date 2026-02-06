'use client';
import type { AppProps, NextWebVitalsMetric } from 'next/app';
import { useEffect, useState } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import '@/styles/globals.css';
// Versum UI CSS (from vendored calendar)
import '../../public/versum-calendar/assets/new-ui-9cfd3fdff9f46796405002ac31d294d5bf69241e972905313e73767abe10af07.css';
import '../../public/versum-calendar/javascripts/new/style-d5194205877fdbcc0f7b046384512047.css';
// Keep custom overrides
import '@/styles/versum-shell.css';
import RouteProgress from '@/components/RouteProgress';
import VersumSvgSprites from '@/components/versum/VersumSvgSprites';
import { initSentry } from '@/sentry.client';
import {
    isAnalyticsEnabled,
    pageview,
    getGAId,
    sendWebVital,
    trackEvent,
} from '@/utils/analytics';
import { logClientError } from '@/utils/logClient';

// Initialize Sentry once (no-op if DSN is not set)
initSentry();

export default function MyApp({ Component, pageProps }: AppProps) {
    const router = useRouter();
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 60_000,
                        refetchOnWindowFocus: false,
                    },
                },
            }),
    );

    // Track client-side route changes for GA4 when analytics is enabled
    useEffect(() => {
        if (!isAnalyticsEnabled()) return;
        const handleRouteChange = (url: string) => pageview(url);
        router.events.on('routeChangeComplete', handleRouteChange);
        return () => {
            router.events.off('routeChangeComplete', handleRouteChange);
        };
    }, [router.events]);

    // Prefetch booking flow assets
    useEffect(() => {
        void router.prefetch('/appointments');
    }, [router]);

    // Scroll-depth analytics (25/50/75/100) per route — run only in browser
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!isAnalyticsEnabled()) return;
        const { handler, cleanup } = setupScrollDepthTracker(router.asPath);
        window.addEventListener('scroll', handler, { passive: true });
        handler();
        return cleanup;
        // re-arm on route change
    }, [router.asPath]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handleError = (event: ErrorEvent) => {
            void logClientError({
                message: event.message,
                stack: event.error?.stack ?? event.filename,
                path: router.asPath,
                level: 'error',
                extra: { colno: event.colno, lineno: event.lineno },
            });
        };
        const handleRejection = (event: PromiseRejectionEvent) => {
            const reason = event.reason as {
                message?: string;
                stack?: string;
            };
            void logClientError({
                message:
                    reason?.message ??
                    (typeof event.reason === 'string'
                        ? event.reason
                        : 'Unhandled rejection'),
                stack: reason?.stack,
                path: router.asPath,
                level: 'error',
            });
        };
        window.addEventListener('error', handleError);
        window.addEventListener('unhandledrejection', handleRejection);
        return () => {
            window.removeEventListener('error', handleError);
            window.removeEventListener('unhandledrejection', handleRejection);
        };
    }, [router.asPath]);

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <ToastProvider>
                    <VersumSvgSprites />
                    {isAnalyticsEnabled() && (
                        <>
                            {/* GA4 loader */}
                            <Script
                                src={`https://www.googletagmanager.com/gtag/js?id=${getGAId()}`}
                                strategy="afterInteractive"
                            />
                            <Script id="ga4-init" strategy="afterInteractive">
                                {`
                                    window.dataLayer = window.dataLayer || [];
                                    function gtag(){dataLayer.push(arguments);}
                                    gtag('js', new Date());
                                    gtag('config', '${getGAId()}', { send_page_view: false, anonymize_ip: true });
                                `}
                            </Script>
                        </>
                    )}
                    <RouteProgress />
                    <Component {...pageProps} />
                </ToastProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
}

// Forward Web Vitals to Sentry/GA when enabled.
export function reportWebVitals(metric: NextWebVitalsMetric) {
    try {
        sendWebVital(metric);
    } catch {
        // non-fatal
    }
}

const SCROLL_THRESHOLDS = [25, 50, 75, 100];

function setupScrollDepthTracker(path: string) {
    const fired = new Set<number>();
    const handler = () => {
        const doc = document.documentElement;
        const scrollTop = window.scrollY || doc.scrollTop || 0;
        const height = doc.scrollHeight - doc.clientHeight;
        if (height <= 0) return;
        const pct = Math.min(100, Math.round((scrollTop / height) * 100));
        for (const threshold of SCROLL_THRESHOLDS) {
            if (pct < threshold || fired.has(threshold)) continue;
            fired.add(threshold);
            try {
                trackEvent('scroll_depth', { percent: threshold, path });
            } catch {
                // ignore analytics failure
            }
        }
    };

    return {
        handler,
        cleanup: () => window.removeEventListener('scroll', handler),
    };
}

import type { AppProps, NextWebVitalsMetric } from 'next/app';
import { useEffect, useState } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import '@/styles/globals.css';
import RouteProgress from '@/components/RouteProgress';
import { playfair, openSans } from '@/lib/fonts';
import { initSentry } from '@/sentry.client';
import {
    isAnalyticsConfigured,
    isAnalyticsEnabled,
    pageview,
    getGAId,
    sendWebVital,
    trackEvent,
} from '@/utils/analytics';
import BookNowFab from '@/components/BookNowFab';
import CookieConsent from '@/components/CookieConsent';
import { hasAnalyticsConsent } from '@/utils/consent';
import { logClientError } from '@/utils/logClient';

// Initialize Sentry once (no-op if DSN is not set)
initSentry();

export default function MyApp({ Component, pageProps }: AppProps) {
    const router = useRouter();
    // Consent Mode v2, basic mode: gtag.js is only ever loaded after the
    // visitor grants analytics consent. null until read on the client.
    const [analyticsConsent, setAnalyticsConsent] = useState(false);
    useEffect(() => {
        setAnalyticsConsent(hasAnalyticsConsent());
    }, []);
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
        // analyticsConsent: re-attach once the visitor accepts the banner
    }, [router.events, analyticsConsent]);

    // Scroll-depth analytics (25/50/75/100) per route — run only in browser
    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (!isAnalyticsEnabled()) return;
        const { handler, cleanup } = setupScrollDepthTracker(router.asPath);
        window.addEventListener('scroll', handler, { passive: true });
        handler();
        return cleanup;
        // re-arm on route change or when consent is granted mid-visit
    }, [router.asPath, analyticsConsent]);

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
        <div className={`${playfair.variable} ${openSans.variable}`}>
        <LanguageProvider>
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <ToastProvider>
                    {isAnalyticsConfigured() && analyticsConsent && (
                        <>
                            {/* GA4 loader — mounts only after consent */}
                            <Script
                                src={`https://www.googletagmanager.com/gtag/js?id=${getGAId()}`}
                                strategy="afterInteractive"
                            />
                            <Script id="ga4-init" strategy="afterInteractive">
                                {`
                                    window.dataLayer = window.dataLayer || [];
                                    function gtag(){dataLayer.push(arguments);}
                                    gtag('consent', 'default', {
                                        ad_storage: 'denied',
                                        ad_user_data: 'denied',
                                        ad_personalization: 'denied',
                                        analytics_storage: 'granted'
                                    });
                                    gtag('js', new Date());
                                    gtag('config', '${getGAId()}', { send_page_view: false, anonymize_ip: true });
                                `}
                            </Script>
                        </>
                    )}
                    {isAnalyticsConfigured() && (
                        <CookieConsent onDecision={setAnalyticsConsent} />
                    )}
                    <RouteProgress />
                    <BookNowFab />
                    <Component {...pageProps} />
                </ToastProvider>
            </AuthProvider>
        </QueryClientProvider>
        </LanguageProvider>
        </div>
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

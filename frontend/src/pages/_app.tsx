'use client';
import type { AppProps, NextWebVitalsMetric } from 'next/app';
import { useEffect, useState } from 'react';
import Script from 'next/script';
import { useRouter } from 'next/router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import '@/styles/globals.css';
import RouteProgress from '@/components/RouteProgress';
import { initSentry } from '@/sentry.client';
import {
    isAnalyticsEnabled,
    pageview,
    getGAId,
    sendWebVital,
    trackEvent,
} from '@/utils/analytics';
import BookNowFab from '@/components/BookNowFab';

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
        const thresholds = [25, 50, 75, 100];
        const fired = new Set<number>();
        const onScroll = () => {
            const doc = document.documentElement;
            const scrollTop = window.scrollY || (doc && doc.scrollTop) || 0;
            const height = (doc && doc.scrollHeight - doc.clientHeight) || 0;
            if (height <= 0) return;
            const pct = Math.min(100, Math.round((scrollTop / height) * 100));
            for (const t of thresholds) {
                if (pct >= t && !fired.has(t)) {
                    fired.add(t);
                    try {
                        trackEvent('scroll_depth', {
                            percent: t,
                            path: router.asPath,
                        });
                    } catch {}
                }
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
        // re-arm on route change
    }, [router.asPath]);

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <ToastProvider>
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
                    <BookNowFab />
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

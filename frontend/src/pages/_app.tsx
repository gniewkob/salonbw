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
import { isAnalyticsEnabled, pageview, getGAId, sendWebVital } from '@/utils/analytics';
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
        router.prefetch('/appointments');
    }, [router]);

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
    } catch (e) {
        // non-fatal
    }
}

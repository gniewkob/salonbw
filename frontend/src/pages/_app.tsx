import type { AppProps } from 'next/app';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import '@/styles/globals.css';
import RouteProgress from '@/components/RouteProgress';
import { initSentry } from '@/sentry.client';

// Initialize Sentry once (no-op if DSN is not set)
initSentry();

export default function MyApp({ Component, pageProps }: AppProps) {
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
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <ToastProvider>
                    <RouteProgress />
                    <Component {...pageProps} />
                </ToastProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
}

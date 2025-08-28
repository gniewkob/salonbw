import type { AppProps } from 'next/app';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import '@/styles/globals.css';
import RouteProgress from '@/components/RouteProgress';
import { initSentry } from '@/sentry.client';

// Initialize Sentry once (no-op if DSN is not set)
initSentry();

export default function MyApp({ Component, pageProps }: AppProps) {
    return (
        <AuthProvider>
            <ToastProvider>
                <RouteProgress />
                <Component {...pageProps} />
            </ToastProvider>
        </AuthProvider>
    );
}

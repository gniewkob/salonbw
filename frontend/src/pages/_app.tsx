import type { AppProps } from 'next/app';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import '@/styles/globals.css';
import RouteProgress from '@/components/RouteProgress';

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

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

/**
 * Hook do śledzenia zmian strony (PAJAX-like loading)
 * Używa eventów Next.js Pages Router do wykrywania nawigacji
 */
export function usePajaxLoading() {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const clearPendingTimeout = () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };

        const handleStart = () => {
            clearPendingTimeout();
            setIsLoading(true);
        };

        const handleComplete = () => {
            clearPendingTimeout();
            timeoutRef.current = setTimeout(() => {
                setIsLoading(false);
                timeoutRef.current = null;
            }, 150);
        };

        router.events.on('routeChangeStart', handleStart);
        router.events.on('routeChangeComplete', handleComplete);
        router.events.on('routeChangeError', handleComplete);

        return () => {
            clearPendingTimeout();
            router.events.off('routeChangeStart', handleStart);
            router.events.off('routeChangeComplete', handleComplete);
            router.events.off('routeChangeError', handleComplete);
        };
    }, [router.events]);

    return isLoading;
}

/**
 * Hook do prefetchowania stron na hover (jak w source UI)
 */
export function usePrefetchOnHover() {
    const router = useRouter();
    const prefetchedUrlsRef = useRef<Set<string>>(new Set());

    const prefetch = (url: string) => {
        if (!prefetchedUrlsRef.current.has(url)) {
            prefetchedUrlsRef.current.add(url);
            void router.prefetch(url);
        }
    };

    return { prefetch, prefetchedUrls: prefetchedUrlsRef.current };
}

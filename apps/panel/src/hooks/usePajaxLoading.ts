import { useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Hook do śledzenia zmian strony (PAJAX-like loading)
 * Używa Next.js routera do wykrywania nawigacji
 */
export function usePajaxLoading() {
    const [isLoading, setIsLoading] = useState(false);
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Rozpocznij loading
        setIsLoading(true);

        // Zakończ loading po krótkim opóźnieniu (symulacja transition)
        const timer = setTimeout(() => {
            setIsLoading(false);
        }, 150);

        return () => clearTimeout(timer);
    }, [pathname, searchParams]);

    return isLoading;
}

/**
 * Hook do prefetchowania stron na hover (jak w Versum)
 */
export function usePrefetchOnHover() {
    const [prefetchedUrls, setPrefetchedUrls] = useState<Set<string>>(
        new Set(),
    );

    const prefetch = (url: string) => {
        if (!prefetchedUrls.has(url)) {
            setPrefetchedUrls((prev) => new Set(prev).add(url));
            // Next.js Link automatycznie prefetchuje
        }
    };

    return { prefetch, prefetchedUrls };
}

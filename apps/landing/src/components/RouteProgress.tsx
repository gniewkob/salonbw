import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function RouteProgress() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const start = () => setLoading(true);
        const done = () => setLoading(false);
        router.events.on('routeChangeStart', start);
        router.events.on('routeChangeComplete', done);
        router.events.on('routeChangeError', done);
        return () => {
            router.events.off('routeChangeStart', start);
            router.events.off('routeChangeComplete', done);
            router.events.off('routeChangeError', done);
        };
    }, [router.events]);

    if (!loading) return null;
    return (
        <div className="fixed top-0 left-0 right-0 h-1 bg-brand-gold animate-pulse z-50" />
    );
}

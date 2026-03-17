import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function StocktakingsRedirect() {
    const router = useRouter();
    useEffect(() => {
        void router.replace('/inventory');
    }, [router]);
    return null;
}

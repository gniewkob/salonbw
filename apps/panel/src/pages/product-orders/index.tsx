import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ProductOrdersRedirect() {
    const router = useRouter();
    useEffect(() => {
        void router.replace('/orders');
    }, [router]);
    return null;
}

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SuppliersRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        void router.replace('/warehouse/suppliers');
    }, [router]);

    return null;
}

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function LegacyAdminServicesPage() {
    const router = useRouter();

    useEffect(() => {
        void router.replace('/services');
    }, [router]);

    return null;
}

import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function LegacyAdminCommunicationsPage() {
    const router = useRouter();

    useEffect(() => {
        void router.replace('/communication');
    }, [router]);

    return null;
}

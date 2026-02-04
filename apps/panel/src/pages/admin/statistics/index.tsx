import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function LegacyAdminStatisticsPage() {
    const router = useRouter();

    useEffect(() => {
        void router.replace('/statistics');
    }, [router]);

    return null;
}

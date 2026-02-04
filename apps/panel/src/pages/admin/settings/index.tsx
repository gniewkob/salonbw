import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function LegacyAdminSettingsPage() {
    const router = useRouter();

    useEffect(() => {
        void router.replace('/settings');
    }, [router]);

    return null;
}

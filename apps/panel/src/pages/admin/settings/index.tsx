import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AdminSettingsIndexPage() {
    const router = useRouter();

    useEffect(() => {
        void router.replace('/admin/settings/company');
    }, [router]);

    return null;
}

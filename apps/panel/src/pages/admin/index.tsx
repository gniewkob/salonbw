import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AdminIndexPage() {
    const router = useRouter();

    useEffect(() => {
        void router.replace('/admin/branches');
    }, [router]);

    return null;
}

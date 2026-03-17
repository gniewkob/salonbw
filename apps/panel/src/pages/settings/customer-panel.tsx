import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function CustomerPanelRedirect() {
    const router = useRouter();
    useEffect(() => {
        void router.replace('/settings/online-booking');
    }, [router]);
    return null;
}

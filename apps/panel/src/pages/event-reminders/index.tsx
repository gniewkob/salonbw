import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function EventRemindersRedirect() {
    const router = useRouter();

    useEffect(() => {
        void router.replace('/settings/reminders');
    }, [router]);

    return null;
}

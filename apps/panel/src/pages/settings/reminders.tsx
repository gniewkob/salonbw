import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SettingsRemindersRedirectPage() {
    const router = useRouter();

    useEffect(() => {
        void router.replace('/event-reminders');
    }, [router]);

    return null;
}

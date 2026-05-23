import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function NewsletterNewPage() {
    const router = useRouter();
    useEffect(() => {
        void router.replace('/messages?new=1');
    }, [router]);
    return null;
}

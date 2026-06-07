import Head from 'next/head';
import Forbidden from '@/components/Forbidden';

export default function ForbiddenPage() {
    return (
        <>
            <Head>
                <title>403 — Brak dostępu | Salon Black &amp; White</title>
                <meta name="robots" content="noindex" />
            </Head>
            <Forbidden />
        </>
    );
}

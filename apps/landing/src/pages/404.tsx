import Head from 'next/head';
import Link from 'next/link';
import PublicLayout from '@/components/PublicLayout';
import PageHero from '@/components/page/PageHero';
import { getPanelUrl } from '@/utils/panelUrl';
import { useLanguage } from '@/contexts/LanguageContext';

export default function NotFound() {
    const { T } = useLanguage();
    // The panel's /booking guard handles authentication and preserves the intended booking route.
    const bookingUrl = getPanelUrl('/booking');
    return (
        <PublicLayout>
            <Head>
                <title>404 — Nie znaleziono strony | Black & White</title>
                <meta name="robots" content="noindex" />
            </Head>
            <PageHero
                eyebrow="Strona nie istnieje"
                title="Zgubiłaś się?"
                lead="Ta strona nie istnieje, ale nasz salon jest zawsze na miejscu."
                decor="404"
                fill
                actions={
                    <>
                        <Link href="/" className="bw-btn bw-btn--primary">
                            Wróć na stronę główną
                        </Link>
                        <a
                            href={bookingUrl}
                            className="bw-btn bw-btn--on-dark"
                            data-booking-cta
                        >
                            {T.nav.booking}
                        </a>
                    </>
                }
            />
        </PublicLayout>
    );
}

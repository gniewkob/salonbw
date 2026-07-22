import Head from 'next/head';
import PublicLayout from '@/components/PublicLayout';
import LegalArticle from '@/components/LegalArticle';
import { useLanguage } from '@/contexts/LanguageContext';
import { LEGAL } from '@/i18n/legalContent';
import { OG_LOCALE } from '@/i18n/serviceDetail';
import { absUrl } from '@/utils/seo';

export default function DataDeletionPage() {
    const { lang } = useLanguage();
    const doc = LEGAL[lang].dataDeletion;

    return (
        <PublicLayout>
            <Head>
                <title>{doc.metaTitle}</title>
                <meta name="description" content={doc.metaDescription} />
                <meta property="og:title" content={doc.ogTitle} />
                <meta property="og:description" content={doc.ogDescription} />
                <meta
                    property="og:image"
                    content={absUrl('/images/hero/slider1.jpg')}
                />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />
                <meta property="og:type" content="website" />
                <meta property="og:locale" content={OG_LOCALE[lang]} />
                <meta property="og:url" content={absUrl('/data-deletion')} />
                <link rel="canonical" href={absUrl('/data-deletion')} />
                <meta name="robots" content="index, follow" />
            </Head>
            <LegalArticle doc={doc} lang={lang} />
        </PublicLayout>
    );
}

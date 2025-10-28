import Head from 'next/head';
import Script from 'next/script';
import Link from 'next/link';
import { useEffect } from 'react';
import type { Route } from 'next';
import PublicLayout from '@/components/PublicLayout';
import { jsonLd } from '@/utils/seo';
import { trackEvent } from '@/utils/analytics';

export default function HighlightsPage() {
    const name = process.env.NEXT_PUBLIC_BUSINESS_NAME || 'Salon Black & White';
    useEffect(() => {
        try {
            trackEvent('view_item', {
                items: [
                    {
                        item_id: 'highlights',
                        item_name: 'Highlights',
                        item_category: 'Highlights',
                    },
                ],
            });
        } catch {}
    }, []);
    return (
        <PublicLayout>
            <Head>
                <title>Highlights | {name}</title>
                <meta
                    name="description"
                    content="Brighten your look with natural highlights and lowlights at Salon Black & White."
                />
            </Head>
            <Script id="ld-service-highlights" type="application/ld+json" strategy="afterInteractive">
                {jsonLd({
                    '@context': 'https://schema.org',
                    '@type': 'Service',
                    name: 'Highlights',
                    provider: {
                        '@type': 'Organization',
                        name,
                    },
                    areaServed: 'PL',
                    description:
                        'Professional highlights and lowlights to add dimension and brightness to your hair.',
                    category: 'Highlights',
                })}
            </Script>
            <div className="p-6 max-w-3xl space-y-6">
                <h1 className="text-3xl font-bold">Highlights</h1>
                <p>
                    Add dimension and brightness with subtle highlights or
                    bold, sun‑kissed strands. Our stylists customize placement
                    to frame your features and fit your routine.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Face‑framing highlights</li>
                    <li>Partial or full highlights</li>
                    <li>Low‑maintenance, natural looks</li>
                </ul>
                <div>
                    <Link
                        href={'/appointments' as Route}
                        className="inline-block bg-blue-600 text-white px-4 py-2 rounded"
                        onClick={() => {
                            try {
                                trackEvent('select_item', {
                                    items: [
                                        {
                                            item_id: 'highlights',
                                            item_name: 'Highlights',
                                            item_category: 'Highlights',
                                        },
                                    ],
                                });
                                trackEvent('begin_checkout', {
                                    items: [
                                        {
                                            item_id: 'highlights',
                                            item_name: 'Highlights',
                                            item_category: 'Highlights',
                                        },
                                    ],
                                    cta: 'service_page',
                                });
                            } catch {}
                        }}
                    >
                        Book an appointment
                    </Link>
                </div>

                <div className="mt-8">
                    <h2 className="text-xl font-semibold">Related services</h2>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                        <li>
                            <Link href={'/services/balayage' as Route} className="underline">
                                Balayage
                            </Link>
                        </li>
                        <li>
                            <Link href={'/services/coloring' as Route} className="underline">
                                Hair Coloring
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        </PublicLayout>
    );
}

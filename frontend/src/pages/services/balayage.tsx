import Head from 'next/head';
import Script from 'next/script';
import { useEffect } from 'react';
import Link from 'next/link';
import type { Route } from 'next';
import PublicLayout from '@/components/PublicLayout';
import { jsonLd } from '@/utils/seo';
import { trackEvent } from '@/utils/analytics';

export default function BalayagePage() {
    const name = process.env.NEXT_PUBLIC_BUSINESS_NAME || 'Salon Black & White';

    useEffect(() => {
        try {
            trackEvent('view_item', {
                items: [
                    {
                        item_id: 'balayage',
                        item_name: 'Balayage',
                        item_category: 'Hair Coloring',
                    },
                ],
            });
        } catch {}
    }, []);

    return (
        <PublicLayout>
            <Head>
                <title>Balayage | {name}</title>
                <meta
                    name="description"
                    content="Sun‑kissed, natural‑looking balayage color crafted by our stylists at Salon Black & White."
                />
            </Head>
            <Script id="ld-service-balayage" type="application/ld+json" strategy="afterInteractive">
                {jsonLd({
                    '@context': 'https://schema.org',
                    '@type': 'Service',
                    name: 'Balayage',
                    provider: {
                        '@type': 'Organization',
                        name,
                    },
                    areaServed: 'PL',
                    description:
                        'Natural, low‑maintenance balayage for soft highlights and dimension.',
                    category: 'Balayage',
                })}
            </Script>
            <div className="p-6 max-w-3xl space-y-6">
                <h1 className="text-3xl font-bold">Balayage</h1>
                <p>
                    Achieve a soft, sun‑kissed finish with custom balayage
                    placement. We tailor tone and brightness to your features
                    and maintenance preference.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Seamless, natural blend</li>
                    <li>Low‑maintenance grow‑out</li>
                    <li>Personalized tone selection</li>
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
                                            item_id: 'balayage',
                                            item_name: 'Balayage',
                                            item_category: 'Hair Coloring',
                                        },
                                    ],
                                });
                                trackEvent('begin_checkout', {
                                    items: [
                                        {
                                            item_id: 'balayage',
                                            item_name: 'Balayage',
                                            item_category: 'Hair Coloring',
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
                            <Link href={'/services/highlights' as Route} className="underline">
                                Highlights
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

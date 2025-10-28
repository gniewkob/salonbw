import Head from 'next/head';
import Script from 'next/script';
import Link from 'next/link';
import type { Route } from 'next';
import PublicLayout from '@/components/PublicLayout';
import { jsonLd } from '@/utils/seo';

export default function HairColoringPage() {
    const name = process.env.NEXT_PUBLIC_BUSINESS_NAME || 'Salon Black & White';
    return (
        <PublicLayout>
            <Head>
                <title>Hair Coloring | {name}</title>
                <meta
                    name="description"
                    content="Professional hair coloring services including highlights, balayage, and full color at Salon Black & White."
                />
            </Head>
            <Script id="ld-service-coloring" type="application/ld+json" strategy="afterInteractive">
                {jsonLd({
                    '@context': 'https://schema.org',
                    '@type': 'Service',
                    name: 'Hair Coloring',
                    provider: {
                        '@type': 'Organization',
                        name,
                    },
                    areaServed: 'PL',
                    description:
                        'Expert hair coloring services including highlights, balayage, and full color.',
                    category: 'Hair Coloring',
                })}
            </Script>
            <div className="p-6 max-w-3xl space-y-6">
                <h1 className="text-3xl font-bold">Hair Coloring</h1>
                <p>
                    Refresh your style with professional coloring: highlights,
                    balayage, full color, and corrective color treatments. Our
                    stylists help you choose a tone that matches your look and lifestyle.
                </p>
                <h2 className="text-xl font-semibold">What we offer</h2>
                <ul className="list-disc pl-6 space-y-2">
                    <li>Natural highlights and lowlights</li>
                    <li>Balayage and ombré techniques</li>
                    <li>Full and partial color</li>
                    <li>Gloss/toner refresh</li>
                </ul>
                <div>
                    <Link
                        href={'/appointments' as Route}
                        className="inline-block bg-blue-600 text-white px-4 py-2 rounded"
                    >
                        Book an appointment
                    </Link>
                </div>
            </div>
        </PublicLayout>
    );
}


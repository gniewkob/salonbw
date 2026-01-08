import Head from 'next/head';
import PublicLayout from '@/components/PublicLayout';

export default function PrivacyPage() {
    return (
        <PublicLayout>
            <Head>
                <title>Privacy Policy | Salon Black & White</title>
                <meta
                    name="description"
                    content="Privacy policy for Salon Black & White."
                />
            </Head>
            <div className="p-4 space-y-4 max-w-md">
                <h1 className="text-2xl font-bold">Privacy Policy</h1>
                <p>Placeholder for the privacy policy content.</p>
            </div>
        </PublicLayout>
    );
}

import ContactForm from '@/components/ContactForm';
import Head from 'next/head';
import PublicLayout from '@/components/PublicLayout';

export default function ContactPage() {
    return (
        <PublicLayout>
            <Head>
                <title>Contact Us | Salon Black &amp; White</title>
                <meta
                    name="description"
                    content="Reach out to Salon Black &amp; White to book appointments or ask questions."
                />
            </Head>
            <div className="p-4 space-y-4 max-w-md">
                <h1 className="text-2xl font-bold">Contact Us</h1>
                <p>
                    You can reach us at{' '}
                    <a className="underline" href="mailto:contact@example.com">
                        contact@example.com
                    </a>
                </p>
                <p>Phone: 123-456-789</p>
                <ContactForm />
            </div>
        </PublicLayout>
    );
}

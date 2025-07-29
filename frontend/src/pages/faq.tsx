import FAQAccordion, { FAQItem } from '@/components/FAQAccordion';
import Head from 'next/head';

const faqs: FAQItem[] = [
    {
        question: 'What are your opening hours?',
        answer: 'We are open from 9AM to 5PM Monday through Friday.',
    },
    {
        question: 'How can I book an appointment?',
        answer: 'You can call us or use the contact form to schedule an appointment.',
    },
    {
        question: 'Do you accept walk-ins?',
        answer: 'Yes, walk-ins are welcome when availability permits.',
    },
];

export default function FAQPage() {
    return (
        <>
            <Head>
                <title>
                    Frequently Asked Questions | Salon Black &amp; White
                </title>
                <meta
                    name="description"
                    content="Answers to common questions about Salon Black &amp; White."
                />
            </Head>
            <div className="p-4 space-y-4 max-w-md">
                <h1 className="text-2xl font-bold">
                    Frequently Asked Questions
                </h1>
                <FAQAccordion items={faqs} />
            </div>
        </>
    );
}

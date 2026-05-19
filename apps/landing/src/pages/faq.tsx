import FAQAccordion, { FAQItem } from '@/components/FAQAccordion';
import Head from 'next/head';
import Script from 'next/script';
import { jsonLd } from '@/utils/seo';
import PublicLayout from '@/components/PublicLayout';
import SectionHeader from '@/components/SectionHeader';
import { BUSINESS_INFO } from '@/config/content';

const faqs: FAQItem[] = [
    {
        question: 'Jakie są godziny otwarcia salonu?',
        answer: `Salon Black & White jest otwarty od poniedziałku do piątku w godzinach ${BUSINESS_INFO.hours.mondayFriday} oraz w soboty ${BUSINESS_INFO.hours.saturday}. W niedzielę salon jest nieczynny.`,
    },
    {
        question: 'Jak umówić wizytę?',
        answer: 'Wizytę można zarezerwować przez nasz panel online dostępny na stronie, telefonicznie lub osobiście w salonie. Rezerwacja online jest dostępna całą dobę i pozwala wybrać dowolną usługę oraz termin.',
    },
    {
        question: 'Czy można przyjść bez rezerwacji?',
        answer: 'Przyjmujemy klientów bez rezerwacji w miarę dostępności wolnych terminów. Zalecamy jednak wcześniejsze umówienie wizyty — szczególnie w piątki i soboty, gdy salon jest wyjątkowo oblegany.',
    },
    {
        question: 'Jak długo trwa strzyżenie lub koloryzacja?',
        answer: 'Czas zabiegu zależy od wybranej usługi i długości włosów. Strzyżenie zajmuje zazwyczaj 30–60 minut, natomiast koloryzacja od 1,5 do 3 godzin. Dokładny czas omówimy podczas wstępnej konsultacji.',
    },
    {
        question: 'Czy przed zabiegiem odbywa się konsultacja?',
        answer: 'Tak — każda wizyta w Black & White rozpoczyna się od profesjonalnej konsultacji. Analizujemy stan Twoich włosów i dobieramy zabieg do ich indywidualnych potrzeb. To fundament naszej filozofii „Akademii Zdrowych Włosów".',
    },
    {
        question: 'Czy salon przyjmuje karty płatnicze?',
        answer: 'Tak, akceptujemy płatności kartą (Visa, Mastercard), gotówką oraz BLIK. Płatności bezstykowe są dostępne przy każdej usłudze.',
    },
    {
        question: 'Jak anulować lub zmienić rezerwację?',
        answer: 'Rezerwację można anulować lub zmienić do 24 godzin przed planowaną wizytą — przez panel online lub telefonicznie. Prosimy o wcześniejsze poinformowanie nas w przypadku braku możliwości stawienia się na wizytę.',
    },
    {
        question: 'Jakich produktów używacie w salonie?',
        answer: 'Używamy wyłącznie profesjonalnych produktów renomowanych marek, dbających o zdrowie i kondycję włosów. Nasz salon specjalizuje się w zabiegach regeneracyjnych — stąd nazwa „Akademia Zdrowych Włosów".',
    },
];

export default function FAQPage() {
    return (
        <PublicLayout>
            <Head>
                <title>FAQ — Często zadawane pytania | Salon Black &amp; White</title>
                <meta
                    name="description"
                    content="Odpowiedzi na najczęściej zadawane pytania dotyczące salonu Black & White w Bytomiu — rezerwacje, usługi, godziny otwarcia."
                />
            </Head>
            <Script id="ld-faq" type="application/ld+json" strategy="afterInteractive">
                {jsonLd({
                    '@context': 'https://schema.org',
                    '@type': 'FAQPage',
                    mainEntity: faqs.map((f) => ({
                        '@type': 'Question',
                        name: f.question,
                        acceptedAnswer: { '@type': 'Answer', text: f.answer },
                    })),
                })}
            </Script>

            <div style={{ background: '#0d0d0d', minHeight: '100vh', paddingBottom: '6rem' }}>
                <div className="container mx-auto px-4 md:px-8" style={{ paddingTop: '5rem' }}>
                    <SectionHeader
                        eyebrow="Masz pytania?"
                        title="FAQ"
                        subtitle="Odpowiedzi na najczęściej zadawane pytania dotyczące naszego salonu."
                        dark
                    />
                    <FAQAccordion items={faqs} />
                </div>
            </div>
        </PublicLayout>
    );
}

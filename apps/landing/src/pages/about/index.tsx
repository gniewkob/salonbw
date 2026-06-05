import Head from 'next/head';
import Link from 'next/link';
import PublicLayout from '@/components/PublicLayout';
import SectionHeader from '@/components/SectionHeader';
import BookingCta from '@/components/BookingCta';
import ScrollReveal from '@/components/ScrollReveal';
import { BUSINESS_INFO, SEO_META } from '@/config/content';

export default function AboutPage() {
    return (
        <PublicLayout>
            <Head>
                <title>O nas — {BUSINESS_INFO.name}</title>
                <meta
                    name="description"
                    content={`Poznaj ${BUSINESS_INFO.name} — ${BUSINESS_INFO.tagline}. Salon fryzjerski w Bytomiu z pasją do zdrowych włosów.`}
                />
            </Head>

            {/* Hero */}
            <section
                style={{
                    background: 'linear-gradient(135deg, #1c1e24 0%, #252830 100%)',
                    color: '#e4e6ee',
                    padding: '80px 24px 60px',
                    textAlign: 'center',
                }}
            >
                <ScrollReveal>
                    <p
                        style={{
                            color: '#b8bcc8',
                            fontSize: '12px',
                            fontWeight: 700,
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            marginBottom: '12px',
                        }}
                    >
                        Nasz salon
                    </p>
                    <h1
                        style={{
                            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                            fontWeight: 800,
                            margin: '0 0 16px',
                        }}
                    >
                        {BUSINESS_INFO.name}
                    </h1>
                    <p
                        style={{
                            fontSize: '1.2rem',
                            color: '#b8bcc8',
                            maxWidth: '560px',
                            margin: '0 auto',
                        }}
                    >
                        {BUSINESS_INFO.tagline}
                    </p>
                </ScrollReveal>
            </section>

            {/* Mission */}
            <section style={{ padding: '64px 24px', maxWidth: '840px', margin: '0 auto' }}>
                <ScrollReveal>
                    <SectionHeader
                        title="Nasza misja"
                        subtitle="Więcej niż fryzjer — to miejsce, w którym włosy odzyskują życie"
                    />
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                            gap: '32px',
                            marginTop: '40px',
                        }}
                    >
                        {[
                            {
                                icon: '✦',
                                title: 'Zdrowe włosy przede wszystkim',
                                text: 'Każdy zabieg poprzedzamy konsultacją. Dobieramy produkty i techniki indywidualnie do struktury i potrzeb włosa.',
                            },
                            {
                                icon: '✦',
                                title: 'Najwyższa jakość',
                                text: 'Pracujemy wyłącznie na produktach premium — Redken, Olaplex, Schwarzkopf Professional.',
                            },
                            {
                                icon: '✦',
                                title: 'Twój czas i komfort',
                                text: 'Rezerwacja online, przypomnienia SMS i brak kolejek — bo Twój czas ma wartość.',
                            },
                        ].map((item) => (
                            <div
                                key={item.title}
                                style={{
                                    padding: '28px',
                                    border: '1px solid #e0e4ee',
                                    borderRadius: '8px',
                                    background: '#fafbff',
                                }}
                            >
                                <div
                                    style={{
                                        color: '#b8bcc8',
                                        fontSize: '20px',
                                        marginBottom: '12px',
                                    }}
                                >
                                    {item.icon}
                                </div>
                                <h3
                                    style={{
                                        fontSize: '1rem',
                                        fontWeight: 700,
                                        marginBottom: '8px',
                                    }}
                                >
                                    {item.title}
                                </h3>
                                <p style={{ color: '#6b7280', fontSize: '0.92rem', lineHeight: 1.6 }}>
                                    {item.text}
                                </p>
                            </div>
                        ))}
                    </div>
                </ScrollReveal>
            </section>

            {/* Stylist */}
            <section
                style={{
                    background: '#f4f5f8',
                    padding: '64px 24px',
                }}
            >
                <div style={{ maxWidth: '720px', margin: '0 auto' }}>
                    <ScrollReveal>
                        <SectionHeader
                            title="Twoja stylistka"
                            subtitle="Pasja i doświadczenie w jednym miejscu"
                        />
                        <div
                            style={{
                                marginTop: '40px',
                                display: 'flex',
                                gap: '32px',
                                alignItems: 'flex-start',
                                flexWrap: 'wrap',
                            }}
                        >
                            <div
                                style={{
                                    width: '90px',
                                    height: '90px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #b8bcc8, #9098a8)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '2rem',
                                    flexShrink: 0,
                                }}
                            >
                                💇
                            </div>
                            <div style={{ flex: 1, minWidth: '240px' }}>
                                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '8px' }}>
                                    Aleksandra
                                </h3>
                                <p style={{ color: '#b8bcc8', fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                    Stylistka & właścicielka
                                </p>
                                <p style={{ color: '#4b5563', lineHeight: 1.7, marginBottom: '12px' }}>
                                    Fryzjerka z wieloletnim doświadczeniem, specjalizująca się w koloryzacji,
                                    balejaż i leczeniu włosów. Nieustannie się szkoli — uczestniczy w
                                    krajowych i międzynarodowych kursach mistrzowskich.
                                </p>
                                <p style={{ color: '#4b5563', lineHeight: 1.7 }}>
                                    Wierzy, że piękne włosy zaczynają się od zdrowia — dlatego każdą wizytę
                                    traktuje jak konsultację, a nie tylko usługę.
                                </p>
                            </div>
                        </div>
                    </ScrollReveal>
                </div>
            </section>

            {/* Location & Hours */}
            <section style={{ padding: '64px 24px', maxWidth: '840px', margin: '0 auto' }}>
                <ScrollReveal>
                    <SectionHeader title="Znajdź nas" subtitle={BUSINESS_INFO.address.full} />
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                            gap: '32px',
                            marginTop: '40px',
                        }}
                    >
                        <div>
                            <h4 style={{ fontWeight: 700, marginBottom: '16px' }}>Godziny otwarcia</h4>
                            <dl style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
                                <dt style={{ color: '#6b7280' }}>Pon – Pt</dt>
                                <dd style={{ fontWeight: 600 }}>{BUSINESS_INFO.hours.mondayFriday}</dd>
                                <dt style={{ color: '#6b7280' }}>Sobota</dt>
                                <dd style={{ fontWeight: 600 }}>{BUSINESS_INFO.hours.saturday}</dd>
                                <dt style={{ color: '#6b7280' }}>Niedziela</dt>
                                <dd style={{ color: '#9098a8' }}>{BUSINESS_INFO.hours.sunday}</dd>
                            </dl>
                        </div>
                        <div>
                            <h4 style={{ fontWeight: 700, marginBottom: '16px' }}>Kontakt</h4>
                            <p style={{ marginBottom: '8px' }}>
                                <a
                                    href={`tel:${BUSINESS_INFO.contact.phone}`}
                                    style={{ color: '#b8bcc8', fontWeight: 600, textDecoration: 'none' }}
                                >
                                    {BUSINESS_INFO.contact.phone}
                                </a>
                            </p>
                            <p style={{ marginBottom: '16px' }}>
                                <a
                                    href={`mailto:${BUSINESS_INFO.contact.email}`}
                                    style={{ color: '#b8bcc8', textDecoration: 'none' }}
                                >
                                    {BUSINESS_INFO.contact.email}
                                </a>
                            </p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <a
                                    href={BUSINESS_INFO.social.facebook}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        padding: '6px 14px',
                                        border: '1px solid #b8bcc8',
                                        borderRadius: '4px',
                                        color: '#b8bcc8',
                                        fontSize: '0.85rem',
                                        textDecoration: 'none',
                                    }}
                                >
                                    Facebook
                                </a>
                                <a
                                    href={BUSINESS_INFO.social.instagram}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        padding: '6px 14px',
                                        border: '1px solid #b8bcc8',
                                        borderRadius: '4px',
                                        color: '#b8bcc8',
                                        fontSize: '0.85rem',
                                        textDecoration: 'none',
                                    }}
                                >
                                    Instagram
                                </a>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>
            </section>

            <BookingCta />
        </PublicLayout>
    );
}

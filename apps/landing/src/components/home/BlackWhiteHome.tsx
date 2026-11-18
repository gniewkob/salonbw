import { useEffect, useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { BUSINESS_INFO } from '@/config/content';
import { useLanguage } from '@/contexts/LanguageContext';
import type { OpeningHoursLine } from '@/hooks/useOpeningHours';
import { useHeroPullBack } from '@/hooks/useHeroPullBack';
import styles from './BlackWhiteHome.module.css';

/**
 * Homepage in the "Black & White" direction chosen by the salon owner:
 * Cinematic hero, then Atelier chapters, alternating black and white bands.
 * Every booking button opens the canonical BookingModal owned by the page;
 * a phone link sits beside it so a visitor always has a path that works.
 */

const COPY = {
    pl: {
        meta: 'Salon fryzjerski / Bytom',
        heroEyebrow: 'Akademia Zdrowych Włosów — od 2011',
        heroLead: 'Forma. Światło.',
        heroFollow: 'Twoje włosy.',
        heroText:
            'Salon fryzjerski w Bytomiu od 2011 roku. Koloryzacja Wella i AirTouch, regeneracja włosów, strzyżenie.',
        call: 'Zadzwoń',
        today: 'Dziś',
        phone: 'Telefon',
        address: 'Adres',
        known: 'Specjalność',
        knownValue: 'Koloryzacja i regeneracja włosów',
        openUntil: 'Otwarte do',
        todayFrom: 'Dziś',
        closedNow: 'Zamknięte',
        opens: 'otwieramy',
        tomorrow: 'jutro',
        days: [
            'w niedzielę',
            'w poniedziałek',
            'we wtorek',
            'w środę',
            'w czwartek',
            'w piątek',
            'w sobotę',
        ],
        atelierRule: 'Salon',
        atelierEyebrow: 'B&W — Akademia Zdrowych Włosów',
        atelierLead: 'Włosy.',
        atelierFollow: 'Twoja forma.',
        atelierText:
            'Precyzyjna koloryzacja, strzyżenie i świadoma pielęgnacja — zaczynamy od zdrowia włosów.',
        servicesEyebrow: '02 / Usługi',
        servicesTitle: 'Odkryj zakres usług',
        servicesText:
            'Aktualne warianty, czas trwania i ceny znajdziesz w cenniku.',
        allServices: 'Pełny cennik',
        founderEyebrow: '01 / Słowo od założycielki',
        gallery: 'Zobacz salon',
        contactEyebrow: '03 / Kontakt',
        contactTitle: 'Umów się telefonicznie — dobierzemy termin i zabieg.',
        email: 'E-mail',
        map: 'Otwórz w Google Maps',
    },
    en: {
        meta: 'Hair studio / Bytom',
        heroEyebrow: 'Healthy Hair Academy — since 2011',
        heroLead: 'Form. Light.',
        heroFollow: 'Your hair.',
        heroText:
            'A hair studio in Bytom since 2011. Wella and AirTouch colouring, hair restoration and cutting.',
        call: 'Call',
        today: 'Today',
        phone: 'Phone',
        address: 'Address',
        known: 'Known for',
        knownValue: 'Colouring and hair restoration',
        openUntil: 'Open until',
        todayFrom: 'Today',
        closedNow: 'Closed',
        opens: 'opens',
        tomorrow: 'tomorrow',
        days: [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
        ],
        atelierRule: 'Studio',
        atelierEyebrow: 'B&W — Healthy Hair Academy',
        atelierLead: 'Hair.',
        atelierFollow: 'Your signature.',
        atelierText:
            'Precision colouring, cutting and thoughtful care — we start with the health of your hair.',
        servicesEyebrow: '02 / Services',
        servicesTitle: 'Explore our services',
        servicesText:
            'Current options, durations and prices are in the price list.',
        allServices: 'Full price list',
        founderEyebrow: '01 / A word from the founder',
        gallery: 'Visit the studio',
        contactEyebrow: '03 / Contact',
        contactTitle:
            'Book by phone — we will find the right time and treatment.',
        email: 'E-mail',
        map: 'Open in Google Maps',
    },
    de: {
        meta: 'Friseursalon / Bytom',
        heroEyebrow: 'Akademie für gesundes Haar — seit 2011',
        heroLead: 'Form. Licht.',
        heroFollow: 'Dein Haar.',
        heroText:
            'Friseursalon in Bytom seit 2011. Coloration mit Wella und AirTouch, Haarregeneration, Schnitte.',
        call: 'Anrufen',
        today: 'Heute',
        phone: 'Telefon',
        address: 'Adresse',
        known: 'Spezialität',
        knownValue: 'Coloration und Haarregeneration',
        openUntil: 'Geöffnet bis',
        todayFrom: 'Heute',
        closedNow: 'Geschlossen',
        opens: 'öffnet',
        tomorrow: 'morgen',
        days: [
            'Sonntag',
            'Montag',
            'Dienstag',
            'Mittwoch',
            'Donnerstag',
            'Freitag',
            'Samstag',
        ],
        atelierRule: 'Salon',
        atelierEyebrow: 'B&W — Akademie für gesundes Haar',
        atelierLead: 'Haar.',
        atelierFollow: 'Dein Stil.',
        atelierText:
            'Präzise Coloration, Schnitte und bewusste Pflege — wir beginnen mit der Gesundheit deines Haares.',
        servicesEyebrow: '02 / Leistungen',
        servicesTitle: 'Unsere Leistungen entdecken',
        servicesText:
            'Aktuelle Varianten, Dauer und Preise findest du in der Preisliste.',
        allServices: 'Vollständige Preisliste',
        founderEyebrow: '01 / Ein Wort der Gründerin',
        gallery: 'Salon entdecken',
        contactEyebrow: '03 / Kontakt',
        contactTitle:
            'Termin telefonisch — wir finden Zeit und Behandlung für dich.',
        email: 'E-Mail',
        map: 'In Google Maps öffnen',
    },
} as const;

type Copy = (typeof COPY)[keyof typeof COPY];

const PHONE = BUSINESS_INFO.contact.phone;
const PHONE_LOCAL = PHONE.replace('+48 ', '');
const TEL_HREF = 'tel:' + PHONE.replace(/\s+/g, '');
const MAPS_HREF =
    'https://www.google.com/maps/search/?api=1&query=' +
    BUSINESS_INFO.coordinates.lat +
    ',' +
    BUSINESS_INFO.coordinates.lng;
const WEEK_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
type WeekKey = (typeof WEEK_KEYS)[number];
type Ranges = ReadonlyArray<{ readonly open: string; readonly close: string }>;

/**
 * "Open until 19:00" / "Closed · opens on Thursday 12:00", computed after
 * mount in Europe/Warsaw so the server render never shows a stale day.
 */
function useTodayStatus(
    copy: Copy,
    weekly: Partial<Record<WeekKey, Ranges>>,
): string | null {
    const [status, setStatus] = useState<string | null>(null);
    useEffect(() => {
        const parts = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Europe/Warsaw',
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23',
        }).formatToParts(new Date());
        const get = (type: string) =>
            parts.find((p) => p.type === type)?.value ?? '';
        const today = Math.max(
            0,
            ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(
                get('weekday'),
            ),
        );
        const now = get('hour') + ':' + get('minute');
        const rangesFor = (d: number) => weekly[WEEK_KEYS[d]] ?? [];
        const open = rangesFor(today).find((r) => now < r.close);
        if (open) {
            setStatus(
                now >= open.open
                    ? `${copy.openUntil} ${open.close}`
                    : `${copy.todayFrom} ${open.open}–${open.close}`,
            );
            return;
        }
        for (let step = 1; step <= 7; step++) {
            const day = (today + step) % 7;
            const next = rangesFor(day)[0];
            if (next) {
                const when = step === 1 ? copy.tomorrow : copy.days[day];
                setStatus(
                    `${copy.closedNow} · ${copy.opens} ${when} ${next.open}`,
                );
                return;
            }
        }
        setStatus(copy.closedNow);
    }, [copy, weekly]);
    return status;
}

export function useHomeCopy(): Copy {
    const { lang } = useLanguage();
    return COPY[lang] ?? COPY.pl;
}

interface HeroProps {
    onBook: () => void;
    hours: OpeningHoursLine[];
    weekly: Partial<Record<WeekKey, Ranges>>;
}

export function HomeHero({ onBook, hours, weekly }: HeroProps) {
    const { T } = useLanguage();
    const copy = useHomeCopy();
    const today = useTodayStatus(copy, weekly);
    const heroRef = useHeroPullBack<HTMLDivElement>();
    return (
        <div className={styles.root}>
            <div ref={heroRef} className={styles.heroStage}>
                <section className={styles.hero} aria-labelledby="home-title">
                    <div className={styles.heroFrame}>
                        <Image
                            src="/images/hero/DSC_9576.jpg"
                            alt="Recepcja salonu Black & White w Bytomiu"
                            fill
                            priority
                            sizes="100vw"
                            className={styles.heroPhoto}
                        />
                        <div className={styles.heroScrim} />
                    </div>
                    <div className={styles.heroMeta}>
                        <span>Black &amp; White</span>
                        <span>{copy.meta}</span>
                    </div>
                    <div className={styles.heroStory}>
                        <p className={styles.eyebrow}>{copy.heroEyebrow}</p>
                        <h1 id="home-title">
                            {copy.heroLead}
                            <em>{copy.heroFollow}</em>
                        </h1>
                        <p className={styles.heroLead}>{copy.heroText}</p>
                        <div className={styles.heroActions}>
                            <button
                                type="button"
                                onClick={onBook}
                                data-booking-cta
                                className="bw-btn bw-btn--primary"
                            >
                                {T.nav.booking}
                                <span aria-hidden="true">↗</span>
                            </button>
                            <a
                                href={TEL_HREF}
                                className="bw-btn bw-btn--on-dark"
                            >
                                {copy.call} · {PHONE_LOCAL}
                            </a>
                        </div>
                    </div>
                    <span className={styles.heroSide} aria-hidden="true">
                        A study in black &amp; white
                    </span>
                </section>
            </div>
            <ul
                className={`${styles.facts} ${styles.light}`}
                aria-label={T.contact.hoursTitle}
            >
                <li>
                    <span className={styles.factLabel}>{copy.today}</span>
                    <strong>
                        {today ??
                            hours
                                .map((l) => `${l.label} ${l.value}`)
                                .join(' · ')}
                    </strong>
                </li>
                <li>
                    <a href={TEL_HREF}>
                        <span className={styles.factLabel}>{copy.phone}</span>
                        <strong>{PHONE}</strong>
                    </a>
                </li>
                <li>
                    <a
                        href={MAPS_HREF}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <span className={styles.factLabel}>{copy.address}</span>
                        <strong>
                            {BUSINESS_INFO.address.street},{' '}
                            {BUSINESS_INFO.address.city}
                        </strong>
                    </a>
                </li>
                <li>
                    <span className={styles.factLabel}>{copy.known}</span>
                    <strong>{copy.knownValue}</strong>
                </li>
            </ul>
        </div>
    );
}

export function HomeAtelier() {
    const copy = useHomeCopy();
    return (
        <div className={`${styles.root} ${styles.light}`}>
            <section className={styles.atelier} aria-labelledby="home-atelier">
                <div className={styles.atelierRule}>
                    <span>Black &amp; White</span>
                    <span>{copy.atelierRule} / Bytom</span>
                </div>
                <div className={styles.atelierGrid}>
                    <div className={styles.atelierTitle}>
                        <p className={styles.eyebrow}>{copy.atelierEyebrow}</p>
                        <h2 id="home-atelier">
                            {copy.atelierLead}
                            <br />
                            <em>{copy.atelierFollow}</em>
                        </h2>
                        <p className={styles.atelierStatement}>
                            {copy.atelierText}
                        </p>
                        <Link href="/services" className={styles.lineLink}>
                            {copy.allServices}{' '}
                            <span aria-hidden="true">↗</span>
                        </Link>
                    </div>
                    <div className={styles.diptych}>
                        <div className={styles.diptychMain}>
                            <Image
                                src="/images/hero/DSC_9583.jpg"
                                alt="Wnętrze salonu Black & White"
                                fill
                                sizes="(max-width: 768px) 90vw, 42vw"
                                className={styles.cover}
                            />
                        </div>
                        <div className={styles.diptychSmall}>
                            <Image
                                src="/images/hero/DSC_9584.jpg"
                                alt="Stanowiska fryzjerskie salonu"
                                fill
                                sizes="(max-width: 768px) 40vw, 18vw"
                                className={styles.cover}
                            />
                        </div>
                        <span className={styles.diptychCaption}>
                            BYTOM — 2011
                        </span>
                    </div>
                </div>
            </section>
        </div>
    );
}

export function HomeServices() {
    const { T } = useLanguage();
    const copy = useHomeCopy();
    const items = T.services.items.slice(0, 3);
    return (
        <div className={`${styles.root} ${styles.light}`}>
            <section
                id="services"
                className={styles.services}
                aria-labelledby="home-services"
            >
                <div className={styles.servicesIntro}>
                    <div>
                        <p className={styles.eyebrow}>{copy.servicesEyebrow}</p>
                        <h2 id="home-services">{copy.servicesTitle}</h2>
                    </div>
                    <p>{copy.servicesText}</p>
                </div>
                {items.map((item, index) => (
                    <Link
                        key={item.title}
                        href="/services"
                        className={styles.serviceRow}
                    >
                        <span className={styles.serviceNum}>0{index + 1}</span>
                        <span className={styles.serviceText}>
                            <strong>{item.title}</strong>
                            <span>{item.description}</span>
                        </span>
                        <span
                            className={styles.serviceArrow}
                            aria-hidden="true"
                        >
                            ↗
                        </span>
                    </Link>
                ))}
                <div className={styles.servicesAll}>
                    <Link href="/services" className={styles.lineLink}>
                        {copy.allServices} <span aria-hidden="true">↗</span>
                    </Link>
                </div>
            </section>
        </div>
    );
}

interface FounderProps {
    name: string;
    quote: string;
    photo?: string;
}

export function HomeFounder({ name, quote, photo }: FounderProps) {
    const { T } = useLanguage();
    const copy = useHomeCopy();
    return (
        <div className={styles.root}>
            <section
                id="about"
                className={styles.founder}
                aria-labelledby="home-founder"
            >
                <div className={styles.founderMedia}>
                    <div className={styles.founderPhoto}>
                        <Image
                            src={photo || '/images/salon/salon2.jpg'}
                            alt={name}
                            fill
                            sizes="(max-width: 768px) 90vw, 43vw"
                            className={styles.cover}
                        />
                        <span className={styles.founderTag}>
                            BLACK &amp; WHITE / 2011
                        </span>
                    </div>
                    <div className={styles.founderDetail}>
                        <Image
                            src="/images/salon/salon5.jpg"
                            alt=""
                            fill
                            sizes="(max-width: 768px) 43vw, 18vw"
                            className={styles.cover}
                        />
                    </div>
                </div>
                <div className={styles.founderCopy}>
                    <p className={styles.eyebrow}>{copy.founderEyebrow}</p>
                    <h2 id="home-founder" className={styles.founderQuote}>
                        <span aria-hidden="true">„</span>
                        {quote}
                        <span aria-hidden="true">”</span>
                    </h2>
                    <span className={styles.founderName}>{name}</span>
                    <span className={styles.founderRole}>{T.founder.role}</span>
                    <div className={styles.founderLinks}>
                        <Link href="/gallery" className={styles.lineLink}>
                            {copy.gallery} <span aria-hidden="true">↗</span>
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}

interface ContactProps {
    onBook: () => void;
    hours: OpeningHoursLine[];
    map?: ReactNode;
}

export function HomeContact({ onBook, hours, map }: ContactProps) {
    const { T } = useLanguage();
    const copy = useHomeCopy();
    return (
        <div className={styles.root}>
            <section
                id="contact"
                className={styles.contact}
                aria-labelledby="home-contact"
            >
                <div>
                    <p className={styles.eyebrow}>{copy.contactEyebrow}</p>
                    <h2 id="home-contact">{copy.contactTitle}</h2>
                    <a className={styles.bigPhone} href={TEL_HREF}>
                        {PHONE_LOCAL}
                    </a>
                    <dl className={styles.contactMeta}>
                        <dt>{copy.address}</dt>
                        <dd>
                            {BUSINESS_INFO.address.full} ·{' '}
                            <a
                                href={MAPS_HREF}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                {copy.map}
                            </a>
                        </dd>
                        <dt>{copy.email}</dt>
                        <dd>
                            <a href={`mailto:${BUSINESS_INFO.contact.email}`}>
                                {BUSINESS_INFO.contact.email}
                            </a>
                        </dd>
                    </dl>
                    <div className={styles.contactActions}>
                        <button
                            type="button"
                            onClick={onBook}
                            data-booking-cta
                            className="bw-btn bw-btn--primary"
                        >
                            {T.nav.booking}
                            <span aria-hidden="true">↗</span>
                        </button>
                        <Link
                            href="/contact"
                            className="bw-btn bw-btn--on-dark"
                        >
                            {T.contact.formLink}
                        </Link>
                    </div>
                </div>
                <div>
                    <p className={styles.eyebrow}>{T.contact.hoursTitle}</p>
                    <dl className={styles.hours}>
                        {hours.map((line) => (
                            <div
                                key={line.label}
                                data-closed={line.closed ? 'true' : undefined}
                            >
                                <dt>{line.label}</dt>
                                <dd>{line.value}</dd>
                            </div>
                        ))}
                    </dl>
                    {map && <div className={styles.map}>{map}</div>}
                </div>
            </section>
        </div>
    );
}

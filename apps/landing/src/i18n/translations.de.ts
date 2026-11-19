import type { Translations } from './translations';

// Loaded on demand when the visitor switches language (keeps the PL-first
// initial bundle small); see LanguageContext.
const de: Translations = {
    nav: {
        home: 'Start',
        about: 'Über uns',
        services: 'Leistungen',
        gallery: 'Galerie',
        contact: 'Kontakt',
        login: 'Anmelden',
        logout: 'Abmelden',
        panel: 'Panel',
        booking: 'Termin buchen',
    },
    hero: {
        eyebrow: 'Akademie für gesundes Haar',
        tagline1:
            'Gesundes Haar ist das Fundament. Stil — das natürliche Ergebnis.',
        tagline2: 'Entdecken Sie, wozu Ihr Haar wirklich fähig ist.',
        ctaSecondary: 'Leistungen entdecken',
        imageAlt: 'Interieur des Salons Black & White',
        hoursLabel: 'Öffnungszeiten',
        scroll: 'Scrollen',
        metaYears: 'Jahre in Bytom',
        trustPill: 'Bytom · Vertrauen seit 2011',
        nearestSlot: 'Nächster freier Termin:',
    },
    trust: {
        label: 'Wir arbeiten mit Marken',
    },
    stats: [
        { suffix: '+', label: 'Jahre Salon' },
        { suffix: '+', label: 'zufriedene Kunden' },
        { suffix: '★', label: 'Google-Bewertung' },
        { suffix: '+', label: 'Jahre in der Branche' },
    ],
    ticker: [
        'LEIDENSCHAFT',
        'PROFESSIONALITÄT',
        'PFLEGE',
        'SCHÖNHEIT',
        'BYTOM',
        'AKADEMIE',
        'GESUNDES HAAR',
        'BLACK & WHITE',
    ],
    founder: {
        eyebrow: 'Ein Wort von der Gründerin',
        role: 'Gründerin & Inhaberin des Salons Black & White',
        since: 'seit 2011',
        quote: 'Seit vielen Jahren verbessere ich kontinuierlich meine Qualifikationen und die Qualität meiner Dienstleistungen — deshalb habe ich treue, zufriedene Kunden. Werden Sie Teil davon — und erleben Sie, wie wirklich gesundes Haar aussieht.',
    },
    history: {
        eyebrow: 'Woher wir kommen',
        title: 'Unsere Geschichte',
        yearMap: {
            historia: '30+ J.',
            poczatek: '2011',
            wartosci: 'heute',
        },
        items: [
            {
                id: 'historia',
                title: 'Salongeschichte',
                content:
                    'Über 30 Jahre lang habe ich Kompetenzen in Schnitt- und Färbetechniken aufgebaut. Ich lernte, dass die Arbeit mit Menschen und die Erfüllung ihrer Träume von schönem Haar ein untrennbarer Teil der Arbeit eines Friseurs ist. Durch diese Erfahrungen entstand die Vision eines Ortes, an dem jeder Kunde eine auf seine individuellen Bedürfnisse zugeschnittene Dienstleistung professionell und entspannt erleben kann.',
            },
            {
                id: 'poczatek',
                title: 'Der Anfang',
                content:
                    'Im Jahr 2011 konnte ich meinen Traum von einem solchen Ort verwirklichen. Ich entwarf den Salon Black & White selbst, basierend auf einem modernen, aber komfortablen Stil.',
            },
            {
                id: 'wartosci',
                title: 'Unsere Werte',
                content:
                    'Unser Salon orientiert sich an sechs Kernwerten: Leidenschaft und Kreativität, Professionalität und Exzellenz, individuellem Ansatz, Kundenzufriedenheit, Hygiene und Sicherheit sowie Umweltengagement.',
            },
        ],
    },
    values: {
        eyebrow: 'Woran wir glauben',
        title: 'Unsere Werte',
        items: [
            {
                id: 'pasja',
                title: 'Leidenschaft & Kreativität',
                description:
                    'Wir stecken unser ganzes Herz in alles, was wir tun. Unsere Leidenschaft für die Friseurkunst ist ein untrennbarer Teil unserer Arbeit. Wir sind kreativ und offen für neue Trends, sodass wir einzigartige Frisuren schaffen können, die Ihre Individualität unterstreichen.',
            },
            {
                id: 'profesjonalizm',
                title: 'Professionalität & Exzellenz',
                description:
                    'Unser Team aus erfahrenen Friseuren sind Meister ihres Fachs. Wir verbessern unsere Fähigkeiten ständig, nehmen an Schulungen teil und verfolgen die neuesten Techniken und Trends. Sie können sicher sein, einen Service auf höchstem Niveau zu erhalten.',
            },
            {
                id: 'indywidualne',
                title: 'Individueller Ansatz',
                description:
                    'Wir wissen, dass jeder Kunde einzigartig ist. Deshalb hören wir immer sorgfältig auf Ihre Bedürfnisse und Vorlieben. Unser Team ist darauf geschult, Ihre Erwartungen zu verstehen und Lösungen vorzuschlagen, die zu Ihrem Lebensstil passen.',
            },
            {
                id: 'zadowolenie',
                title: 'Kundenzufriedenheit',
                description:
                    'Ihre Zufriedenheit ist unser oberstes Ziel. Wir streben danach, eine freundliche und komfortable Atmosphäre in unserem Salon zu schaffen. Wir möchten, dass Sie sich wie zu Hause fühlen und unser Salon mit einem Lächeln verlassen.',
            },
            {
                id: 'higiena',
                title: 'Hygiene & Sicherheit',
                description:
                    'Ihre Gesundheit und Sicherheit haben für uns Priorität. Wir halten strenge Hygienestandards ein und sorgen dafür, dass unser Salon sauber und sicher ist. Alle unsere Werkzeuge und Geräte werden sorgfältig desinfiziert.',
            },
            {
                id: 'srodowisko',
                title: 'Umweltengagement',
                description:
                    'Wir sind uns des Einflusses bewusst, den unsere Branche auf die Umwelt haben kann. Wir ergreifen Maßnahmen zur Reduzierung unseres ökologischen Fußabdrucks, verwenden umweltfreundliche Produkte und engagieren uns für nachhaltige Praktiken.',
            },
        ],
    },
    services: {
        eyebrow: 'Wie wir helfen können',
        title: 'Unsere Leistungen',
        featured: 'Empfohlen',
        learnMore: 'Mehr erfahren',
        viewAll: 'Vollständiges Angebot',
        teaserSubtitle:
            'Gesundes Haar als Ausgangspunkt — wir verbinden fortschrittliche Regenerationsbehandlungen mit präziser Styling- und Färbetechnik.',
        pageEyebrow: 'Preisliste & Angebot',
        pageHeading: 'Unsere Leistungen',
        pageDesc:
            'Professionelle Friseur-, Barber- und Haarpflegeleistungen für Damen und Herren. Jeder Besuch ist individuell auf Sie zugeschnitten.',
        bookBtn: 'Buchen',
        serviceCount1: 'Leistung',
        serviceCountFew: 'Leistungen',
        serviceCountMany: 'Leistungen',
        unavailableHeading: 'Angebot vorübergehend nicht verfügbar',
        unavailableCopy:
            'Wir können die aktuelle Leistungs- und Preisliste gerade nicht laden. Buchen Sie online oder rufen Sie uns an, wir bestätigen die Details.',
        ctaHeading: 'Bereit für eine Verwandlung?',
        ctaSub: 'Online buchen oder anrufen. Freie Termine finden Sie im Buchungskalender.',
        from: 'ab',
        variantsLabel: 'Varianten und Preise ansehen',
        nestedVariantHint: 'Die Variante wählen Sie während der Buchung aus.',
        items: [
            {
                title: 'Friseurleistungen',
                subtitle: 'Schnitt & Färbung',
                description:
                    'Damen- und Herrenschnitte, Wella-Färbung (Koleston Perfect, Ilumina, Color Touch) und moderne Air Touch-Technik — für Alltag, Abend und Hochzeit.',
                keyServices: [
                    'Damenhaarschnitt',
                    'Herrenhaarschnitt',
                    'Air Touch',
                    'Hochzeitsfrisur',
                    'Dauerwelle',
                    'Föhnen',
                ],
            },
            {
                title: 'Pflege-Akademie',
                subtitle: 'Botox • Goldene Proteine • Olaplex',
                description:
                    'Regenerationsbehandlungen von Kérastase, Haarbotox, goldene Proteine und Olaplex — gezielte Pflege für geschädigtes oder feines Haar.',
            },
            {
                title: 'Haarverlängerung',
                subtitle: 'HairTalk-Methode',
                description:
                    'Natürliche Haarverlängerung und -verdichtung mit der HairTalk-Methode — diskret, langlebig, auf Sie zugeschnitten.',
            },
        ],
    },
    testimonials: {
        eyebrow: 'Was unsere Kunden sagen',
        title: 'Bewertungen',
        starsLabel: 'Bewertung: {n} von 5 Sternen',
        reviewLabel: 'Bewertung von {name}',
        clientSince: 'Kundin seit {year}',
        items: [
            {
                name: 'Monika W.',
                sinceYear: 2015,
                text: 'Ich gehe seit über 8 Jahren zu Aleksandra. Kein anderer Salon hat mir je so ein gutes Farbergebnis gegeben. Mein Haar ist gesund, glänzend und genau so, wie ich es mir immer gewünscht habe.',
            },
            {
                name: 'Karolina P.',
                sinceYear: 2019,
                text: 'Haar-Botox bei Black&White ist ein ganz anderes Erlebnis als anderswo. Beratung vor der Behandlung, Erklärung jedes Schrittes — man spürt, dass das wirklich eine Akademie ist und nicht nur ein gewöhnlicher Salon.',
            },
            {
                name: 'Anna S.',
                sinceYear: 2021,
                text: 'HairTalk-Verlängerung perfekt ausgeführt, ohne sichtbare Übergänge. Ich kann kämmen, stylen und einen Pferdeschwanz tragen, ganz ohne Angst. Ich empfehle es von ganzem Herzen!',
            },
            {
                name: 'Beata K.',
                sinceYear: 2013,
                text: 'Die Atmosphäre im Salon ist außergewöhnlich — warm, professionell und ruhig. Jeder Besuch ist ein Moment der Entspannung. Aleksandra weiß immer, was für mein Haar am besten ist.',
            },
        ],
    },
    footer: {
        navigation: 'Navigation',
        hours: 'Öffnungszeiten',
        contact: 'Kontakt',
        monFri: 'Mo–Fr',
        sat: 'Sa',
        sun: 'So',
        sunday: 'Geschlossen',
        privacy: 'Datenschutzrichtlinie',
        terms: 'AGB',
        dataDeletion: 'Datenlöschung',
        copyright: `© ${new Date().getFullYear()} Salon Black & White. Alle Rechte vorbehalten.`,
    },
    hours: {
        mondayFriday: 'Mo–Fr',
        closed: 'Geschlossen',
        dayShort: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'],
        saturday: 'Sa',
    },
    bookingCta: {
        eyebrow: 'Heute buchen',
        headingLine1: 'Ihr Haar',
        headingLine2: 'verdient nur',
        headingLine3: 'das Beste.',
        since: 'seit 2011',
    },
    modal: {
        bookingServiceLabel: 'Leistungsbuchung',
        loginTitle: 'Anmelden',
        bookingTitle: 'Termin buchen',
        since: 'seit 2011',
        loginSub: 'um zum Buchungskalender zu gelangen',
        alreadyLoggedIn: 'Sie sind bereits angemeldet.',
        goToBooking: 'Zur Buchung',
        emailLabel: 'E-Mail',
        emailPlaceholder: 'ihre@email.de',
        passwordLabel: 'Passwort',
        passwordPlaceholder: '••••••••',
        errorInvalidEmail: 'Ungültige E-Mail-Adresse',
        errorEmailRequired: 'E-Mail ist erforderlich',
        errorPasswordRequired: 'Passwort ist erforderlich',
        errorLoginFailed:
            'Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Daten.',
        submitLogin: 'Anmelden & buchen',
        submitting: 'Wird angemeldet…',
        noAccount: 'Kein Konto?',
        register: 'Registrieren',
        close: 'Schließen',
        priceLabel: 'Preis',
        durationLabel: 'Dauer',
    },
    salonGallery: {
        eyebrow: 'Schauen Sie rein',
        title: 'Unser Salon',
        subtitle:
            'Ein moderner Raum, der für Ihren Komfort und Ihre Entspannung gestaltet wurde.',
        viewAll: 'Vollständige Galerie',
        workEyebrow: 'Instagram · @salon_bw',
        workTitle: 'Aus unserem Salon',
        workSubtitle: 'Einige unserer Arbeiten. Die ganze Galerie — in Farbe — ist nur einen Klick entfernt.',
        open: 'Öffnen',
    },
    gallery: {
        eyebrow: 'Instagram · Unsere Arbeiten',
        title: 'Galerie',
        subtitle:
            'Die neuesten Arbeiten unseres Teams — Frisuren, Stylings und Färbungen.',
        fallback:
            'Die Instagram-Galerie ist vorübergehend nicht verfügbar. Bitte aktualisieren.',
        loading: 'Wird geladen…',
        refresh: 'Aktualisieren',
        scrollMore: 'Scrollen Sie für mehr',
        end: 'Ende der Galerie',
        open: 'Öffnen',
        openPhoto: 'Foto öffnen',
        imageAlt: 'Arbeit des Salons Black & White',
        preview: 'Vorschau',
        lightboxClose: 'Schließen',
        lightboxPrev: 'Vorheriges Bild',
        lightboxNext: 'Nächstes Bild',
        lightboxShare: 'Bild teilen',
        lightboxDownload: 'Bild herunterladen',
        lightboxHint: 'Wischen oder Pfeiltasten verwenden',
    },
    notFound: {
        heading: 'Verlaufen?',
        sub: 'Diese Seite existiert nicht — aber Ihr Haar kann perfekt aussehen.',
        cta: 'Zurück zur Startseite',
        ctaBooking: 'Termin buchen',
    },
    contact: {
        title: 'Kontakt',
        eyebrow: 'Wir sind für Sie da',
        heading: 'Kontaktinformationen',
        phoneLabel: 'Telefon',
        emailLabel: 'E-Mail',
        addressLabel: 'Adresse',
        hoursTitle: 'Öffnungszeiten',
        dayMonFri: 'Montag – Freitag',
        daySat: 'Samstag',
        daySun: 'Sonntag',
        bookingTitle: 'Termin buchen',
        bookingDesc:
            'Buchen Sie online — wählen Sie Ihre Leistung, Ihren Stylisten und einen passenden Termin.',
        bookingBtn: 'Termin buchen',
        formSubtitle: 'Oder schreiben Sie uns',
        formTitle: 'Nachricht senden',
        formName: 'Vor- und Nachname',
        formNamePlaceholder: 'z.B. Anna Kowalska',
        formEmail: 'E-Mail-Adresse',
        formEmailPlaceholder: 'z.B. anna@gmail.com',
        formMessage: 'Nachricht',
        formMessagePlaceholder: 'Wie können wir helfen?',
        formSubmit: 'Nachricht senden',
        formSuccess: 'Nachricht gesendet — wir melden uns bald.',
        formErrorEmail: 'Ungültige E-Mail-Adresse',
        formErrorName: 'Name ist erforderlich',
        formErrorMessage: 'Nachricht ist erforderlich',
        formErrorSend:
            'Nachricht konnte nicht gesendet werden. Bitte versuchen Sie es erneut.',
        findUs: 'Finden Sie uns',
        showMap: 'Karte anzeigen',
        openInMaps: 'In Google Maps öffnen',
        formLink: 'Kontaktformular',
    },
    cookies: {
        ariaLabel: 'Cookie-Einwilligung',
        message:
            'Wir verwenden Cookies nur für anonyme Besuchsstatistiken (Google Analytics). Ohne Ihre Einwilligung wird nichts gespeichert.',
        policyLink: 'Datenschutzerklärung',
        accept: 'Akzeptieren',
        decline: 'Nur notwendige',
    },
};

export default de;

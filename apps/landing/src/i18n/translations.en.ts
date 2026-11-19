import type { Translations } from './translations';

// Loaded on demand when the visitor switches language (keeps the PL-first
// initial bundle small); see LanguageContext.
const en: Translations = {
    nav: {
        home: 'Home',
        about: 'About us',
        services: 'Services',
        gallery: 'Gallery',
        contact: 'Contact',
        login: 'Log in',
        logout: 'Log out',
        panel: 'Panel',
        booking: 'Book now',
    },
    hero: {
        eyebrow: 'Academy of Healthy Hair',
        tagline1:
            'Healthy hair is the foundation. Style — the natural result.',
        tagline2: 'Discover what your hair is truly capable of.',
        ctaSecondary: 'Discover services',
        imageAlt: 'Interior of Black & White salon',
        hoursLabel: 'Opening hours',
        scroll: 'Scroll',
        metaYears: 'years in Bytom',
        trustPill: 'Bytom · trusted since 2011',
        nearestSlot: 'Next free slot:',
    },
    trust: {
        label: 'We work with brands',
    },
    stats: [
        { suffix: '+', label: 'years of the salon' },
        { suffix: '+', label: 'satisfied clients' },
        { suffix: '★', label: 'Google rating' },
        { suffix: '+', label: 'years in the industry' },
    ],
    ticker: [
        'PASSION',
        'PROFESSIONALISM',
        'CARE',
        'BEAUTY',
        'BYTOM',
        'ACADEMY',
        'HEALTHY HAIR',
        'BLACK & WHITE',
    ],
    founder: {
        eyebrow: 'A word from the founder',
        role: 'Founder & Owner of Black & White Salon',
        since: 'since 2011',
        quote: 'For many years I have continually improved my qualifications and the quality of my services — which is why I have loyal, satisfied clients. Join them — and discover what truly healthy hair looks like.',
    },
    history: {
        eyebrow: 'Our roots',
        title: 'Our story',
        yearMap: {
            historia: '30+ yrs',
            poczatek: '2011',
            wartosci: 'today',
        },
        items: [
            {
                id: 'historia',
                title: 'Salon history',
                content:
                    "For over 30 years I built expertise in cutting and colouring techniques. I learned that working with people and fulfilling their dreams of beautiful hair is an inseparable part of a hairdresser's work. These experiences — understanding the diverse expectations of clients — gave rise to a vision of a place where every client could find a service tailored to their individual needs, delivered professionally, and experience a moment of true relaxation.",
            },
            {
                id: 'poczatek',
                title: 'The beginning',
                content:
                    'In 2011, I was able to realise my dream of exactly such a place. I designed the Black & White Salon myself, basing it on a modern yet comfortable style.',
            },
            {
                id: 'wartosci',
                title: 'Our Values',
                content:
                    'Our salon is guided by six core values: passion and creativity, professionalism and excellence, individual approach, client satisfaction, hygiene and safety, and environmental commitment.',
            },
        ],
    },
    values: {
        eyebrow: 'What we believe in',
        title: 'Our values',
        items: [
            {
                id: 'pasja',
                title: 'Passion & Creativity',
                description:
                    'We pour our whole heart into everything we do. Our passion for the art of hairdressing is an inseparable part of our work. We are creative and open to new trends, allowing us to create unique hairstyles that highlight your individuality.',
            },
            {
                id: 'profesjonalizm',
                title: 'Professionalism & Excellence',
                description:
                    'Our team of experienced hairdressers are masters of their craft. We continuously improve our skills, attending training sessions and following the latest techniques and trends. You can be sure you will receive a service at the highest level.',
            },
            {
                id: 'indywidualne',
                title: 'Individual Approach',
                description:
                    "We know every client is unique. That's why we always listen carefully to your needs and preferences. Our team is trained to understand your expectations and propose solutions tailored to your lifestyle, personality, and individual characteristics.",
            },
            {
                id: 'zadowolenie',
                title: 'Client Satisfaction',
                description:
                    'Your satisfaction is our top priority. We strive to create a friendly and comfortable atmosphere in our salon. We want you to feel at home and leave our salon with a smile on your face.',
            },
            {
                id: 'higiena',
                title: 'Hygiene & Safety',
                description:
                    'Your health and safety are our priority. We adhere to strict hygiene standards and ensure our salon is clean and safe. All our tools and equipment are carefully disinfected to provide a safe environment during your visit.',
            },
            {
                id: 'srodowisko',
                title: 'Environmental Commitment',
                description:
                    'We are aware of the impact our industry can have on the environment. We take steps to reduce our ecological footprint, use eco-friendly products, minimise waste, and engage in sustainable practices.',
            },
        ],
    },
    services: {
        eyebrow: 'How we can help',
        title: 'Our services',
        featured: 'Featured',
        learnMore: 'Learn more',
        viewAll: 'Full service menu',
        teaserSubtitle:
            'Healthy hair is the starting point — we combine advanced regenerative treatments with precise styling and colouring.',
        pageEyebrow: 'Pricing & Services',
        pageHeading: 'Our Services',
        pageDesc:
            'Professional hairdressing, barber, and hair care services for women and men. Every visit is tailored to you.',
        bookBtn: 'Book',
        serviceCount1: 'service',
        serviceCountFew: 'services',
        serviceCountMany: 'services',
        unavailableHeading: 'Services temporarily unavailable',
        unavailableCopy:
            'We cannot load the current service list and prices right now. Book online or call us and we will confirm the details.',
        ctaHeading: 'Ready for a transformation?',
        ctaSub: 'Book online or call us. Find available appointments in the booking calendar.',
        from: 'from',
        variantsLabel: 'View options and prices',
        nestedVariantHint: 'Choose the service option during booking.',
        items: [
            {
                title: 'Hairdressing',
                subtitle: 'Cuts & Colouring',
                description:
                    "Women's and men's cuts, Wella colouring (Koleston Perfect, Ilumina, Color Touch) and the modern Air Touch technique — everyday, evening and wedding styles.",
                keyServices: [
                    "Women's cut",
                    "Men's cut",
                    'Air Touch',
                    'Wedding style',
                    'Permanent wave',
                    'Blow-dry',
                ],
            },
            {
                title: 'Care Academy',
                subtitle: 'Botox • Golden Proteins • Olaplex',
                description:
                    'Regenerative treatments by Kérastase, hair botox, golden proteins and Olaplex — dedicated care for damaged or fine hair.',
            },
            {
                title: 'Hair Extensions',
                subtitle: 'HairTalk Method',
                description:
                    'Natural hair extensions and thickening using the HairTalk method — discreet, lasting, tailored to you.',
            },
        ],
    },
    testimonials: {
        eyebrow: 'What our clients say',
        title: 'Reviews',
        starsLabel: 'Rating: {n} out of 5 stars',
        reviewLabel: 'Review by {name}',
        clientSince: 'Client since {year}',
        items: [
            {
                name: 'Monika W.',
                sinceYear: 2015,
                text: 'I have been coming to Aleksandra for over 8 years. No other salon has ever given me such a great colouring result. My hair is healthy, shiny, and exactly how I dreamed it would be.',
            },
            {
                name: 'Karolina P.',
                sinceYear: 2019,
                text: 'Hair botox at Black&White is a completely different experience than elsewhere. Consultation before the treatment, every step clearly explained — you can feel this is truly an academy, not just a regular salon.',
            },
            {
                name: 'Anna S.',
                sinceYear: 2021,
                text: 'HairTalk extensions done perfectly, with no visible transitions. I can comb, style, and wear a ponytail without any fear. I recommend it with all my heart!',
            },
            {
                name: 'Beata K.',
                sinceYear: 2013,
                text: 'The atmosphere in the salon is exceptional — warm, professional, and calm. Every visit is a moment of relaxation. Aleksandra always knows what will be best for my hair.',
            },
        ],
    },
    footer: {
        navigation: 'Navigation',
        hours: 'Hours',
        contact: 'Contact',
        monFri: 'Mon–Fri',
        sat: 'Sat',
        sun: 'Sun',
        sunday: 'Closed',
        privacy: 'Privacy policy',
        terms: 'Terms & conditions',
        dataDeletion: 'Data deletion',
        copyright: `© ${new Date().getFullYear()} Black & White Salon. All rights reserved.`,
    },
    hours: {
        mondayFriday: 'Mon–Fri',
        closed: 'Closed',
        dayShort: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        saturday: 'Sat',
    },
    bookingCta: {
        eyebrow: 'Book today',
        headingLine1: 'Your hair',
        headingLine2: 'deserves only',
        headingLine3: 'the best.',
        since: 'since 2011',
    },
    modal: {
        bookingServiceLabel: 'Service booking',
        loginTitle: 'Log in',
        bookingTitle: 'Book appointment',
        since: 'since 2011',
        loginSub: 'to access the booking calendar',
        alreadyLoggedIn: 'You are already logged in.',
        goToBooking: 'Go to booking',
        emailLabel: 'Email',
        emailPlaceholder: 'your@email.com',
        passwordLabel: 'Password',
        passwordPlaceholder: '••••••••',
        errorInvalidEmail: 'Invalid email address',
        errorEmailRequired: 'Email is required',
        errorPasswordRequired: 'Password is required',
        errorLoginFailed:
            'Login failed. Check your credentials and try again.',
        submitLogin: 'Log in & book',
        submitting: 'Logging in…',
        noAccount: 'No account?',
        register: 'Register',
        close: 'Close',
        priceLabel: 'Price',
        durationLabel: 'Duration',
    },
    salonGallery: {
        eyebrow: 'Take a look inside',
        title: 'Our salon',
        subtitle:
            'A modern space designed with your comfort and relaxation in mind.',
        viewAll: 'See full gallery',
        workEyebrow: 'Instagram · @salon_bw',
        workTitle: 'From our chairs',
        workSubtitle: 'A few pieces of our work. More in the full gallery.',
        open: 'Open',
    },
    gallery: {
        eyebrow: 'Instagram · Our work',
        title: 'Gallery',
        subtitle:
            'The latest work by our team — hairstyles, styling and colouring.',
        fallback:
            'The Instagram gallery is temporarily unavailable. Try refreshing.',
        loading: 'Loading…',
        refresh: 'Refresh',
        scrollMore: 'Scroll to see more',
        end: 'End of gallery',
        open: 'Open',
        openPhoto: 'Open photo',
        imageAlt: 'Work by Black & White salon',
        preview: 'Preview',
        lightboxClose: 'Close',
        lightboxPrev: 'Previous image',
        lightboxNext: 'Next image',
        lightboxShare: 'Share image',
        lightboxDownload: 'Download image',
        lightboxHint: 'Swipe or use arrows',
    },
    notFound: {
        heading: 'Lost your way?',
        sub: "This page doesn't exist — but your hair can look perfect.",
        cta: 'Back to home',
        ctaBooking: 'Book an appointment',
    },
    contact: {
        title: 'Contact',
        eyebrow: 'We are here for you',
        heading: 'Contact information',
        phoneLabel: 'Phone',
        emailLabel: 'E-mail',
        addressLabel: 'Address',
        hoursTitle: 'Opening hours',
        dayMonFri: 'Monday – Friday',
        daySat: 'Saturday',
        daySun: 'Sunday',
        bookingTitle: 'Book an appointment',
        bookingDesc:
            'Book online — choose your service, stylist and a time that works for you.',
        bookingBtn: 'Book now',
        formSubtitle: 'Or send us a message',
        formTitle: 'Send a message',
        formName: 'Full name',
        formNamePlaceholder: 'e.g. Anna Kowalska',
        formEmail: 'Email address',
        formEmailPlaceholder: 'e.g. anna@gmail.com',
        formMessage: 'Message',
        formMessagePlaceholder: 'How can we help?',
        formSubmit: 'Send message',
        formSuccess: 'Message sent — we will be in touch soon.',
        formErrorEmail: 'Invalid email address',
        formErrorName: 'Name is required',
        formErrorMessage: 'Message is required',
        formErrorSend: 'Failed to send message. Please try again.',
        findUs: 'Find us',
        showMap: 'Show map',
        openInMaps: 'Open in Google Maps',
        formLink: 'Contact form',
    },
    cookies: {
        ariaLabel: 'Cookie consent',
        message:
            'We use cookies only for anonymous visit statistics (Google Analytics). Nothing is stored without your consent.',
        policyLink: 'Privacy policy',
        accept: 'Accept',
        decline: 'Essential only',
    },
};

export default en;

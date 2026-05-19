export type Language = 'pl' | 'en' | 'de';

export const LANGUAGES: { code: Language; label: string }[] = [
    { code: 'pl', label: 'PL' },
    { code: 'en', label: 'EN' },
    { code: 'de', label: 'DE' },
];

const t = {
    pl: {
        nav: {
            home: 'Start',
            services: 'Usługi',
            gallery: 'Galeria',
            contact: 'Kontakt',
            login: 'Zaloguj',
            logout: 'Wyloguj',
            panel: 'Panel',
            booking: 'Umów wizytę',
        },
        hero: {
            eyebrow: 'Akademia Zdrowych Włosów',
            tagline1: 'Salon, gdzie każdy detal ma znaczenie.',
            tagline2: 'Włosy to Twoja korona.',
            ctaSecondary: 'Odkryj usługi',
            imageAlt: 'Wnętrze salonu Black & White',
            hoursLabel: 'Godziny otwarcia',
            scroll: 'Scroll',
            metaYears: 'lat z Bytomiem',
        },
        stats: [
            { suffix: '+', label: 'lat doświadczenia' },
            { suffix: '', label: 'rok założenia' },
            { suffix: '', label: 'kluczowych wartości' },
            { suffix: '★', label: 'ocena klientek' },
        ],
        ticker: ['PASJA', 'PROFESJONALIZM', 'PIELĘGNACJA', 'PIĘKNO', 'BYTOM', 'AKADEMIA', 'ZDROWE WŁOSY', 'BLACK & WHITE'],
        founder: {
            eyebrow: 'Słowo od założycielki',
            role: 'Założycielka & Właścicielka Salon Black & White',
            since: 'od 2011 roku',
        },
        history: {
            eyebrow: 'Skąd pochodzimy',
            title: 'Nasza historia',
            yearMap: { historia: '30+ lat', poczatek: '2011', wartosci: 'dziś' },
            items: [
                {
                    id: 'historia',
                    title: 'Historia salonu',
                    content: 'Przez ponad 30 lat zdobywałam kompetencje w technikach strzyżenia oraz koloryzacji. Nauczyłam się, że nieodłączną częścią pracy fryzjera jest praca z ludźmi i spełnianie ich fantazji o pięknych włosach. Dzięki tym doświadczeniom, poznając różnorodne oczekiwania klientów, powstała wizja miejsca w którym każdy klient znalazłby usługę dostosowaną do indywidualnych potrzeb, dostarczoną w profesjonalny sposób oraz będzie to dla niego chwila prawdziwego relaksu.',
                },
                {
                    id: 'poczatek',
                    title: 'Początek',
                    content: 'W 2011 roku udało mi się zrealizować moje marzenie o takim właśnie miejscu. Salon Black & White urządziłam według własnego projektu bazując na nowoczesnym ale też komfortowym stylu.',
                },
                {
                    id: 'wartosci',
                    title: 'Nasze Wartości',
                    content: 'W naszym salonie kierujemy się sześcioma kluczowymi wartościami: pasją i kreatywnością, profesjonalizmem i doskonałością, indywidualnym podejściem, zadowoleniem klienta, higieną i bezpieczeństwem oraz zaangażowaniem w środowisko.',
                },
            ],
        },
        values: {
            eyebrow: 'To, w co wierzymy',
            title: 'Nasze wartości',
            items: [
                { id: 'pasja', title: 'Pasja i Kreatywność', description: 'W naszym salonie fryzjerskim wkładamy całe serce w to, co robimy. Nasza pasja do sztuki fryzjerskiej jest nieodłączną częścią naszej pracy. Jesteśmy kreatywni i otwarci na nowe trendy, dzięki czemu możemy stworzyć dla Ciebie wyjątkowe i niepowtarzalne fryzury, które podkreślą Twoją indywidualność.' },
                { id: 'profesjonalizm', title: 'Profesjonalizm i Doskonałość', description: 'W naszym zespole mamy doświadczonych fryzjerów, którzy są mistrzami swojego fachu. Stale doskonalimy swoje umiejętności, uczestnicząc w szkoleniach i śledząc najnowsze techniki i trendy fryzjerskie. Możesz mieć pewność, że otrzymasz usługę na najwyższym poziomie.' },
                { id: 'indywidualne', title: 'Indywidualne Podejście', description: 'Wiemy, że każdy klient jest wyjątkowy. Dlatego zawsze słuchamy uważnie Twoich potrzeb i preferencji. Nasz zespół fryzjerów jest wyszkolony, aby zrozumieć Twoje oczekiwania i zaproponować rozwiązania dopasowane do Twojego stylu życia, osobowości i indywidualnych cech.' },
                { id: 'zadowolenie', title: 'Zadowolenie Klienta', description: 'Twoje zadowolenie jest dla nas najważniejsze. Dlatego staramy się stworzyć przyjazną i komfortową atmosferę w naszym salonie. Chcemy, abyś czuł się jak w domu i opuszczał nasz salon z uśmiechem na twarzy.' },
                { id: 'higiena', title: 'Higiena i Bezpieczeństwo', description: 'Twoje zdrowie i bezpieczeństwo są dla nas priorytetem. Przestrzegamy surowych standardów higieny i dbamy o to, aby nasz salon był czysty i bezpieczny. Wszystkie nasze narzędzia i sprzęt są starannie dezynfekowane.' },
                { id: 'srodowisko', title: 'Zaangażowanie w Środowisko', description: 'Jesteśmy świadomi wpływu, jaki nasza branża może mieć na środowisko. Dlatego podejmujemy działania mające na celu ograniczenie naszego śladu ekologicznego. Stosujemy produkty przyjazne dla środowiska i angażujemy się w praktyki zrównoważonego rozwoju.' },
            ],
        },
        services: {
            eyebrow: 'Czym możemy służyć',
            title: 'Nasze usługi',
            featured: 'Polecane',
            learnMore: 'Dowiedz się więcej',
            viewAll: 'Pełna oferta usług',
            items: [
                { title: 'Fryzjerstwo', subtitle: 'Strzyżenie & Koloryzacja', description: 'Cięcia damskie i męskie, koloryzacja, balayage, ombre — tworzone z pasją przez doświadczonych stylistów.' },
                { title: 'Akademia Pielęgnacji', subtitle: 'Botox • Złote Proteiny • SPA', description: 'Zabiegi regeneracyjne Kérastase i Nioxin, botox na włosy oraz luksusowe SPA dla zniszczonych lub cienkich włosów.' },
                { title: 'Przedłużanie Włosów', subtitle: 'Metoda HairTalk', description: 'Naturalne przedłużanie i zagęszczanie włosów metodą HairTalk — dyskretne, trwałe, dopasowane do Ciebie.' },
            ],
        },
        testimonials: {
            eyebrow: 'Co mówią klientki',
            title: 'Opinie',
            starsLabel: 'Ocena: {n} na 5 gwiazdek',
            reviewLabel: 'Opinia {name}',
            clientSince: 'Klientka od {year}',
        },
        footer: {
            navigation: 'Nawigacja',
            hours: 'Godziny',
            contact: 'Kontakt',
            monFri: 'Pn–Pt',
            sat: 'Sob',
            sun: 'Ndz',
            sunday: 'Zamknięte',
            privacy: 'Polityka prywatności',
            terms: 'Regulamin',
            copyright: `© ${new Date().getFullYear()} Salon Black & White. Wszystkie prawa zastrzeżone.`,
        },
        hours: {
            mondayFriday: 'Pn–Pt',
            saturday: 'Sob',
        },
        notFound: {
            heading: 'Zgubiłaś się?',
            sub: 'Ta strona nie istnieje — ale Twoje włosy mogą wyglądać perfekcyjnie.',
            cta: 'Wróć na stronę główną',
            ctaBooking: 'Umów wizytę',
        },
        contact: {
            title: 'Kontakt',
            heading: 'Informacje kontaktowe',
            formTitle: 'Wyślij wiadomość',
            hoursTitle: 'Godziny otwarcia',
        },
    },
    en: {
        nav: {
            home: 'Home',
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
            tagline1: 'A salon where every detail matters.',
            tagline2: 'Your hair is your crown.',
            ctaSecondary: 'Discover services',
            imageAlt: 'Interior of Black & White salon',
            hoursLabel: 'Opening hours',
            scroll: 'Scroll',
            metaYears: 'years in Bytom',
        },
        stats: [
            { suffix: '+', label: 'years of experience' },
            { suffix: '', label: 'year founded' },
            { suffix: '', label: 'core values' },
            { suffix: '★', label: 'client rating' },
        ],
        ticker: ['PASSION', 'PROFESSIONALISM', 'CARE', 'BEAUTY', 'BYTOM', 'ACADEMY', 'HEALTHY HAIR', 'BLACK & WHITE'],
        founder: {
            eyebrow: 'A word from the founder',
            role: 'Founder & Owner of Black & White Salon',
            since: 'since 2011',
        },
        history: {
            eyebrow: 'Our roots',
            title: 'Our story',
            yearMap: { historia: '30+ yrs', poczatek: '2011', wartosci: 'today' },
            items: [
                {
                    id: 'historia',
                    title: 'Salon history',
                    content: 'For over 30 years I built expertise in cutting and colouring techniques. I learned that working with people and fulfilling their dreams of beautiful hair is an inseparable part of a hairdresser\'s work. These experiences — understanding the diverse expectations of clients — gave rise to a vision of a place where every client could find a service tailored to their individual needs, delivered professionally, and experience a moment of true relaxation.',
                },
                {
                    id: 'poczatek',
                    title: 'The beginning',
                    content: 'In 2011, I was able to realise my dream of exactly such a place. I designed the Black & White Salon myself, basing it on a modern yet comfortable style.',
                },
                {
                    id: 'wartosci',
                    title: 'Our Values',
                    content: 'Our salon is guided by six core values: passion and creativity, professionalism and excellence, individual approach, client satisfaction, hygiene and safety, and environmental commitment.',
                },
            ],
        },
        values: {
            eyebrow: 'What we believe in',
            title: 'Our values',
            items: [
                { id: 'pasja', title: 'Passion & Creativity', description: 'We pour our whole heart into everything we do. Our passion for the art of hairdressing is an inseparable part of our work. We are creative and open to new trends, allowing us to create unique hairstyles that highlight your individuality.' },
                { id: 'profesjonalizm', title: 'Professionalism & Excellence', description: 'Our team of experienced hairdressers are masters of their craft. We continuously improve our skills, attending training sessions and following the latest techniques and trends. You can be sure you will receive a service at the highest level.' },
                { id: 'indywidualne', title: 'Individual Approach', description: 'We know every client is unique. That\'s why we always listen carefully to your needs and preferences. Our team is trained to understand your expectations and propose solutions tailored to your lifestyle, personality, and individual characteristics.' },
                { id: 'zadowolenie', title: 'Client Satisfaction', description: 'Your satisfaction is our top priority. We strive to create a friendly and comfortable atmosphere in our salon. We want you to feel at home and leave our salon with a smile on your face.' },
                { id: 'higiena', title: 'Hygiene & Safety', description: 'Your health and safety are our priority. We adhere to strict hygiene standards and ensure our salon is clean and safe. All our tools and equipment are carefully disinfected to provide a safe environment during your visit.' },
                { id: 'srodowisko', title: 'Environmental Commitment', description: 'We are aware of the impact our industry can have on the environment. We take steps to reduce our ecological footprint, use eco-friendly products, minimise waste, and engage in sustainable practices.' },
            ],
        },
        services: {
            eyebrow: 'How we can help',
            title: 'Our services',
            featured: 'Featured',
            learnMore: 'Learn more',
            viewAll: 'Full service menu',
            items: [
                { title: 'Hairdressing', subtitle: 'Cuts & Colouring', description: 'Women\'s and men\'s cuts, colouring, balayage, ombre — crafted with passion by experienced stylists.' },
                { title: 'Care Academy', subtitle: 'Botox • Golden Proteins • SPA', description: 'Regenerative treatments by Kérastase and Nioxin, hair botox, and luxury SPA for damaged or fine hair.' },
                { title: 'Hair Extensions', subtitle: 'HairTalk Method', description: 'Natural hair extensions and thickening using the HairTalk method — discreet, lasting, tailored to you.' },
            ],
        },
        testimonials: {
            eyebrow: 'What our clients say',
            title: 'Reviews',
            starsLabel: 'Rating: {n} out of 5 stars',
            reviewLabel: 'Review by {name}',
            clientSince: 'Client since {year}',
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
            copyright: `© ${new Date().getFullYear()} Black & White Salon. All rights reserved.`,
        },
        hours: {
            mondayFriday: 'Mon–Fri',
            saturday: 'Sat',
        },
        notFound: {
            heading: 'Lost your way?',
            sub: 'This page doesn\'t exist — but your hair can look perfect.',
            cta: 'Back to home',
            ctaBooking: 'Book an appointment',
        },
        contact: {
            title: 'Contact',
            heading: 'Contact information',
            formTitle: 'Send a message',
            hoursTitle: 'Opening hours',
        },
    },
    de: {
        nav: {
            home: 'Start',
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
            tagline1: 'Ein Salon, wo jedes Detail zählt.',
            tagline2: 'Ihr Haar ist Ihre Krone.',
            ctaSecondary: 'Leistungen entdecken',
            imageAlt: 'Interieur des Salons Black & White',
            hoursLabel: 'Öffnungszeiten',
            scroll: 'Scrollen',
            metaYears: 'Jahre in Bytom',
        },
        stats: [
            { suffix: '+', label: 'Jahre Erfahrung' },
            { suffix: '', label: 'Gründungsjahr' },
            { suffix: '', label: 'Kernwerte' },
            { suffix: '★', label: 'Kundenbewertung' },
        ],
        ticker: ['LEIDENSCHAFT', 'PROFESSIONALITÄT', 'PFLEGE', 'SCHÖNHEIT', 'BYTOM', 'AKADEMIE', 'GESUNDES HAAR', 'BLACK & WHITE'],
        founder: {
            eyebrow: 'Ein Wort von der Gründerin',
            role: 'Gründerin & Inhaberin des Salons Black & White',
            since: 'seit 2011',
        },
        history: {
            eyebrow: 'Woher wir kommen',
            title: 'Unsere Geschichte',
            yearMap: { historia: '30+ J.', poczatek: '2011', wartosci: 'heute' },
            items: [
                {
                    id: 'historia',
                    title: 'Salongeschichte',
                    content: 'Über 30 Jahre lang habe ich Kompetenzen in Schnitt- und Färbetechniken aufgebaut. Ich lernte, dass die Arbeit mit Menschen und die Erfüllung ihrer Träume von schönem Haar ein untrennbarer Teil der Arbeit eines Friseurs ist. Durch diese Erfahrungen entstand die Vision eines Ortes, an dem jeder Kunde eine auf seine individuellen Bedürfnisse zugeschnittene Dienstleistung professionell und entspannt erleben kann.',
                },
                {
                    id: 'poczatek',
                    title: 'Der Anfang',
                    content: 'Im Jahr 2011 konnte ich meinen Traum von einem solchen Ort verwirklichen. Ich entwarf den Salon Black & White selbst, basierend auf einem modernen, aber komfortablen Stil.',
                },
                {
                    id: 'wartosci',
                    title: 'Unsere Werte',
                    content: 'Unser Salon orientiert sich an sechs Kernwerten: Leidenschaft und Kreativität, Professionalität und Exzellenz, individuellem Ansatz, Kundenzufriedenheit, Hygiene und Sicherheit sowie Umweltengagement.',
                },
            ],
        },
        values: {
            eyebrow: 'Woran wir glauben',
            title: 'Unsere Werte',
            items: [
                { id: 'pasja', title: 'Leidenschaft & Kreativität', description: 'Wir stecken unser ganzes Herz in alles, was wir tun. Unsere Leidenschaft für die Friseurkunst ist ein untrennbarer Teil unserer Arbeit. Wir sind kreativ und offen für neue Trends, sodass wir einzigartige Frisuren schaffen können, die Ihre Individualität unterstreichen.' },
                { id: 'profesjonalizm', title: 'Professionalität & Exzellenz', description: 'Unser Team aus erfahrenen Friseuren sind Meister ihres Fachs. Wir verbessern unsere Fähigkeiten ständig, nehmen an Schulungen teil und verfolgen die neuesten Techniken und Trends. Sie können sicher sein, einen Service auf höchstem Niveau zu erhalten.' },
                { id: 'indywidualne', title: 'Individueller Ansatz', description: 'Wir wissen, dass jeder Kunde einzigartig ist. Deshalb hören wir immer sorgfältig auf Ihre Bedürfnisse und Vorlieben. Unser Team ist darauf geschult, Ihre Erwartungen zu verstehen und Lösungen vorzuschlagen, die zu Ihrem Lebensstil passen.' },
                { id: 'zadowolenie', title: 'Kundenzufriedenheit', description: 'Ihre Zufriedenheit ist unser oberstes Ziel. Wir streben danach, eine freundliche und komfortable Atmosphäre in unserem Salon zu schaffen. Wir möchten, dass Sie sich wie zu Hause fühlen und unser Salon mit einem Lächeln verlassen.' },
                { id: 'higiena', title: 'Hygiene & Sicherheit', description: 'Ihre Gesundheit und Sicherheit haben für uns Priorität. Wir halten strenge Hygienestandards ein und sorgen dafür, dass unser Salon sauber und sicher ist. Alle unsere Werkzeuge und Geräte werden sorgfältig desinfiziert.' },
                { id: 'srodowisko', title: 'Umweltengagement', description: 'Wir sind uns des Einflusses bewusst, den unsere Branche auf die Umwelt haben kann. Wir ergreifen Maßnahmen zur Reduzierung unseres ökologischen Fußabdrucks, verwenden umweltfreundliche Produkte und engagieren uns für nachhaltige Praktiken.' },
            ],
        },
        services: {
            eyebrow: 'Wie wir helfen können',
            title: 'Unsere Leistungen',
            featured: 'Empfohlen',
            learnMore: 'Mehr erfahren',
            viewAll: 'Vollständiges Angebot',
            items: [
                { title: 'Friseurleistungen', subtitle: 'Schnitt & Färbung', description: 'Damen- und Herrenschnitte, Färbung, Balayage, Ombré — mit Leidenschaft von erfahrenen Stylisten gestaltet.' },
                { title: 'Pflege-Akademie', subtitle: 'Botox • Goldene Proteine • SPA', description: 'Regenerationsbehandlungen von Kérastase und Nioxin, Haarbotox und luxuriöses SPA für geschädigtes oder feines Haar.' },
                { title: 'Haarverlängerung', subtitle: 'HairTalk-Methode', description: 'Natürliche Haarverlängerung und -verdichtung mit der HairTalk-Methode — diskret, langlebig, auf Sie zugeschnitten.' },
            ],
        },
        testimonials: {
            eyebrow: 'Was unsere Kunden sagen',
            title: 'Bewertungen',
            starsLabel: 'Bewertung: {n} von 5 Sternen',
            reviewLabel: 'Bewertung von {name}',
            clientSince: 'Kundin seit {year}',
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
            copyright: `© ${new Date().getFullYear()} Salon Black & White. Alle Rechte vorbehalten.`,
        },
        hours: {
            mondayFriday: 'Mo–Fr',
            saturday: 'Sa',
        },
        notFound: {
            heading: 'Verlaufen?',
            sub: 'Diese Seite existiert nicht — aber Ihr Haar kann perfekt aussehen.',
            cta: 'Zurück zur Startseite',
            ctaBooking: 'Termin buchen',
        },
        contact: {
            title: 'Kontakt',
            heading: 'Kontaktinformationen',
            formTitle: 'Nachricht senden',
            hoursTitle: 'Öffnungszeiten',
        },
    },
} as const;

export default t;

type DeepMutable<T> = T extends readonly (infer U)[]
    ? DeepMutable<U>[]
    : T extends object
    ? { [K in keyof T]: DeepMutable<T[K]> }
    : string;

export type Translations = DeepMutable<typeof t.pl>;

export type Language = 'pl' | 'en' | 'de';

export const LANGUAGES: { code: Language; label: string }[] = [
    { code: 'pl', label: 'PL' },
    { code: 'en', label: 'EN' },
    { code: 'de', label: 'DE' },
];
export const pl = {
    nav: {
        home: 'Start',
        about: 'O nas',
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
        tagline1: 'Zdrowe włosy to fundament. Styl — naturalny efekt.',
        tagline2: 'Odkryj, co naprawdę mogą Twoje włosy.',
        ctaSecondary: 'Odkryj usługi',
        imageAlt: 'Wnętrze salonu Black & White',
        hoursLabel: 'Godziny otwarcia',
        scroll: 'Przewiń',
        metaYears: 'lat z Bytomiem',
        trustPill: 'Bytom · zaufanie od 2011',
        nearestSlot: 'Najbliższy wolny termin:',
    },
    trust: {
        label: 'Pracujemy na markach',
    },
    stats: [
        { suffix: '+', label: 'lat salonu' },
        { suffix: '+', label: 'zadowolonych klientek' },
        { suffix: '★', label: 'ocena Google' },
        { suffix: '+', label: 'lat w branży' },
    ],
    ticker: [
        'PASJA',
        'PROFESJONALIZM',
        'PIELĘGNACJA',
        'PIĘKNO',
        'BYTOM',
        'AKADEMIA',
        'ZDROWE WŁOSY',
        'BLACK & WHITE',
    ],
    founder: {
        eyebrow: 'Słowo od założycielki',
        role: 'Założycielka & Właścicielka Salon Black & White',
        since: 'od 2011 roku',
        quote: 'Od wielu lat stale podnoszę swoje kwalifikacje oraz jakość moich usług, dzięki temu mam stałych zadowolonych klientów. Dołącz do nich — i przekonaj się, jak wyglądają naprawdę zdrowe włosy.',
    },
    history: {
        eyebrow: 'Skąd pochodzimy',
        title: 'Nasza historia',
        yearMap: {
            historia: '30+ lat',
            poczatek: '2011',
            wartosci: 'dziś',
        },
        items: [
            {
                id: 'historia',
                title: 'Historia salonu',
                content:
                    'Przez ponad 30 lat zdobywałam kompetencje w technikach strzyżenia oraz koloryzacji. Nauczyłam się, że nieodłączną częścią pracy fryzjera jest praca z ludźmi i spełnianie ich fantazji o pięknych włosach. Dzięki tym doświadczeniom, poznając różnorodne oczekiwania klientów, powstała wizja miejsca w którym każdy klient znalazłby usługę dostosowaną do indywidualnych potrzeb, dostarczoną w profesjonalny sposób oraz będzie to dla niego chwila prawdziwego relaksu.',
            },
            {
                id: 'poczatek',
                title: 'Początek',
                content:
                    'W 2011 roku udało mi się zrealizować moje marzenie o takim właśnie miejscu. Salon Black & White urządziłam według własnego projektu bazując na nowoczesnym ale też komfortowym stylu.',
            },
            {
                id: 'wartosci',
                title: 'Nasze Wartości',
                content:
                    'W naszym salonie kierujemy się sześcioma kluczowymi wartościami: pasją i kreatywnością, profesjonalizmem i doskonałością, indywidualnym podejściem, zadowoleniem klienta, higieną i bezpieczeństwem oraz zaangażowaniem w środowisko.',
            },
        ],
    },
    values: {
        eyebrow: 'To, w co wierzymy',
        title: 'Nasze wartości',
        items: [
            {
                id: 'pasja',
                title: 'Pasja i Kreatywność',
                description:
                    'W naszym salonie fryzjerskim wkładamy całe serce w to, co robimy. Nasza pasja do sztuki fryzjerskiej jest nieodłączną częścią naszej pracy. Jesteśmy kreatywni i otwarci na nowe trendy, dzięki czemu możemy stworzyć dla Ciebie wyjątkowe i niepowtarzalne fryzury, które podkreślą Twoją indywidualność.',
            },
            {
                id: 'profesjonalizm',
                title: 'Profesjonalizm i Doskonałość',
                description:
                    'W naszym zespole mamy doświadczonych fryzjerów, którzy są mistrzami swojego fachu. Stale doskonalimy swoje umiejętności, uczestnicząc w szkoleniach i śledząc najnowsze techniki i trendy fryzjerskie. Możesz mieć pewność, że otrzymasz usługę na najwyższym poziomie.',
            },
            {
                id: 'indywidualne',
                title: 'Indywidualne Podejście',
                description:
                    'Wiemy, że każdy klient jest wyjątkowy. Dlatego zawsze słuchamy uważnie Twoich potrzeb i preferencji. Nasz zespół fryzjerów jest wyszkolony, aby zrozumieć Twoje oczekiwania i zaproponować rozwiązania dopasowane do Twojego stylu życia, osobowości i indywidualnych cech.',
            },
            {
                id: 'zadowolenie',
                title: 'Zadowolenie Klienta',
                description:
                    'Twoje zadowolenie jest dla nas najważniejsze. Dlatego staramy się stworzyć przyjazną i komfortową atmosferę w naszym salonie. Chcemy, abyś czuł się jak w domu i opuszczał nasz salon z uśmiechem na twarzy.',
            },
            {
                id: 'higiena',
                title: 'Higiena i Bezpieczeństwo',
                description:
                    'Twoje zdrowie i bezpieczeństwo są dla nas priorytetem. Przestrzegamy surowych standardów higieny i dbamy o to, aby nasz salon był czysty i bezpieczny. Wszystkie nasze narzędzia i sprzęt są starannie dezynfekowane.',
            },
            {
                id: 'srodowisko',
                title: 'Zaangażowanie w Środowisko',
                description:
                    'Jesteśmy świadomi wpływu, jaki nasza branża może mieć na środowisko. Dlatego podejmujemy działania mające na celu ograniczenie naszego śladu ekologicznego. Stosujemy produkty przyjazne dla środowiska i angażujemy się w praktyki zrównoważonego rozwoju.',
            },
        ],
    },
    services: {
        eyebrow: 'Czym możemy służyć',
        title: 'Nasze usługi',
        featured: 'Polecane',
        learnMore: 'Dowiedz się więcej',
        viewAll: 'Pełna oferta usług',
        teaserSubtitle:
            'Zdrowie włosów jest punktem wyjścia — dlatego łączymy zaawansowane zabiegi regeneracyjne z precyzyjną stylistyką i koloryzacją.',
        pageEyebrow: 'Cennik & Oferta',
        pageHeading: 'Nasze Usługi',
        pageDesc:
            'Profesjonalne usługi fryzjerskie, barber i pielęgnacja włosów dla kobiet i mężczyzn. Każda wizyta to indywidualne podejście.',
        bookBtn: 'Umów',
        serviceCount1: 'usługa',
        serviceCountFew: 'usługi',
        serviceCountMany: 'usług',
        unavailableHeading: 'Oferta chwilowo niedostępna',
        unavailableCopy:
            'Nie możemy teraz pobrać aktualnej listy usług i cen. Skorzystaj z rezerwacji online albo zadzwoń, a potwierdzimy szczegóły.',
        ctaHeading: 'Gotowa/-y na metamorfozę?',
        ctaSub: 'Zarezerwuj termin online lub zadzwoń. Dostępne terminy znajdziesz w kalendarzu rezerwacji.',
        from: 'od',
        variantsLabel: 'Sprawdź warianty i ceny',
        nestedVariantHint: 'Wariant usługi wybierzesz podczas rezerwacji.',
        items: [
            {
                title: 'Fryzjerstwo',
                subtitle: 'Strzyżenie & Koloryzacja',
                description:
                    'Cięcia damskie i męskie, koloryzacja Wella (Koleston Perfect, Ilumina, Color Touch) i nowoczesna technika Air Touch — fryzury codzienne, wieczorowe i ślubne.',
                keyServices: [
                    'Strzyżenie damskie',
                    'Strzyżenie męskie',
                    'Air Touch',
                    'Fryzura ślubna',
                    'Trwała ondulacja',
                    'Modelowanie',
                ],
            },
            {
                title: 'Akademia Pielęgnacji',
                subtitle: 'Botox • Złote Proteiny • Olaplex',
                description:
                    'Zabiegi regeneracyjne Kérastase, botox na włosy, złote proteiny oraz Olaplex — dedykowana pielęgnacja dla zniszczonych i cienkich włosów.',
            },
            {
                title: 'Przedłużanie Włosów',
                subtitle: 'Metoda HairTalk',
                description:
                    'Naturalne przedłużanie i zagęszczanie włosów metodą HairTalk — dyskretne, trwałe, dopasowane do Ciebie.',
            },
        ],
    },
    testimonials: {
        eyebrow: 'Co mówią klientki',
        title: 'Opinie',
        starsLabel: 'Ocena: {n} na 5 gwiazdek',
        reviewLabel: 'Opinia {name}',
        clientSince: 'Klientka od {year}',
        items: [
            {
                name: 'Monika W.',
                sinceYear: 2015,
                text: 'Chodzę do Aleksandry od ponad 8 lat. Nigdy żaden inny salon nie dał mi tak dobrego efektu koloryzacji. Moje włosy są zdrowe, lśniące i dokładnie takie, jak sobie wymarzyłam.',
            },
            {
                name: 'Karolina P.',
                sinceYear: 2019,
                text: 'Botox na włosy w Black&White to zupełnie inne doświadczenie niż gdzie indziej. Konsultacja przed zabiegiem, wyjaśnienie każdego kroku — czuć, że to naprawdę akademia, nie zwykły salon.',
            },
            {
                name: 'Anna S.',
                sinceYear: 2021,
                text: 'Przedłużanie metodą HairTalk — wykonane perfekcyjnie, nie widać żadnych przejść. Mogę czesać, upinać i nosić kucyk bez żadnego strachu. Polecam z całego serca!',
            },
            {
                name: 'Beata K.',
                sinceYear: 2013,
                text: 'Atmosfera w salonie jest wyjątkowa — ciepła, profesjonalna i spokojna. Każda wizyta to chwila relaksu. Aleksandra zawsze wie, co będzie najlepsze dla moich włosów.',
            },
        ],
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
        dataDeletion: 'Usuwanie danych',
        copyright: `© ${new Date().getFullYear()} Salon Black & White. Wszystkie prawa zastrzeżone.`,
    },
    hours: {
        mondayFriday: 'Pn–Pt',
        saturday: 'Sob',
        closed: 'Zamknięte',
        dayShort: ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'],
    },
    bookingCta: {
        eyebrow: 'Umów się już dziś',
        headingLine1: 'Twoje włosy',
        headingLine2: 'zasługują na to,',
        headingLine3: 'co najlepsze.',
        since: 'od 2011 roku',
    },
    modal: {
        bookingServiceLabel: 'Rezerwacja usługi',
        loginTitle: 'Zaloguj się',
        bookingTitle: 'Umów wizytę',
        since: 'od 2011 roku',
        loginSub: 'aby przejść do kalendarza rezerwacji',
        alreadyLoggedIn: 'Jesteś już zalogowana/-y.',
        goToBooking: 'Przejdź do rezerwacji',
        emailLabel: 'Email',
        emailPlaceholder: 'twoj@email.pl',
        passwordLabel: 'Hasło',
        passwordPlaceholder: '••••••••',
        errorInvalidEmail: 'Nieprawidłowy adres e-mail',
        errorEmailRequired: 'Adres e-mail jest wymagany',
        errorPasswordRequired: 'Hasło jest wymagane',
        errorLoginFailed:
            'Logowanie nieudane. Sprawdź dane i spróbuj ponownie.',
        submitLogin: 'Zaloguj i umów wizytę',
        submitting: 'Logowanie…',
        noAccount: 'Nie masz konta?',
        register: 'Zarejestruj się',
        close: 'Zamknij',
        priceLabel: 'Cena',
        durationLabel: 'Czas',
    },
    salonGallery: {
        eyebrow: 'Zajrzyj do nas',
        title: 'Nasz salon',
        subtitle:
            'Nowoczesna przestrzeń stworzona z myślą o Twoim komforcie i relaksie.',
        viewAll: 'Zobacz pełną galerię',
        workEyebrow: 'Instagram · @salon_bw',
        workTitle: 'Z naszej pracy',
        workSubtitle: 'Kilka naszych realizacji. Pełna galeria — w kolorze — czeka obok.',
        open: 'Otwórz',
    },
    gallery: {
        eyebrow: 'Instagram · Nasze realizacje',
        title: 'Galeria',
        subtitle:
            'Najnowsze prace naszego zespołu — fryzury, stylizacje i koloryzacje.',
        fallback:
            'Galeria Instagram jest chwilowo niedostępna. Spróbuj odświeżyć.',
        loading: 'Ładowanie…',
        refresh: 'Odśwież',
        scrollMore: 'Przewiń, aby zobaczyć więcej',
        end: 'Koniec galerii',
        open: 'Otwórz',
        openPhoto: 'Otwórz zdjęcie',
        imageAlt: 'Realizacja salonu Black & White',
        preview: 'Podgląd realizacji',
        lightboxClose: 'Zamknij',
        lightboxPrev: 'Poprzednie zdjęcie',
        lightboxNext: 'Następne zdjęcie',
        lightboxShare: 'Udostępnij zdjęcie',
        lightboxDownload: 'Pobierz zdjęcie',
        lightboxHint: 'Przesuń lub użyj strzałek',
    },
    notFound: {
        heading: 'Zgubiłaś się?',
        sub: 'Ta strona nie istnieje — ale Twoje włosy mogą wyglądać perfekcyjnie.',
        cta: 'Wróć na stronę główną',
        ctaBooking: 'Umów wizytę',
    },
    contact: {
        title: 'Kontakt',
        eyebrow: 'Jesteśmy tu dla Ciebie',
        heading: 'Informacje kontaktowe',
        phoneLabel: 'Telefon',
        emailLabel: 'E-mail',
        addressLabel: 'Adres',
        hoursTitle: 'Godziny otwarcia',
        dayMonFri: 'Poniedziałek – Piątek',
        daySat: 'Sobota',
        daySun: 'Niedziela',
        bookingTitle: 'Zarezerwuj termin',
        bookingDesc:
            'Umów wizytę online — wybierz usługę, stylistę i termin który Ci odpowiada.',
        bookingBtn: 'Umów wizytę',
        formSubtitle: 'Lub napisz do nas',
        formTitle: 'Wyślij wiadomość',
        formName: 'Imię i nazwisko',
        formNamePlaceholder: 'np. Anna Kowalska',
        formEmail: 'Adres email',
        formEmailPlaceholder: 'np. anna@gmail.com',
        formMessage: 'Wiadomość',
        formMessagePlaceholder: 'W czym możemy pomóc?',
        formSubmit: 'Wyślij wiadomość',
        formSuccess: 'Wiadomość wysłana — odezwiemy się wkrótce.',
        formErrorEmail: 'Nieprawidłowy format adresu email',
        formErrorName: 'Imię jest wymagane',
        formErrorMessage: 'Wiadomość jest wymagana',
        formErrorSend: 'Nie udało się wysłać wiadomości. Spróbuj ponownie.',
        findUs: 'Znajdź nas',
        showMap: 'Pokaż mapę',
        openInMaps: 'Otwórz w Google Maps',
        formLink: 'Formularz kontaktowy',
    },
    cookies: {
        ariaLabel: 'Zgoda na pliki cookie',
        message:
            'Używamy plików cookie wyłącznie do anonimowych statystyk odwiedzin (Google Analytics). Bez Twojej zgody nie zapisujemy żadnych danych.',
        policyLink: 'Polityka prywatności',
        accept: 'Akceptuję',
        decline: 'Tylko niezbędne',
    },
} as const;


type DeepMutable<T> = T extends readonly (infer U)[]
    ? DeepMutable<U>[]
    : T extends object
      ? { [K in keyof T]: DeepMutable<T[K]> }
      : T extends string
        ? string
        : T;

export type Translations = DeepMutable<typeof pl>;


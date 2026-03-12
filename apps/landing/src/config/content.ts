/**
 * Centralized Polish content for Salon Black & White
 * Source: Live site at salon-bw.pl
 */

// Business Information
export const BUSINESS_INFO = {
  name: 'Salon Black & White',
  tagline: 'Akademia Zdrowych Włosów',
  address: {
    street: 'ul. Webera 1a/13',
    city: 'Bytom',
    postalCode: '41-902',
    full: 'ul. Webera 1a/13, 41-902 Bytom',
  },
  coordinates: {
    lat: 50.348641,
    lng: 18.921429,
  },
  contact: {
    phone: '+48 723 588 868',
    email: 'kontakt@salon-bw.pl',
  },
  hours: {
    mondayFriday: '10:00 - 19:00',
    saturday: '9:00 - 15:00',
    sunday: 'Zamknięte',
  },
  social: {
    facebook: 'https://www.facebook.com/Salon.Fryzjerski.Black.And.White',
    instagram: 'https://www.instagram.com/salon_bw',
    twitter: 'https://twitter.com/salon_bw',
  },
  booking: {
    url: '/appointments', // Internal panel appointments
    text: 'Umów wizytę',
  },
} as const;

// Hero Slides
export const HERO_SLIDES = [
  {
    id: 1,
    title: 'Witamy w Akademii Zdrowych Włosów Black & White',
    description:
      'Naszym celem jest dostarczanie najwyższej jakości usług fryzjerskich i dbanie o zdrowie Twoich włosów.',
    image: '/images/hero/slider1.jpg',
    alt: 'Wnętrze salonu Black & White - profesjonalne stanowisko fryzjerskie',
  },
  {
    id: 2,
    title: 'Nowoczesna Stylizacja',
    description:
      'Oferując różnorodność fryzur zgodnych z najnowszymi trendami, dbamy o to, by każdy klient wyszedł z salonem z uśmiechem.',
    image: '/images/hero/slider2.jpg',
    alt: 'Nowoczesne fryzury i stylizacje w salonie Black & White',
  },
  {
    id: 3,
    title: 'Serdecznie Zapraszamy',
    description:
      'Zapoznaj się z naszą ofertą i umów się na wizytę. Czekamy na Ciebie!',
    image: '/images/hero/slider3.jpg',
    alt: 'Zaproszenie do salonu fryzjerskiego Black & White w Bytomiu',
  },
] as const;

// Founder Message
export const FOUNDER_MESSAGE = {
  name: 'Aleksandra Bodora',
  quote:
    'Od wielu lat stale podnoszę swoje kwalifikacje oraz jakość moich usług, dzięki temu mam stałych zadowolonych klientów. Dołącz do nich i ciesz się pięknem swoich włosów!',
  photo: '/images/founder/aleksandra-bodora.jpg', // Optional
} as const;

// History Accordion Items
export const HISTORY_ITEMS = [
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
] as const;

// Core Values (6 Pillars)
export const CORE_VALUES = [
  {
    id: 'pasja',
    title: 'Pasja i Kreatywność',
    icon: '🎨',
    description:
      'W naszym salonie fryzjerskim wkładamy całe serce w to, co robimy. Nasza pasja do sztuki fryzjerskiej jest nieodłączną częścią naszej pracy. Jesteśmy kreatywni i otwarci na nowe trendy, dzięki czemu możemy stworzyć dla Ciebie wyjątkowe i niepowtarzalne fryzury, które podkreślą Twoją indywidualność.',
  },
  {
    id: 'profesjonalizm',
    title: 'Profesjonalizm i Doskonałość',
    icon: '⭐',
    description:
      'W naszym zespole mamy doświadczonych fryzjerów, którzy są mistrzami swojego fachu. Stale doskonalimy swoje umiejętności, uczestnicząc w szkoleniach i śledząc najnowsze techniki i trendy fryzjerskie. Możesz mieć pewność, że otrzymasz usługę na najwyższym poziomie.',
  },
  {
    id: 'indywidualne',
    title: 'Indywidualne Podejście',
    icon: '👤',
    description:
      'Wiemy, że każdy klient jest wyjątkowy. Dlatego zawsze słuchamy uważnie Twoich potrzeb i preferencji. Nasz zespół fryzjerów jest wyszkolony, aby zrozumieć Twoje oczekiwania i zaproponować rozwiązania dopasowane do Twojego stylu życia, osobowości i indywidualnych cech.',
  },
  {
    id: 'zadowolenie',
    title: 'Zadowolenie Klienta',
    icon: '😊',
    description:
      'Twoje zadowolenie jest dla nas najważniejsze. Dlatego staramy się stworzyć przyjazną i komfortową atmosferę w naszym salonie. Chcemy, abyś czuł się jak w domu i opuszczał nasz salon z uśmiechem na twarzy. Działamy z pełnym zaangażowaniem, aby przekroczyć Twoje oczekiwania i sprawić, że każda wizyta będzie niezapomnianym doświadczeniem.',
  },
  {
    id: 'higiena',
    title: 'Higiena i Bezpieczeństwo',
    icon: '🛡️',
    description:
      'Twoje zdrowie i bezpieczeństwo są dla nas priorytetem. Przestrzegamy surowych standardów higieny i dbamy o to, aby nasz salon był czysty i bezpieczny. Wszystkie nasze narzędzia i sprzęt są starannie dezynfekowane, aby zapewnić Ci bezpieczne środowisko podczas Twojej wizyty.',
  },
  {
    id: 'srodowisko',
    title: 'Zaangażowanie w Środowisko',
    icon: '🌱',
    description:
      'Jesteśmy świadomi wpływu, jaki nasza branża może mieć na środowisko. Dlatego podejmujemy działania mające na celu ograniczenie naszego śladu ekologicznego. Stosujemy produkty przyjazne dla środowiska, minimalizujemy odpady i angażujemy się w praktyki zrównoważonego rozwoju.',
  },
] as const;

// Salon Gallery Images
export const SALON_GALLERY = [
  {
    id: 1,
    image: '/images/salon/salon1.jpg',
    caption: 'Recepcja',
    alt: 'Recepcja salonu Black & White',
  },
  {
    id: 2,
    image: '/images/salon/salon2.jpg',
    caption: 'Fryzjerstwo',
    alt: 'Stanowisko fryzjerskie w salonie',
  },
  {
    id: 3,
    image: '/images/salon/salon3.jpg',
    caption: 'Stylizacja',
    alt: 'Przestrzeń stylizacyjna',
  },
  {
    id: 4,
    image: '/images/salon/salon4.jpg',
    caption: 'Pielęgnacja włosów',
    alt: 'Strefa pielęgnacji włosów',
  },
  {
    id: 5,
    image: '/images/salon/salon5.jpg',
    caption: 'Kosmetyka',
    alt: 'Gabinet kosmetyczny',
  },
  {
    id: 6,
    image: '/images/salon/salon6.jpg',
    caption: 'Strefa relaksu',
    alt: 'Strefa relaksu dla klientów',
  },
  {
    id: 7,
    image: '/images/salon/salon7.jpg',
    caption: 'Profesjonalne stanowisko',
    alt: 'Profesjonalne stanowisko fryzjerskie',
  },
  {
    id: 8,
    image: '/images/salon/salon8.jpg',
    caption: 'Wnętrze salonu',
    alt: 'Eleganckie wnętrze salonu',
  },
] as const;

// Service Categories
export const SERVICE_CATEGORIES = [
  {
    id: 'fryzjerskie',
    name: 'Usługi fryzjerskie',
    slug: 'uslugi-fryzjerskie',
    description: 'Profesjonalne usługi fryzjerskie dla kobiet',
  },
  {
    id: 'barber',
    name: 'Barber',
    slug: 'barber',
    description: 'Kompleksowe usługi barberskie dla mężczyzn',
  },
  {
    id: 'pielegnacja',
    name: 'Pielęgnacja',
    slug: 'pielegnacja',
    description: 'Zabiegi pielęgnacyjne dla zdrowia włosów',
    subcategories: [
      { name: 'Botox na włosy', slug: 'botox' },
      { name: 'Złote proteiny', slug: 'zlote-proteiny' },
      { name: 'Sauna - SPA dla włosów', slug: 'sauna-spa' },
    ],
  },
  {
    id: 'przedluzanie',
    name: 'Przedłużanie włosów',
    slug: 'przedluzanie-wlosow',
    description: 'Profesjonalne przedłużanie włosów metodą HairTalk',
  },
  {
    id: 'karta',
    name: 'Karta podarunkowa',
    slug: 'karta-podarunkowa',
    description: 'Kup kartę podarunkową na usługi w naszym salonie',
  },
] as const;

// Navigation Menu
export const NAV_MENU = [
  { label: 'Start', href: '/', submenu: [] },
  {
    label: 'Usługi',
    href: '/services',
    submenu: [
      { label: 'Usługi fryzjerskie', href: '/services/uslugi-fryzjerskie' },
      { label: 'Barber', href: '/services/barber' },
      {
        label: 'Pielęgnacja',
        href: '/services/pielegnacja',
        submenu: [
          { label: 'Botox na włosy', href: '/services/botox' },
          { label: 'Złote proteiny', href: '/services/zlote-proteiny' },
          { label: 'Sauna - SPA dla włosów', href: '/services/sauna-spa' },
        ],
      },
      { label: 'Karta podarunkowa', href: '/services/karta-podarunkowa' },
    ],
  },
  {
    label: 'Cennik',
    href: BUSINESS_INFO.booking.url,
    external: true,
  },
  {
    label: 'Przedłużanie włosów',
    href: '/services/przedluzanie-wlosow',
    submenu: [],
  },
  { label: 'Kontakt', href: '/contact', submenu: [] },
] as const;

// Footer Links
export const FOOTER_LINKS = {
  navigation: [
    { label: 'Start', href: '/' },
    { label: 'Usługi', href: '/services' },
    { label: 'Galeria', href: '/gallery' },
    { label: 'Kontakt', href: '/contact' },
    { label: 'Polityka prywatności', href: '/privacy' },
    { label: 'Regulamin', href: '/policy' },
  ],
  legal: [
    { label: 'Polityka prywatności', href: '/privacy' },
    { label: 'Regulamin', href: '/policy' },
  ],
} as const;

// SEO Meta
export const SEO_META = {
  title: 'Salon fryzjerski Black&White, fryzjer i barber – Bytom',
  description:
    'Salon fryzjerski i kosmetyczny Black&White - Bytom oferuje zabiegi pielęgnacyjne włosów - Kerastase oraz skóry głowy Nioxin. Profesjonalne usługi fryzjerskie, barber i przedłużanie włosów.',
  keywords:
    'bytom, salon fryzjerski, salon kosmetyczny, kerastase, stylizacja, fryzjer bytom, barber bytom, przedłużanie włosów',
  author: 'Vetternkraft.eu',
  locale: 'pl_PL',
  geo: {
    country: 'PL',
    region: 'PL-SL',
    placename: 'Bytom',
    position: '50.348641;18.921429',
    icbm: '50.348641, 18.921429',
  },
} as const;

// Partner Brands
export const PARTNER_BRANDS = [
  'Olaplex',
  'Nioxin',
  'Wella',
  'System Professional',
  'Kerastase',
] as const;

// Copyright
export const COPYRIGHT = `© ${new Date().getFullYear()} Salon Black & White. Wszystkie prawa zastrzeżone.`;

// Export types for TypeScript
export type HeroSlide = (typeof HERO_SLIDES)[number];
export type HistoryItem = (typeof HISTORY_ITEMS)[number];
export type CoreValue = (typeof CORE_VALUES)[number];
export type SalonImage = (typeof SALON_GALLERY)[number];
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];
export type NavMenuItem = (typeof NAV_MENU)[number];

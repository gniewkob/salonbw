import type { Language } from './translations';

/**
 * Per-locale content for the service detail pages
 * (/services/coloring, /services/balayage, /services/highlights,
 * /services/bridal).
 * Kept out of the large translations.ts for maintainability.
 *
 * NOTE: EN/DE are machine-assisted translations pending professional review.
 */

export interface ServiceDetailEntry {
    eyebrow: string;
    h1: string;
    lead: string;
    items: string[];
    metaTitle: string;
    metaDescription: string;
    keywords: string;
    ogTitle: string;
    ogDescription: string;
    ldName: string;
    ldDescription: string;
}

export interface ServiceDetailLocale {
    backToOffer: string;
    includedEyebrow: string;
    includedTitle: string;
    worksEyebrow: string;
    worksTitle: string;
    coloring: ServiceDetailEntry;
    balayage: ServiceDetailEntry;
    highlights: ServiceDetailEntry;
    bridal: ServiceDetailEntry;
}

export const OG_LOCALE: Record<Language, string> = {
    pl: 'pl_PL',
    en: 'en_US',
    de: 'de_DE',
};

/** Labels for the /services category filter chips. */
export const SERVICE_FILTER: Record<Language, { all: string; group: string }> =
    {
        pl: { all: 'Wszystkie', group: 'Filtr kategorii' },
        en: { all: 'All', group: 'Category filter' },
        de: { all: 'Alle', group: 'Kategoriefilter' },
    };

export const SERVICE_DETAIL: Record<Language, ServiceDetailLocale> = {
    pl: {
        backToOffer: 'Pełna oferta i cennik',
        includedEyebrow: 'Zakres usługi',
        includedTitle: 'Co obejmuje',
        worksEyebrow: 'Instagram · nasze prace',
        worksTitle: 'Z naszej pracy',
        coloring: {
            eyebrow: 'Usługi fryzjerskie',
            h1: 'Koloryzacja',
            lead: 'Pełna koloryzacja to kompletna zmiana lub odświeżenie koloru włosów. Używamy wyłącznie profesjonalnych farb Wella i Kerastase, które zapewniają intensywny kolor i pielęgnację jednocześnie.',
            items: [
                'Koloryzacja jednolita i wielotonowa',
                'Korekta koloru (color correction)',
                'Farbowanie korzeni i odrostów',
                'Toning i gloss',
                'Bezpieczna dla włosów – bez amoniaku dostępne',
            ],
            metaTitle: 'Koloryzacja Bytom — Salon Black & White',
            metaDescription:
                'Profesjonalna koloryzacja włosów w Bytomiu — farby Wella i Kerastase, color correction, toning. Salon Black & White, ul. Webera 1a/13.',
            keywords:
                'koloryzacja włosów bytom, color correction bytom, farbowanie włosów bytom, toning włosów, salon fryzjerski bytom',
            ogTitle: 'Koloryzacja włosów — Salon Black & White Bytom',
            ogDescription:
                'Profesjonalna koloryzacja włosów w Bytomiu. Farby Wella i Kerastase, color correction, toning, farbowanie odrostów.',
            ldName: 'Koloryzacja',
            ldDescription:
                'Pełna koloryzacja włosów z użyciem profesjonalnych farb Wella i Kerastase. Korekta koloru, toning, farbowanie odrostów.',
        },
        balayage: {
            eyebrow: 'Koloryzacja',
            h1: 'Balayage',
            lead: 'Balayage to technika ręcznego rozjaśniania włosów, która daje naturalny, słoneczny efekt. Nasze stylistki tworzą indywidualnie dopasowany gradient – od korzeni po końce – bez widocznych odrostów. Efekt trwa kilka miesięcy bez potrzeby częstego odświeżania.',
            items: [
                'Naturalny efekt bez widocznych odrostów',
                'Ręczne nakładanie – precyzja na każdym paśmie',
                'Idealny do włosów ciemnych i jasnych',
                'Długotrwały efekt (3–5 miesięcy)',
                'Możliwość łączenia z innymi technikami',
            ],
            metaTitle: 'Balayage Bytom — Salon Black & White',
            metaDescription:
                'Balayage w Bytomiu — ręczna technika rozjaśniania włosów dająca naturalny, słoneczny efekt bez widocznych odrostów. Salon Black & White, ul. Webera 1a/13.',
            keywords:
                'balayage bytom, rozjaśnianie włosów bytom, naturalne pasemka bytom, ombre bytom, salon fryzjerski bytom',
            ogTitle: 'Balayage — Salon Black & White Bytom',
            ogDescription:
                'Balayage w Bytomiu — ręczna technika rozjaśniania włosów. Naturalny słoneczny efekt bez widocznych odrostów.',
            ldName: 'Balayage',
            ldDescription:
                'Technika ręcznego rozjaśniania włosów dająca naturalny, słoneczny efekt bez widocznych odrostów. Indywidualnie dopasowany gradient.',
        },
        highlights: {
            eyebrow: 'Koloryzacja',
            h1: 'Pasemka',
            lead: 'Klasyczne pasemka i rozjaśnienia to najszybszy sposób na dodanie głębi i blasku. Pracujemy zarówno z delikatnymi, naturalnymi akcentami, jak i wyrazistymi, kontrastowymi efektami.',
            items: [
                'Pasemka klasyczne i dynamiczne',
                'Efekt rozświetlenia i głębi',
                'Dostosowane do odcienia bazowego',
                'Możliwość łączenia z balayage',
                'Niska ingerencja w strukturę włosa',
            ],
            metaTitle: 'Pasemka Bytom — Salon Black & White',
            metaDescription:
                'Pasemka i rozjaśnienia w Bytomiu — klasyczne i dynamiczne efekty głębi i blasku. Salon Black & White, ul. Webera 1a/13.',
            keywords:
                'pasemka bytom, rozjaśnienia włosów bytom, highlights bytom, klasyczne pasemka bytom, salon fryzjerski bytom',
            ogTitle: 'Pasemka — Salon Black & White Bytom',
            ogDescription:
                'Pasemka i rozjaśnienia w Bytomiu — klasyczne i dynamiczne efekty głębi i blasku dla Twoich włosów.',
            ldName: 'Pasemka',
            ldDescription:
                'Klasyczne pasemka i rozjaśnienia dodające głębi i blasku. Delikatne naturalne akcenty lub wyraziste kontrastowe efekty.',
        },
        bridal: {
            eyebrow: 'Fryzury okazjonalne',
            h1: 'Upięcia ślubne i wieczorowe',
            lead: 'Od próbnej fryzury przed ślubem po upięcie na wesele czy studniówkę. Fryzurę układamy pod długość włosów, okazję i stylizację.',
            items: [
                'Fryzura ślubna',
                'Próbna fryzura ślubna przed wielkim dniem',
                'Fryzury wieczorowe na włosy średnie, długie i bardzo długie',
                'Upięcia na wesele, studniówkę i karnawał',
                'Fryzura dopasowana do sukni i okazji',
            ],
            metaTitle: 'Upięcia ślubne i wieczorowe Bytom — Salon Black & White',
            metaDescription:
                'Fryzury ślubne, próbne fryzury i upięcia wieczorowe w Bytomiu. Salon Black & White, ul. Webera 1a/13.',
            keywords:
                'fryzura ślubna bytom, upięcia bytom, fryzura wieczorowa bytom, próbna fryzura ślubna bytom, salon fryzjerski bytom',
            ogTitle: 'Upięcia ślubne i wieczorowe — Salon Black & White Bytom',
            ogDescription:
                'Fryzury ślubne, próbne fryzury i upięcia wieczorowe w Bytomiu — pod długość włosów, okazję i stylizację.',
            ldName: 'Upięcia ślubne i wieczorowe',
            ldDescription:
                'Fryzury ślubne, próbne fryzury ślubne i upięcia wieczorowe dopasowane do długości włosów, okazji i stylizacji.',
        },
    },
    en: {
        backToOffer: 'Full offer & prices',
        includedEyebrow: "What's included",
        includedTitle: 'What it covers',
        worksEyebrow: 'Instagram · our work',
        worksTitle: 'From our chairs',
        coloring: {
            eyebrow: 'Hairdressing services',
            h1: 'Hair colouring',
            lead: 'A full colour service is a complete change or a refresh of your hair colour. We use only professional Wella and Kérastase colour, which deliver rich, lasting colour and care at the same time.',
            items: [
                'Single and multi-tone colour',
                'Colour correction',
                'Root and regrowth colouring',
                'Toning and gloss',
                'Gentle on hair – ammonia-free available',
            ],
            metaTitle: 'Hair colouring Bytom — Salon Black & White',
            metaDescription:
                'Professional hair colouring in Bytom — Wella and Kérastase colour, colour correction, toning. Salon Black & White, ul. Webera 1a/13.',
            keywords:
                'hair colouring bytom, colour correction bytom, hair dye bytom, hair toning bytom, hair salon bytom',
            ogTitle: 'Hair colouring — Salon Black & White Bytom',
            ogDescription:
                'Professional hair colouring in Bytom. Wella and Kérastase colour, colour correction, toning, regrowth colouring.',
            ldName: 'Hair colouring',
            ldDescription:
                'Full hair colouring using professional Wella and Kérastase colour. Colour correction, toning, regrowth colouring.',
        },
        balayage: {
            eyebrow: 'Colouring',
            h1: 'Balayage',
            lead: 'Balayage is a freehand hair-lightening technique that creates a natural, sun-kissed effect. Our stylists build an individually tailored gradient – from roots to ends – with no visible regrowth. The result lasts several months without frequent touch-ups.',
            items: [
                'Natural effect with no visible regrowth',
                'Freehand application – precision on every strand',
                'Ideal for both dark and light hair',
                'Long-lasting effect (3–5 months)',
                'Can be combined with other techniques',
            ],
            metaTitle: 'Balayage Bytom — Salon Black & White',
            metaDescription:
                'Balayage in Bytom — a freehand hair-lightening technique for a natural, sun-kissed effect with no visible regrowth. Salon Black & White, ul. Webera 1a/13.',
            keywords:
                'balayage bytom, hair lightening bytom, natural highlights bytom, ombre bytom, hair salon bytom',
            ogTitle: 'Balayage — Salon Black & White Bytom',
            ogDescription:
                'Balayage in Bytom — a freehand hair-lightening technique. A natural, sun-kissed effect with no visible regrowth.',
            ldName: 'Balayage',
            ldDescription:
                'A freehand hair-lightening technique for a natural, sun-kissed effect with no visible regrowth. An individually tailored gradient.',
        },
        highlights: {
            eyebrow: 'Colouring',
            h1: 'Highlights',
            lead: 'Classic highlights and lightening are the fastest way to add depth and shine. We work with both soft, natural accents and bold, high-contrast effects.',
            items: [
                'Classic and dynamic highlights',
                'A brightening, depth-building effect',
                'Matched to your base shade',
                'Can be combined with balayage',
                'Low impact on the hair structure',
            ],
            metaTitle: 'Highlights Bytom — Salon Black & White',
            metaDescription:
                'Highlights and lightening in Bytom — classic and dynamic effects of depth and shine. Salon Black & White, ul. Webera 1a/13.',
            keywords:
                'highlights bytom, hair lightening bytom, classic highlights bytom, hair salon bytom',
            ogTitle: 'Highlights — Salon Black & White Bytom',
            ogDescription:
                'Highlights and lightening in Bytom — classic and dynamic effects of depth and shine for your hair.',
            ldName: 'Highlights',
            ldDescription:
                'Classic highlights and lightening that add depth and shine. Soft natural accents or bold, high-contrast effects.',
        },
        bridal: {
            eyebrow: 'Occasion hair',
            h1: 'Bridal & evening updos',
            lead: 'From a bridal trial to an updo for a wedding or a prom. We style it to your hair length, the occasion and your outfit.',
            items: [
                'Bridal hairstyle',
                'Bridal trial before the big day',
                'Evening styles for medium, long and very long hair',
                'Updos for weddings, proms and carnival',
                'A style matched to your dress and the occasion',
            ],
            metaTitle: 'Bridal & evening updos Bytom — Salon Black & White',
            metaDescription:
                'Bridal hairstyles, bridal trials and evening updos in Bytom. Salon Black & White, ul. Webera 1a/13.',
            keywords:
                'bridal hair bytom, updo bytom, evening hairstyle bytom, bridal trial bytom, hair salon bytom',
            ogTitle: 'Bridal & evening updos — Salon Black & White Bytom',
            ogDescription:
                'Bridal hairstyles, trials and evening updos in Bytom — styled to your hair length, the occasion and your outfit.',
            ldName: 'Bridal & evening updos',
            ldDescription:
                'Bridal hairstyles, bridal trials and evening updos styled to hair length, occasion and outfit.',
        },
    },
    de: {
        backToOffer: 'Gesamtes Angebot & Preise',
        includedEyebrow: 'Leistungsumfang',
        includedTitle: 'Was dazugehört',
        worksEyebrow: 'Instagram · unsere Arbeiten',
        worksTitle: 'Aus unserem Salon',
        coloring: {
            eyebrow: 'Friseurleistungen',
            h1: 'Haarfärben',
            lead: 'Eine vollständige Coloration ist eine komplette Veränderung oder Auffrischung Ihrer Haarfarbe. Wir verwenden ausschließlich professionelle Farben von Wella und Kérastase, die intensive Farbe und Pflege zugleich bieten.',
            items: [
                'Einfarbige und mehrtonige Coloration',
                'Farbkorrektur (Color Correction)',
                'Ansatz- und Nachwuchsfärbung',
                'Toning und Gloss',
                'Haarschonend – ammoniakfrei möglich',
            ],
            metaTitle: 'Haarfärben Bytom — Salon Black & White',
            metaDescription:
                'Professionelles Haarfärben in Bytom — Farben von Wella und Kérastase, Color Correction, Toning. Salon Black & White, ul. Webera 1a/13.',
            keywords:
                'haarfärben bytom, color correction bytom, haare färben bytom, toning bytom, friseur bytom',
            ogTitle: 'Haarfärben — Salon Black & White Bytom',
            ogDescription:
                'Professionelles Haarfärben in Bytom. Farben von Wella und Kérastase, Color Correction, Toning, Ansatzfärbung.',
            ldName: 'Haarfärben',
            ldDescription:
                'Vollständige Coloration mit professionellen Farben von Wella und Kérastase. Farbkorrektur, Toning, Ansatzfärbung.',
        },
        balayage: {
            eyebrow: 'Coloration',
            h1: 'Balayage',
            lead: 'Balayage ist eine freihändige Aufhelltechnik, die einen natürlichen, sonnigen Effekt erzeugt. Unsere Stylistinnen gestalten einen individuell abgestimmten Verlauf – vom Ansatz bis in die Spitzen – ohne sichtbaren Nachwuchs. Das Ergebnis hält mehrere Monate ohne häufiges Nachfärben.',
            items: [
                'Natürlicher Effekt ohne sichtbaren Nachwuchs',
                'Freihändiges Auftragen – Präzision an jeder Strähne',
                'Ideal für dunkles und helles Haar',
                'Langanhaltender Effekt (3–5 Monate)',
                'Kombinierbar mit anderen Techniken',
            ],
            metaTitle: 'Balayage Bytom — Salon Black & White',
            metaDescription:
                'Balayage in Bytom — freihändige Aufhelltechnik für einen natürlichen, sonnigen Effekt ohne sichtbaren Nachwuchs. Salon Black & White, ul. Webera 1a/13.',
            keywords:
                'balayage bytom, haare aufhellen bytom, natürliche strähnen bytom, ombre bytom, friseur bytom',
            ogTitle: 'Balayage — Salon Black & White Bytom',
            ogDescription:
                'Balayage in Bytom — freihändige Aufhelltechnik. Ein natürlicher, sonniger Effekt ohne sichtbaren Nachwuchs.',
            ldName: 'Balayage',
            ldDescription:
                'Freihändige Aufhelltechnik für einen natürlichen, sonnigen Effekt ohne sichtbaren Nachwuchs. Ein individuell abgestimmter Verlauf.',
        },
        highlights: {
            eyebrow: 'Coloration',
            h1: 'Strähnen',
            lead: 'Klassische Strähnen und Aufhellungen sind der schnellste Weg, Tiefe und Glanz hinzuzufügen. Wir arbeiten sowohl mit dezenten, natürlichen Akzenten als auch mit ausdrucksstarken, kontrastreichen Effekten.',
            items: [
                'Klassische und dynamische Strähnen',
                'Aufhellender Effekt mit Tiefe',
                'Auf den Basiston abgestimmt',
                'Kombinierbar mit Balayage',
                'Geringer Eingriff in die Haarstruktur',
            ],
            metaTitle: 'Strähnen Bytom — Salon Black & White',
            metaDescription:
                'Strähnen und Aufhellungen in Bytom — klassische und dynamische Effekte von Tiefe und Glanz. Salon Black & White, ul. Webera 1a/13.',
            keywords:
                'strähnen bytom, haare aufhellen bytom, klassische strähnen bytom, friseur bytom',
            ogTitle: 'Strähnen — Salon Black & White Bytom',
            ogDescription:
                'Strähnen und Aufhellungen in Bytom — klassische und dynamische Effekte von Tiefe und Glanz für Ihr Haar.',
            ldName: 'Strähnen',
            ldDescription:
                'Klassische Strähnen und Aufhellungen, die Tiefe und Glanz verleihen. Dezente natürliche Akzente oder ausdrucksstarke, kontrastreiche Effekte.',
        },
        bridal: {
            eyebrow: 'Anlassfrisuren',
            h1: 'Braut- und Abendfrisuren',
            lead: 'Von der Probefrisur vor der Hochzeit bis zur Hochsteckfrisur für Hochzeit oder Abiball. Wir stylen passend zu Haarlänge, Anlass und Outfit.',
            items: [
                'Brautfrisur',
                'Probefrisur vor dem großen Tag',
                'Abendfrisuren für mittellanges, langes und sehr langes Haar',
                'Hochsteckfrisuren für Hochzeit, Abiball und Karneval',
                'Frisur passend zu Kleid und Anlass',
            ],
            metaTitle: 'Braut- und Abendfrisuren Bytom — Salon Black & White',
            metaDescription:
                'Brautfrisuren, Probefrisuren und Abendfrisuren in Bytom. Salon Black & White, ul. Webera 1a/13.',
            keywords:
                'brautfrisur bytom, hochsteckfrisur bytom, abendfrisur bytom, probefrisur bytom, friseursalon bytom',
            ogTitle: 'Braut- und Abendfrisuren — Salon Black & White Bytom',
            ogDescription:
                'Brautfrisuren, Probefrisuren und Abendfrisuren in Bytom — passend zu Haarlänge, Anlass und Outfit.',
            ldName: 'Braut- und Abendfrisuren',
            ldDescription:
                'Brautfrisuren, Probefrisuren und Abendfrisuren passend zu Haarlänge, Anlass und Outfit.',
        },
    },
};

import type { Language } from './translations';

/**
 * Display translations for catalog names that live in the database in Polish
 * (service categories + service "concept" names shown on /services). The DB is
 * the source of truth and stays Polish; this only translates the LABEL shown on
 * the multilingual landing. Keys are the exact Polish names; unknown names fall
 * back to Polish. EN/DE are machine-assisted (review welcome).
 */

type Pair = { en: string; de: string };

const CATEGORY: Record<string, Pair> = {
    Fryzjerstwo: { en: 'Hairdressing', de: 'Friseur' },
    Koloryzacja: { en: 'Colouring', de: 'Coloration' },
    Pielęgnacja: { en: 'Hair care', de: 'Haarpflege' },
    Przedłużanie: { en: 'Extensions', de: 'Haarverlängerung' },
};

const CONCEPT: Record<string, Pair> = {
    'Fryzura ślubna': { en: 'Bridal hairstyle', de: 'Brautfrisur' },
    'Próbna fryzura ślubna': {
        en: 'Bridal hair trial',
        de: 'Probe-Brautfrisur',
    },
    'Fryzura wieczorowa': { en: 'Evening hairstyle', de: 'Abendfrisur' },
    'Modelowanie damskie': {
        en: "Women's blow-dry & styling",
        de: 'Damen-Styling',
    },
    'Strzyżenie damskie': { en: "Women's haircut", de: 'Damenhaarschnitt' },
    'Strzyżenie grzywki': { en: 'Fringe trim', de: 'Pony schneiden' },
    'Strzyżenie męskie': { en: "Men's haircut", de: 'Herrenhaarschnitt' },
    'Strzyżenie męskie maszynką': {
        en: "Men's clipper cut",
        de: 'Herren-Maschinenschnitt',
    },
    'Strzyżenie brody + podgolenie': {
        en: 'Beard trim + line-up',
        de: 'Bartschnitt + Konturen',
    },
    'Strzyżenie włosy + broda': {
        en: 'Haircut + beard',
        de: 'Haarschnitt + Bart',
    },
    'Trwała ondulacja': { en: 'Perm', de: 'Dauerwelle' },
    'Trwała podnosząca': {
        en: 'Root-lift perm',
        de: 'Volumen-Dauerwelle',
    },
    'Strzyżenie dziecięce dziewczynki': {
        en: "Girls' haircut",
        de: 'Mädchen-Haarschnitt',
    },
    'Strzyżenie dziecięce chłopcy': {
        en: "Boys' haircut",
        de: 'Jungen-Haarschnitt',
    },
    'Warkoczyk dziecięcy': { en: "Kids' braid", de: 'Kinder-Zopf' },
    Koloryzacja: { en: 'Full colour', de: 'Coloration' },
    'Koloryzacja AirTouch': {
        en: 'AirTouch colouring',
        de: 'AirTouch Coloration',
    },
    Odrosty: { en: 'Root colour (regrowth)', de: 'Ansatzfarbe' },
    'Olaplex do koloryzacji': {
        en: 'Olaplex (colour add-on)',
        de: 'Olaplex zur Coloration',
    },
    'Pielęgnacja do koloryzacji': {
        en: 'Colour care treatment',
        de: 'Pflege zur Coloration',
    },
    'Tonowanie Color Touch': {
        en: 'Color Touch toning',
        de: 'Color-Touch-Tönung',
    },
    'Rozjaśnienie globalne włosów': {
        en: 'Full hair lightening',
        de: 'Globale Aufhellung',
    },
    Dermabrazja: { en: 'Dermabrasion', de: 'Dermabrasion' },
    'Botox na włosy': { en: 'Hair botox', de: 'Haar-Botox' },
    'Złote proteiny': { en: 'Gold proteins treatment', de: 'Gold-Proteine' },
    'Przedłużanie włosów metodą Hair Extensions': {
        en: 'Hair extensions (Hair Extensions method)',
        de: 'Haarverlängerung (Hair-Extensions-Methode)',
    },
    'Korekta Hair Extensions': {
        en: 'Hair extensions maintenance',
        de: 'Hair-Extensions-Korrektur',
    },
};

// Category and concept can share a Polish name ("Koloryzacja" is both a
// category and a full-colour service), so they need separate lookups —
// otherwise the category heading would inherit the concept's wording.

/** Translate a service CATEGORY label (heading / filter chip). PL stays PL. */
export function translateCategory(name: string, lang: Language): string {
    if (lang === 'pl') return name;
    const hit = CATEGORY[name.trim()];
    return hit ? hit[lang] : name;
}

/** Translate a service CONCEPT name (a row on /services). PL stays PL. */
export function translateConcept(name: string, lang: Language): string {
    if (lang === 'pl') return name;
    const hit = CONCEPT[name.trim()] ?? CATEGORY[name.trim()];
    return hit ? hit[lang] : name;
}

/** Visible gallery captions (SALON_GALLERY lives in content.ts in Polish). */
const GALLERY_CAPTION: Record<string, Pair> = {
    Recepcja: { en: 'Reception', de: 'Empfang' },
    Fryzjerstwo: { en: 'Hairdressing', de: 'Friseur' },
    Stylizacja: { en: 'Styling', de: 'Styling' },
    'Pielęgnacja włosów': { en: 'Hair care', de: 'Haarpflege' },
    Kosmetyka: { en: 'Beauty', de: 'Kosmetik' },
    'Strefa relaksu': { en: 'Relax zone', de: 'Ruhebereich' },
    'Profesjonalne stanowisko': {
        en: 'Professional station',
        de: 'Profi-Arbeitsplatz',
    },
    'Wnętrze salonu': { en: 'Salon interior', de: 'Saloninneres' },
};

export function translateGalleryCaption(
    caption: string,
    lang: Language,
): string {
    if (lang === 'pl') return caption;
    const hit = GALLERY_CAPTION[caption.trim()];
    return hit ? hit[lang] : caption;
}

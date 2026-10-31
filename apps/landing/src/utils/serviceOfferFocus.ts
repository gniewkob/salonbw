/**
 * Stable marketing entry points into the live service catalog.
 *
 * These keys are URL semantics, NOT database category names. Names may change
 * when Booksy services are curated; fail open to the full public catalog if no
 * suitable category exists rather than displaying an empty offer.
 */
export const SERVICE_OFFERS = ['hairdressing', 'care', 'extensions'] as const;

export type ServiceOffer = (typeof SERVICE_OFFERS)[number];

interface CatalogCategory {
    name: string;
    services: ReadonlyArray<{ name: string }>;
}

const WORDS: Record<ServiceOffer, RegExp> = {
    hairdressing: /fryzjer|strzyz|ciecie|koloryz|farbow|balayage|refleks|modelowan|fryzur|air\s*touch|barber|dekoloryz|rozjasn|tonowan|stylizac/,
    care: /pielegn|regener|odbudow|olaplex|botox|protein|nioxin|kerastase|laminac|kuracj|trychol|zabieg|k18/,
    extensions: /przedluz|zageszcz|doczep|hairtalk|tape.?in|mikroring|nano.?ring|extensions/,
};

function normalizeLabel(value: string): string {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/ł/g, 'l');
}

/** Reject malformed or unknown query-string parameters without throwing. */
export function parseServiceOffer(value: unknown): ServiceOffer | null {
    return typeof value === 'string' &&
        (SERVICE_OFFERS as readonly string[]).includes(value)
        ? (value as ServiceOffer)
        : null;
}

/**
 * Prefer the catalog category matching the selected offer. A direct category
 * match wins over service-name matches, so a broad "Fryzjerstwo" category
 * cannot accidentally displace a dedicated "Przedłużanie włosów" category.
 *
 * Returns null when the live catalog cannot substantiate the marketing label:
 * the services page must then show its full catalog, not invented prices or
 * an empty state.
 */
export function resolveOfferCategory(
    categories: ReadonlyArray<CatalogCategory>,
    offer: ServiceOffer | null | undefined,
): string | null {
    if (!offer) return null;

    const matches = WORDS[offer];
    let bestScore = 0;
    let selected: string | null = null;

    for (const category of categories) {
        const categoryMatch = matches.test(normalizeLabel(category.name));
        const servicesMatch = category.services.filter((service) =>
            matches.test(normalizeLabel(service.name)),
        ).length;
        const score = (categoryMatch ? 100 : 0) + servicesMatch;

        if (score > bestScore) {
            bestScore = score;
            selected = category.name;
        }
    }

    return selected;
}

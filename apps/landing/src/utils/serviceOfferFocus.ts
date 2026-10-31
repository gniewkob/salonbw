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
 * Return every catalog category related to the marketing offer.
 *
 * "Fryzjerstwo" can span both cutting and colouring categories in the
 * real Booksy catalog. Returning just one hides advertised services.
 * When no category matches, return [] so the page shows the full offer.
 */
export function resolveOfferCategories(
    categories: ReadonlyArray<CatalogCategory>,
    offer: ServiceOffer | null | undefined,
): string[] {
    if (!offer) return [];

    const matches = WORDS[offer];
    return categories
        .filter(
            (category) =>
                matches.test(normalizeLabel(category.name)) ||
                category.services.some((service) =>
                    matches.test(normalizeLabel(service.name)),
                ),
        )
        .map((category) => category.name);
}

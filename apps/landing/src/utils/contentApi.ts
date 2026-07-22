/**
 * Content API client for landing sections that are managed by the CMS.
 */

import * as localConfig from '@/config/content';

const RAW_API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_BASE_URL ||
    'https://api.salon-bw.pl';

function isAbsoluteUrl(value: string): boolean {
    return /^https?:\/\//i.test(value);
}

/**
 * Resolve the API base URL for a fetch.
 *
 * In the browser a relative base such as "/api" is valid (it resolves against
 * the current origin and is proxied to the backend by the Next.js rewrite).
 * On the server — including build-time static generation (SSG/ISR) — Node's
 * `fetch` cannot parse a relative URL, so we must turn it into an absolute one.
 *
 * The rewrite maps `/api/:path*` → `${API_PROXY_URL}/:path*` (it strips the
 * leading `/api` segment), so server-side we mirror that: replace the relative
 * base with the proxy target origin.
 *
 * Exported (and parameterised) so the server-side branch is unit-testable
 * without having to remove `window` from the jsdom test environment.
 */
export function resolveApiBaseUrl(
    base: string = RAW_API_BASE_URL,
    isServer: boolean = typeof window === 'undefined',
): string {
    if (isAbsoluteUrl(base)) {
        return base;
    }
    // Relative base (e.g. "/api"): usable as-is only in the browser.
    if (!isServer) {
        return base;
    }
    // Server-side: build an absolute origin equivalent to the Next.js rewrite.
    const target = (
        process.env.API_PROXY_URL ||
        process.env.API_BASE_URL ||
        'https://api.salon-bw.pl'
    ).replace(/\/$/, '');
    const origin = isAbsoluteUrl(target) ? target : 'https://api.salon-bw.pl';
    // The rewrite strips a leading "/api" segment; anything else is preserved.
    const remainder = base.replace(/^\/api(?=\/|$)/, '');
    return `${origin}${remainder}`;
}

const API_BASE_URL = resolveApiBaseUrl();

export interface ContentSection {
    id: number;
    key: string;
    data: Record<string, unknown>;
    description: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

const CMS_SECTION_KEYS = {
    BUSINESS_INFO: 'business_info',
    HERO_SLIDES: 'hero_slides',
    FOUNDER_MESSAGE: 'founder_message',
    HISTORY_ITEMS: 'history_items',
    CORE_VALUES: 'core_values',
} satisfies Partial<Record<keyof typeof localConfig, string>>;

function getCmsSectionKey(key: keyof typeof localConfig): string {
    const cmsKey = CMS_SECTION_KEYS[key as keyof typeof CMS_SECTION_KEYS];
    if (!cmsKey) {
        throw new Error(
            `[contentApi] Section ${String(key)} is not managed by CMS`,
        );
    }
    return cmsKey;
}

function assertContentSection(value: unknown): asserts value is ContentSection {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('[contentApi] Invalid content section response');
    }
    if (!('data' in value)) {
        throw new Error(
            '[contentApi] Content section response is missing data',
        );
    }
}

/**
 * Fetch a specific content section from API by key
 */
export async function getContentSection<T>(
    key: keyof typeof localConfig,
): Promise<T> {
    const cmsKey = getCmsSectionKey(key);
    const url = `${API_BASE_URL}/content/sections/${cmsKey}`;
    const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!res.ok) {
        throw new Error(
            `[contentApi] Failed to fetch ${String(key)} (${cmsKey}): ${res.status}`,
        );
    }

    const section = (await res.json()) as unknown;
    assertContentSection(section);
    return section.data as T;
}

/**
 * Fetch all content sections from API
 */
export async function getAllContentSections(): Promise<
    Record<string, unknown>
> {
    const url = `${API_BASE_URL}/content/sections?active=true`;
    const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!res.ok) {
        throw new Error(
            `[contentApi] Failed to fetch all sections: ${res.status}`,
        );
    }

    const sections = (await res.json()) as unknown;
    if (!Array.isArray(sections)) {
        throw new Error('[contentApi] Invalid content sections response');
    }
    const contentMap: Record<string, unknown> = {};
    for (const section of sections) {
        assertContentSection(section);
        contentMap[section.key] = section.data;
    }
    return contentMap;
}

/**
 * Type-safe helpers to get specific CMS-managed content.
 */
export async function getHeroSlides() {
    return getContentSection<typeof localConfig.HERO_SLIDES>('HERO_SLIDES');
}

export async function getBusinessInfo() {
    return getContentSection<typeof localConfig.BUSINESS_INFO>('BUSINESS_INFO');
}

export async function getFounderMessage() {
    return getContentSection<typeof localConfig.FOUNDER_MESSAGE>(
        'FOUNDER_MESSAGE',
    );
}

export async function getHistoryItems() {
    return getContentSection<typeof localConfig.HISTORY_ITEMS>('HISTORY_ITEMS');
}

export async function getCoreValues() {
    return getContentSection<typeof localConfig.CORE_VALUES>('CORE_VALUES');
}

export async function getSalonGallery() {
    return localConfig.SALON_GALLERY;
}

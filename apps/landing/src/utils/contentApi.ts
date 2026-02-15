/**
 * Content API client for fetching landing page content from database
 * Fallback to local config if API fails
 */

import * as localConfig from '@/config/content';

const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_BASE_URL ||
    'https://api.salon-bw.pl';

export interface ContentSection {
    id: number;
    key: string;
    data: Record<string, unknown>;
    description: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

/**
 * Fetch a specific content section from API by key
 * Falls back to local config if API fails
 */
export async function getContentSection<T>(
    key: keyof typeof localConfig,
    fallback: T,
): Promise<T> {
    try {
        const url = `${API_BASE_URL}/content/sections/${String(key)}`;
        const res = await fetch(url, {
            headers: { Accept: 'application/json' },
            next: { revalidate: 3600 }, // Cache for 1 hour
        });

        if (!res.ok) {
            console.warn(
                `[contentApi] Failed to fetch ${String(key)}: ${res.status}`,
            );
            return fallback;
        }

        const section: ContentSection = await res.json();
        return section.data as T;
    } catch (error) {
        console.error(
            `[contentApi] Error fetching ${String(key)}:`,
            error instanceof Error ? error.message : 'Unknown error',
        );
        return fallback;
    }
}

/**
 * Fetch all content sections from API
 * Falls back to local config if API fails
 */
export async function getAllContentSections(): Promise<
    Record<string, unknown>
> {
    try {
        const url = `${API_BASE_URL}/content/sections?active=true`;
        const res = await fetch(url, {
            headers: { Accept: 'application/json' },
            next: { revalidate: 3600 }, // Cache for 1 hour
        });

        if (!res.ok) {
            console.warn(
                `[contentApi] Failed to fetch all sections: ${res.status}`,
            );
            return localConfig;
        }

        const sections: ContentSection[] = await res.json();
        const contentMap: Record<string, unknown> = {};
        for (const section of sections) {
            contentMap[section.key] = section.data;
        }
        return contentMap;
    } catch (error) {
        console.error(
            '[contentApi] Error fetching all sections:',
            error instanceof Error ? error.message : 'Unknown error',
        );
        return localConfig;
    }
}

/**
 * Type-safe helper to get specific content with fallback
 */
export async function getHeroSlides() {
    return getContentSection('HERO_SLIDES', localConfig.HERO_SLIDES);
}

export async function getBusinessInfo() {
    return getContentSection('BUSINESS_INFO', localConfig.BUSINESS_INFO);
}

export async function getFounderMessage() {
    return getContentSection('FOUNDER_MESSAGE', localConfig.FOUNDER_MESSAGE);
}

export async function getHistoryItems() {
    return getContentSection('HISTORY_ITEMS', localConfig.HISTORY_ITEMS);
}

export async function getCoreValues() {
    return getContentSection('CORE_VALUES', localConfig.CORE_VALUES);
}

export async function getSalonGallery() {
    return getContentSection('SALON_GALLERY', localConfig.SALON_GALLERY);
}

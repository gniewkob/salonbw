/**
 * Cookie-consent state for Google Consent Mode v2 (basic mode).
 *
 * "Basic" = gtag.js is not loaded at all until the visitor grants
 * analytics consent, and every tracking helper checks consent before
 * firing. This is the strictest interpretation of the EU requirement
 * and also the lightest for page performance.
 */

export type ConsentValue = 'granted' | 'denied';

const STORAGE_KEY = 'sbw-consent';
export const CONSENT_CHANGE_EVENT = 'sbw-consent-change';

interface StoredConsent {
    analytics: ConsentValue;
    /** ISO timestamp of the decision — lets us re-prompt after policy changes. */
    decidedAt: string;
}

export function getStoredConsent(): ConsentValue | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<StoredConsent>;
        return parsed.analytics === 'granted' || parsed.analytics === 'denied'
            ? parsed.analytics
            : null;
    } catch {
        return null;
    }
}

export function hasAnalyticsConsent(): boolean {
    return getStoredConsent() === 'granted';
}

export function setConsent(analytics: ConsentValue): void {
    if (typeof window === 'undefined') return;
    try {
        const value: StoredConsent = {
            analytics,
            decidedAt: new Date().toISOString(),
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
        // storage unavailable (private mode quota etc.) — consent is
        // simply re-asked next visit
    }
    // Consent Mode v2 update for an already-loaded gtag (granted after
    // an earlier denied in the same session is impossible in basic mode,
    // but keep the update for correctness and future ads usage).
    try {
        if (typeof window.gtag === 'function') {
            window.gtag('consent', 'update', {
                analytics_storage: analytics,
            });
        }
    } catch {
        // ignore
    }
    if (analytics === 'denied') {
        clearGaCookies();
    }
    window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: analytics }));
}

/**
 * A visitor who once accepted and later declines should not keep GA
 * identifiers around. Expires every `_ga*` cookie on the parent domain
 * and the current host.
 */
function clearGaCookies(): void {
    try {
        const expired = 'expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
        const host = window.location.hostname;
        const parentDomain = host.split('.').slice(-2).join('.');
        for (const cookie of document.cookie.split(';')) {
            const name = cookie.split('=')[0]?.trim();
            if (!name || !name.startsWith('_ga')) continue;
            document.cookie = `${name}=; ${expired}`;
            document.cookie = `${name}=; ${expired}; domain=${host}`;
            document.cookie = `${name}=; ${expired}; domain=.${parentDomain}`;
        }
    } catch {
        // ignore
    }
}

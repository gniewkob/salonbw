/**
 * Public marketing site (landing) that the panel links to: legal pages and
 * the post-logout destination.
 *
 * Kept separate from NEXT_PUBLIC_SITE_URL, which the panel uses as the base
 * for its own absolute URLs (absUrl). The deploy sets NEXT_PUBLIC_LANDING_URL
 * to wherever the landing currently lives (dev.salon-bw.pl until the domain
 * cutover, then salon-bw.pl — docs/DOMAIN_CUTOVER_PLAN.md).
 */
export const LANDING_URL_FALLBACK = 'https://salon-bw.pl';

export function landingUrl(path = '/'): string {
    const base =
        process.env.NEXT_PUBLIC_LANDING_URL?.trim() || LANDING_URL_FALLBACK;
    try {
        return new URL(path, base).toString();
    } catch {
        return new URL(path, LANDING_URL_FALLBACK).toString();
    }
}

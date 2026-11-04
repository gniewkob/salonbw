/**
 * Helpers used by the DEV-only Studio V18 prototype.
 * Only known module URLs may be restored from browser-local preferences.
 */
export function decodeSavedStudioModules(
    stored: string | null,
    allowed: readonly string[],
): string[] {
    if (!stored) return [];
    try {
        const parsed: unknown = JSON.parse(stored);
        if (!Array.isArray(parsed)) return [];
        const allowedSet = new Set(allowed);
        return [...new Set(parsed.filter(
            (value): value is string =>
                typeof value === 'string' && allowedSet.has(value),
        ))];
    } catch {
        return [];
    }
}

/** Month is a zero-based JavaScript month, matching new Date(year, month, day). */
export function studioV18CalendarUrl(
    year: number,
    month: number,
    day: number,
): string {
    const monthString = String(month + 1).padStart(2, '0');
    const dayString = String(day).padStart(2, '0');
    return `/calendar?date=${year}-${monthString}-${dayString}`;
}

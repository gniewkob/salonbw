/**
 * Pure helpers for importing a Booksy business export (clients.csv,
 * appointments.csv). Kept free of database access so the rules that decide
 * what lands in the panel are unit-tested; scripts/import-booksy.ts does the
 * reading and writing.
 */

import { AppointmentStatus } from '../appointments/appointment.entity';

export const BOOKSY_SOURCE = 'booksy';

/**
 * Booksy writes missing values as the literal text "None" (clients) or
 * "null" (appointments).
 */
export function cleanBooksyValue(
    value: string | undefined | null,
): string | null {
    if (value === undefined || value === null) return null;
    const text = value.trim();
    if (!text) return null;
    const lowered = text.toLowerCase();
    if (lowered === 'none' || lowered === 'null') return null;
    return text;
}

/**
 * Polish numbers come as "+48 xxx xxx xxx"; a bare nine-digit number is
 * assumed to be Polish. Anything else keeps its own country code.
 */
export function normalizeBooksyPhone(
    raw: string | undefined | null,
): string | null {
    const text = cleanBooksyValue(raw);
    if (!text) return null;
    const digits = text.replace(/\D/g, '');
    if (digits.length < 9) return null;
    if (digits.length === 9) return `+48${digits}`;
    return `+${digits}`;
}

const EMAIL_SHAPE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function normalizeBooksyEmail(
    raw: string | undefined | null,
): string | null {
    const text = cleanBooksyValue(raw);
    if (!text) return null;
    const lowered = text.toLowerCase();
    return EMAIL_SHAPE.test(lowered) ? lowered : null;
}

/**
 * `users.email` is unique and required, so a client without a usable address
 * gets one under the reserved `.invalid` TLD — the same convention as
 * CustomersService — derived from the card id so re-runs stay stable.
 */
export function placeholderEmailForCard(cardId: string): string {
    return `booksy.${cardId}@import.local.invalid`;
}

export function splitBooksyName(full: string): {
    name: string;
    firstName: string | null;
    lastName: string | null;
} {
    const name = full.trim().replace(/\s+/g, ' ');
    const [first, ...rest] = name.split(' ');
    return {
        name,
        firstName: first || null,
        lastName: rest.length > 0 ? rest.join(' ') : null,
    };
}

export interface BooksyClientEmailInput {
    cardId: string;
    email: string | null;
    bookingCount: number;
}

/**
 * The same real address can appear on several cards (family members sharing a
 * mailbox). Only one account can own it, so it goes to the card with the most
 * bookings; the others fall back to a placeholder and are reported.
 */
export function assignClientEmails(clients: BooksyClientEmailInput[]): {
    emailByCard: Map<string, string | null>;
    sharedEmailCards: string[];
} {
    const owner = new Map<string, BooksyClientEmailInput>();
    for (const client of clients) {
        if (!client.email) continue;
        const current = owner.get(client.email);
        if (!current || client.bookingCount > current.bookingCount) {
            owner.set(client.email, client);
        }
    }
    const emailByCard = new Map<string, string | null>();
    const sharedEmailCards: string[] = [];
    for (const client of clients) {
        if (!client.email) {
            emailByCard.set(client.cardId, null);
        } else if (owner.get(client.email)?.cardId === client.cardId) {
            emailByCard.set(client.cardId, client.email);
        } else {
            emailByCard.set(client.cardId, null);
            sharedEmailCards.push(client.cardId);
        }
    }
    return { emailByCard, sharedEmailCards };
}

export interface MappedBooksyStatus {
    status: AppointmentStatus;
    cancellationReason: string | null;
}

export function mapBooksyStatus(raw: string): MappedBooksyStatus | null {
    switch (raw.trim().toLowerCase()) {
        case 'finished':
            return {
                status: AppointmentStatus.Completed,
                cancellationReason: null,
            };
        case 'cancelled':
            return {
                status: AppointmentStatus.Cancelled,
                cancellationReason: 'Odwołana (historia z Booksy)',
            };
        case 'declined':
            return {
                status: AppointmentStatus.Cancelled,
                cancellationReason: 'Odrzucona przez salon (historia z Booksy)',
            };
        case 'no-show':
        case 'noshow':
        case 'no_show':
            return {
                status: AppointmentStatus.NoShow,
                cancellationReason: null,
            };
        case 'confirmed':
            return {
                status: AppointmentStatus.Confirmed,
                cancellationReason: null,
            };
        default:
            return null;
    }
}

/**
 * Booksy timestamps ("2024-01-05 13:30:00") are salon wall-clock time with no
 * zone. They are built as local Dates, so the importer must run with the same
 * TZ as the API process (Europe/Warsaw) — the pg driver writes
 * `timestamp without time zone` columns in process-local time.
 */
export function parseBooksyDateTime(
    raw: string | undefined | null,
): Date | null {
    const text = cleanBooksyValue(raw);
    if (!text) return null;
    const match =
        /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/.exec(text);
    if (!match) return null;
    const [, y, mo, d, h, mi, s] = match;
    const date = new Date(
        Number(y),
        Number(mo) - 1,
        Number(d),
        Number(h),
        Number(mi),
        Number(s ?? 0),
    );
    return Number.isNaN(date.getTime()) ? null : date;
}

export function parseBooksyPrice(
    raw: string | undefined | null,
): number | null {
    const text = cleanBooksyValue(raw);
    if (!text) return null;
    const value = Number(text.replace(',', '.'));
    return Number.isFinite(value) && value >= 0 ? value : null;
}

/**
 * Matching key for service names: case, surrounding spaces, repeated spaces
 * and the dash variant ("-" vs "–") do not make two services different.
 */
export function serviceNameKey(name: string): string {
    return name
        .trim()
        .replace(/[–—]/g, '-')
        .replace(/\s+/g, ' ')
        .toLocaleLowerCase('pl-PL');
}

export function median(values: number[]): number | null {
    if (values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
        ? (sorted[mid - 1] + sorted[mid]) / 2
        : sorted[mid];
}

/**
 * Staff text for the client card: Booksy's secret note plus the blacklist
 * flag, which the panel has no dedicated field for.
 */
export function buildClientDescription(input: {
    secretNote: string | null;
    blacklisted: boolean;
}): string | null {
    const parts: string[] = [];
    if (input.blacklisted) parts.push('Booksy: klientka na czarnej liście.');
    if (input.secretNote) parts.push(`Notatka z Booksy: ${input.secretNote}`);
    return parts.length > 0 ? parts.join('\n') : null;
}

/**
 * The staff-only visit note: Booksy's business note, plus the original
 * staffer whenever the visit is attributed to a different panel account.
 */
export function buildVisitInternalNote(input: {
    businessNote: string | null;
    originalStaffer: string;
    attributedTo: string;
}): string | null {
    const parts: string[] = [];
    if (input.businessNote) parts.push(input.businessNote);
    if (
        input.originalStaffer.trim() &&
        input.originalStaffer.trim().toLocaleLowerCase('pl-PL') !==
            input.attributedTo.trim().toLocaleLowerCase('pl-PL')
    ) {
        parts.push(`Wykonała (Booksy): ${input.originalStaffer.trim()}`);
    }
    return parts.length > 0 ? parts.join('\n') : null;
}

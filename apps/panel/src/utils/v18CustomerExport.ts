import type { Customer } from '@/types';

/**
 * CSV export intentionally contains ONLY the current server page.
 * Excel interprets cells beginning with formula operators as expressions,
 * so prefix such values with a single quote before RFC 4180-style escaping.
 */
const columns = [
    'Imię',
    'Nazwisko',
    'Telefon',
    'Email',
    'Data urodzenia',
    'Płeć',
    'Miasto',
    'Ostatnia wizyta',
    'Zgoda email',
    'Zgoda SMS',
] as const;

function safeCell(value: string | null | undefined): string {
    const original = value ?? '';
    const text = /^[\s\uFEFF]*[=+@-]/u.test(original)
        ? "'" + original
        : original;
    return '"' + text.replaceAll('"', '""') + '"';
}

export function buildV18CustomerCsv(customers: readonly Customer[]): string {
    const rows = customers.map((customer) => [
        customer.firstName ?? '',
        customer.lastName ?? '',
        customer.phone ?? '',
        customer.email ?? '',
        customer.birthDate ?? '',
        customer.gender ?? '',
        customer.city ?? '',
        customer.lastVisitDate &&
        Number.isFinite(new Date(customer.lastVisitDate).getTime())
            ? new Date(customer.lastVisitDate).toLocaleDateString('pl-PL')
            : '',
        customer.emailConsent ? 'tak' : 'nie',
        customer.smsConsent ? 'tak' : 'nie',
    ]);
    const csv = [columns, ...rows]
        .map((row) => row.map((value) => safeCell(value)).join(';'))
        .join('\r\n');

    return '\uFEFF' + csv;
}

import type { Customer } from '@/types';
import { buildV18CustomerCsv } from '@/utils/v18CustomerExport';

const customer = {
    id: 11,
    name: 'Testowy Klient',
    firstName: '=2+2',
    lastName: 'Nowak;"Przykład"',
    phone: '+48123456789',
    email: 'test@example.invalid',
    city: 'Kraków',
    smsConsent: false,
    emailConsent: true,
    gdprConsent: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
} as Customer;

describe('V18 current-page CSV export', () => {
    it('exports only explicitly supplied rows with the existing CRM columns', () => {
        const csv = buildV18CustomerCsv([customer]);
        expect(csv.charCodeAt(0)).toBe(0xfeff);
        expect(csv.split('\r\n')).toHaveLength(2);
        expect(csv).toContain('"Imię";"Nazwisko";"Telefon";"Email"');
        expect(csv).toContain('"test@example.invalid"');
        expect(csv).toContain('"tak";"nie"');
    });

    it('quotes separators and quotes and neutralizes spreadsheet formulas', () => {
        const csv = buildV18CustomerCsv([customer]);
        expect(csv).toContain('"\'=2+2"');
        expect(csv).toContain('"Nowak;""Przykład"""');
        expect(csv).toContain('"\'+48123456789"');
    });

    it('produces header-only output for an empty page', () => {
        const csv = buildV18CustomerCsv([]);
        expect(csv.split('\r\n')).toHaveLength(1);
        expect(csv).not.toContain('Testowy Klient');
    });
});

import { AppointmentStatus } from '../appointments/appointment.entity';
import {
    assignClientEmails,
    buildClientDescription,
    buildVisitInternalNote,
    cleanBooksyValue,
    mapBooksyStatus,
    median,
    normalizeBooksyEmail,
    normalizeBooksyPhone,
    parseBooksyDateTime,
    parseBooksyPrice,
    placeholderEmailForCard,
    serviceNameKey,
    splitBooksyName,
} from './booksy-import-planning';

describe('booksy import planning', () => {
    it('treats Booksy "None"/"null" as missing', () => {
        expect(cleanBooksyValue('None')).toBeNull();
        expect(cleanBooksyValue(' null ')).toBeNull();
        expect(cleanBooksyValue('')).toBeNull();
        expect(cleanBooksyValue(' tekst ')).toBe('tekst');
    });

    it('normalizes phones and assumes Poland for nine digits', () => {
        expect(normalizeBooksyPhone('+48 601 234 567')).toBe('+48601234567');
        expect(normalizeBooksyPhone('601234567')).toBe('+48601234567');
        expect(normalizeBooksyPhone('+49 1512 3456789')).toBe('+4915123456789');
        expect(normalizeBooksyPhone('None')).toBeNull();
        expect(normalizeBooksyPhone('12345')).toBeNull();
    });

    it('accepts only e-mail shaped values', () => {
        expect(normalizeBooksyEmail('Anna@Example.PL ')).toBe('anna@example.pl');
        expect(normalizeBooksyEmail('None')).toBeNull();
        expect(normalizeBooksyEmail('brak')).toBeNull();
    });

    it('builds stable placeholder addresses under .invalid', () => {
        expect(placeholderEmailForCard('123')).toBe(
            'booksy.123@import.local.invalid',
        );
    });

    it('splits the full name on the first space', () => {
        expect(splitBooksyName('  Anna  Maria Nowak ')).toEqual({
            name: 'Anna Maria Nowak',
            firstName: 'Anna',
            lastName: 'Maria Nowak',
        });
        expect(splitBooksyName('Anna')).toEqual({
            name: 'Anna',
            firstName: 'Anna',
            lastName: null,
        });
    });

    it('gives a shared address to the card with the most bookings', () => {
        const { emailByCard, sharedEmailCards } = assignClientEmails([
            { cardId: '1', email: 'dom@example.pl', bookingCount: 2 },
            { cardId: '2', email: 'dom@example.pl', bookingCount: 9 },
            { cardId: '3', email: null, bookingCount: 1 },
            { cardId: '4', email: 'own@example.pl', bookingCount: 0 },
        ]);
        expect(emailByCard.get('2')).toBe('dom@example.pl');
        expect(emailByCard.get('1')).toBeNull();
        expect(emailByCard.get('3')).toBeNull();
        expect(emailByCard.get('4')).toBe('own@example.pl');
        expect(sharedEmailCards).toEqual(['1']);
    });

    it('maps every Booksy status in the export', () => {
        expect(mapBooksyStatus('Finished')?.status).toBe(
            AppointmentStatus.Completed,
        );
        expect(mapBooksyStatus('Cancelled')?.status).toBe(
            AppointmentStatus.Cancelled,
        );
        expect(mapBooksyStatus('Declined')).toEqual({
            status: AppointmentStatus.Cancelled,
            cancellationReason: 'Odrzucona przez salon (historia z Booksy)',
        });
        expect(mapBooksyStatus('No-show')?.status).toBe(
            AppointmentStatus.NoShow,
        );
        expect(mapBooksyStatus('Confirmed')?.status).toBe(
            AppointmentStatus.Confirmed,
        );
        expect(mapBooksyStatus('Something')).toBeNull();
    });

    it('reads Booksy timestamps as local wall-clock time', () => {
        const date = parseBooksyDateTime('2024-01-05 13:30:00');
        expect(date?.getFullYear()).toBe(2024);
        expect(date?.getMonth()).toBe(0);
        expect(date?.getDate()).toBe(5);
        expect(date?.getHours()).toBe(13);
        expect(date?.getMinutes()).toBe(30);
        expect(parseBooksyDateTime('null')).toBeNull();
        expect(parseBooksyDateTime('05.01.2024')).toBeNull();
    });

    it('parses prices and rejects missing or negative ones', () => {
        expect(parseBooksyPrice('240.0')).toBe(240);
        expect(parseBooksyPrice('null')).toBeNull();
        expect(parseBooksyPrice('-5')).toBeNull();
    });

    it('matches service names regardless of case, spacing and dash', () => {
        expect(serviceNameKey(' Strzyżenie  Damskie – włosy krótkie ')).toBe(
            serviceNameKey('strzyżenie damskie - włosy krótkie'),
        );
    });

    it('computes a median', () => {
        expect(median([])).toBeNull();
        expect(median([3, 1, 2])).toBe(2);
        expect(median([4, 1, 2, 3])).toBe(2.5);
    });

    it('keeps blacklist and secret note in the staff description', () => {
        expect(
            buildClientDescription({ secretNote: null, blacklisted: false }),
        ).toBeNull();
        expect(
            buildClientDescription({ secretNote: 'uwaga', blacklisted: true }),
        ).toBe('Booksy: klientka na czarnej liście.\nNotatka z Booksy: uwaga');
    });

    it('names the original staffer only when attribution differs', () => {
        expect(
            buildVisitInternalNote({
                businessNote: '7.1 + 6%',
                originalStaffer: 'Aleksandra Bodora',
                attributedTo: 'aleksandra bodora',
            }),
        ).toBe('7.1 + 6%');
        expect(
            buildVisitInternalNote({
                businessNote: null,
                originalStaffer: 'Byla Pracownica',
                attributedTo: 'Aleksandra Bodora',
            }),
        ).toBe('Wykonała (Booksy): Byla Pracownica');
    });
});

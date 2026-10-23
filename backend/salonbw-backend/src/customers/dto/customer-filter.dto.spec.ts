import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CustomerFilterDto } from './customer-filter.dto';

// Query strings reach the DTO as text. `@Type(() => Boolean)` turned "false"
// into true (Boolean("false") === true), so the "Brak zgody email/SMS" quick
// filters asked for clients WITH consent and always returned 0.
describe('CustomerFilterDto boolean query params', () => {
    const fields = [
        'hasUpcomingVisit',
        'recentlyAdded',
        'noOnlineReservations',
        'smsConsent',
        'emailConsent',
    ] as const;

    const parse = async (query: Record<string, unknown>) => {
        const dto = plainToInstance(CustomerFilterDto, query);
        const errors = await validate(dto);
        return { dto, errors };
    };

    it.each(fields)('parses "false" in %s as false', async (field) => {
        const { dto, errors } = await parse({ [field]: 'false' });
        expect(errors).toHaveLength(0);
        expect(dto[field]).toBe(false);
    });

    it.each(fields)('parses "true" in %s as true', async (field) => {
        const { dto, errors } = await parse({ [field]: 'true' });
        expect(errors).toHaveLength(0);
        expect(dto[field]).toBe(true);
    });

    it('keeps real booleans and leaves absent params undefined', async () => {
        const { dto, errors } = await parse({ emailConsent: false });
        expect(errors).toHaveLength(0);
        expect(dto.emailConsent).toBe(false);
        expect(dto.smsConsent).toBeUndefined();
    });

    it('rejects values that are not a boolean', async () => {
        const { errors } = await parse({ emailConsent: 'maybe' });
        expect(errors.map((e) => e.property)).toContain('emailConsent');
    });
});

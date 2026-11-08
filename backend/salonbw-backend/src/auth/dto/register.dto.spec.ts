import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';

const makeDto = (overrides: Partial<RegisterDto> = {}): RegisterDto =>
    Object.assign(new RegisterDto(), {
        email: 'klient@example.invalid',
        name: 'Klientka Testowa',
        password: 'Test-Password-2026!',
        termsConsent: true,
        ...overrides,
    });

describe('RegisterDto — privacy and booking requirements', () => {
    it('accepts an account registration without a GDPR checkbox', async () => {
        const violations = await validate(makeDto());
        expect(violations).toHaveLength(0);
    });

    it('accepts explicit false for the historical GDPR flag', async () => {
        const violations = await validate(makeDto({ gdprConsent: false }));
        expect(violations).toHaveLength(0);
    });

    it('still requires acceptance of the booking terms', async () => {
        const violations = await validate(
            makeDto({ termsConsent: false as unknown as true }),
        );
        expect(violations.map((v) => v.property)).toContain('termsConsent');
    });

    it('rejects non-boolean historical GDPR values', async () => {
        const violations = await validate(
            makeDto({ gdprConsent: 'yes' as unknown as boolean }),
        );
        expect(violations.map((v) => v.property)).toContain('gdprConsent');
    });
});

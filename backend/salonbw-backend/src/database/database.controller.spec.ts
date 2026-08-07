import { ForbiddenException } from '@nestjs/common';
import { assertSeedingAllowed } from './database.controller';

describe('assertSeedingAllowed', () => {
    // The endpoint is @Roles(Admin), but the owner IS the admin — role alone
    // never protected production from an accidental seed.
    it('blocks seeding on production by default', () => {
        expect(() =>
            assertSeedingAllowed({ NODE_ENV: 'production' } as NodeJS.ProcessEnv),
        ).toThrow(ForbiddenException);
    });

    it('allows seeding on production only when explicitly pre-live', () => {
        expect(() =>
            assertSeedingAllowed({
                NODE_ENV: 'production',
                APP_LIFECYCLE: 'prelive',
            } as NodeJS.ProcessEnv),
        ).not.toThrow();
    });

    it('leaves non-production environments alone', () => {
        expect(() =>
            assertSeedingAllowed({
                NODE_ENV: 'development',
            } as NodeJS.ProcessEnv),
        ).not.toThrow();
        expect(() => assertSeedingAllowed({} as NodeJS.ProcessEnv)).not.toThrow();
    });

    // A typo'd or half-set lifecycle must not read as permission.
    it('does not treat an arbitrary lifecycle value as permission', () => {
        expect(() =>
            assertSeedingAllowed({
                NODE_ENV: 'production',
                APP_LIFECYCLE: 'live',
            } as NodeJS.ProcessEnv),
        ).toThrow(ForbiddenException);
    });
});

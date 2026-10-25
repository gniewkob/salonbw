import { webcrypto } from 'node:crypto';
import { TextEncoder as NodeTextEncoder } from 'node:util';
import { developmentAccessAllowed } from '@salonbw/api';

describe('frontend development access', () => {
    const cryptoDescriptor = Object.getOwnPropertyDescriptor(
        globalThis,
        'crypto',
    );
    const encoderDescriptor = Object.getOwnPropertyDescriptor(
        globalThis,
        'TextEncoder',
    );
    beforeAll(() => {
        Object.defineProperty(globalThis, 'crypto', {
            configurable: true,
            value: webcrypto,
        });
        Object.defineProperty(globalThis, 'TextEncoder', {
            configurable: true,
            value: NodeTextEncoder,
        });
    });
    afterAll(() => {
        if (cryptoDescriptor)
            Object.defineProperty(globalThis, 'crypto', cryptoDescriptor);
        if (encoderDescriptor)
            Object.defineProperty(globalThis, 'TextEncoder', encoderDescriptor);
    });
    it('leaves production requests unchanged', async () => {
        expect(
            await developmentAccessAllowed(null, {
                NEXT_PUBLIC_DEPLOYMENT_ENV: 'production',
            }),
        ).toBe(true);
    });
    it('requires dedicated gateway credentials for development', async () => {
        const env = {
            NEXT_PUBLIC_DEPLOYMENT_ENV: 'development',
            DEV_ACCESS_USER: 'fixture-user',
            DEV_ACCESS_PASSWORD: 'fixture-password',
        };
        expect(await developmentAccessAllowed(null, env)).toBe(false);
        expect(
            await developmentAccessAllowed(
                'Basic ' + btoa('fixture-user:wrong'),
                env,
            ),
        ).toBe(false);
        expect(
            await developmentAccessAllowed(
                'Basic ' + btoa('fixture-user:fixture-password'),
                env,
            ),
        ).toBe(true);
    });
    it('fails closed with incomplete configuration', async () => {
        expect(
            await developmentAccessAllowed('Basic fixture', {
                NEXT_PUBLIC_DEPLOYMENT_ENV: 'development',
            }),
        ).toBe(false);
    });
});

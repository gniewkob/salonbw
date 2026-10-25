import { developmentAccessAllowed } from './development-access';

describe('development access boundary', () => {
    const env = {
        APP_ENV: 'development',
        DEV_ACCESS_USER: 'fixture-user',
        DEV_ACCESS_PASSWORD: 'fixture-password',
    };
    it('requires dedicated credentials on development only', () => {
        expect(developmentAccessAllowed(undefined, env)).toBe(false);
        expect(
            developmentAccessAllowed(
                'Basic ' + Buffer.from('fixture-user:wrong').toString('base64'),
                env,
            ),
        ).toBe(false);
        expect(
            developmentAccessAllowed(
                'Basic ' +
                    Buffer.from('fixture-user:fixture-password').toString(
                        'base64',
                    ),
                env,
            ),
        ).toBe(true);
        expect(
            developmentAccessAllowed(undefined, { APP_ENV: 'production' }),
        ).toBe(true);
    });
    it('fails closed if access configuration is incomplete', () => {
        expect(
            developmentAccessAllowed('Basic fixture', {
                APP_ENV: 'development',
            }),
        ).toBe(false);
    });
});

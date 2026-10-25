import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { LoginAttemptsService } from './login-attempts.service';
import { Repository } from 'typeorm';
import { RefreshToken } from './refresh-token.entity';
import type { Response } from 'express';
import {
    authCookieName,
    outboundDeliveryEnabled,
    assertDevelopmentEnvironment,
} from '../environment-isolation';

describe('development environment boundaries', () => {
    const saved = process.env.AUTH_COOKIE_PREFIX;
    afterEach(() => {
        if (saved === undefined) delete process.env.AUTH_COOKIE_PREFIX;
        else process.env.AUTH_COOKIE_PREFIX = saved;
    });
    it('retains production cookie names by default and separates development names', () => {
        expect(authCookieName('accessToken', '')).toBe('accessToken');
        expect(authCookieName('accessToken', 'dev_')).toBe('dev_accessToken');
        expect(() => authCookieName('accessToken', '../')).toThrow();
    });
    it('writes and clears only the selected environment cookies', () => {
        process.env.AUTH_COOKIE_PREFIX = 'dev_';
        const config = new ConfigService({
            NODE_ENV: 'production',
            COOKIE_DOMAIN: 'dev-panel.salon-bw.pl',
        });
        const service = new AuthService(
            {} as UsersService,
            {} as JwtService,
            config,
            {} as LoginAttemptsService,
            {} as Repository<RefreshToken>,
        );
        const cookie = jest.fn();
        const response = { cookie } as unknown as Response;
        service.setAuthCookies(
            response,
            'fixture-access',
            'fixture-refresh',
            'fixture-csrf',
        );
        expect(cookie.mock.calls.map((c: unknown[]) => c[0])).toEqual([
            'dev_accessToken',
            'dev_refreshToken',
            'dev_XSRF-TOKEN',
            'dev_sbw_auth',
        ]);
        cookie.mockClear();
        service.clearAuthCookies(response);
        expect(cookie.mock.calls.map((c: unknown[]) => c[0])).toEqual([
            'dev_accessToken',
            'dev_refreshToken',
            'dev_XSRF-TOKEN',
            'dev_sbw_auth',
        ]);
    });
    it('forces all outbound delivery off in development even with an enabled flag', () => {
        expect(
            outboundDeliveryEnabled({
                APP_ENV: 'development',
                OUTBOUND_DELIVERY_ENABLED: 'true',
            }),
        ).toBe(false);
        expect(
            outboundDeliveryEnabled({
                APP_ENV: 'production',
                OUTBOUND_DELIVERY_ENABLED: 'false',
            }),
        ).toBe(false);
        expect(outboundDeliveryEnabled({ APP_ENV: 'production' })).toBe(true);
    });
    it('refuses development with missing isolation settings or a production database', () => {
        expect(() =>
            assertDevelopmentEnvironment({ APP_ENV: 'development' }),
        ).toThrow();
        expect(() =>
            assertDevelopmentEnvironment({
                APP_ENV: 'development',
                DATABASE_URL:
                    'postgresql://fixture:fixture@localhost/production',
                DEV_DATABASE_NAME: 'isolated_dev',
                AUTH_COOKIE_PREFIX: 'dev_',
                OUTBOUND_DELIVERY_ENABLED: 'false',
            }),
        ).toThrow();
        expect(() =>
            assertDevelopmentEnvironment({ APP_ENV: 'production' }),
        ).not.toThrow();
    });
});

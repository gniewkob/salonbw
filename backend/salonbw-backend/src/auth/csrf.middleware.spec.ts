import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { Repository } from 'typeorm';
import { CsrfMiddleware } from './csrf.middleware';
import { RefreshToken } from './refresh-token.entity';

describe('CsrfMiddleware public password recovery routes', () => {
    const middleware = new CsrfMiddleware(
        {} as JwtService,
        { get: jest.fn() } as unknown as ConfigService,
        {} as Repository<RefreshToken>,
    );

    it.each([
        '/auth/forgot-password',
        '/auth/reset-password',
        '/auth/reset-password/',
    ])('allows the exact public route %s without a session', async (path) => {
        const next = jest.fn();
        await middleware.use(
            {
                method: 'POST',
                baseUrl: '',
                path,
                originalUrl: path,
            } as Request,
            {} as Response,
            next,
        );
        expect(next).toHaveBeenCalledTimes(1);
    });

    it('does not exempt a different route containing an auth path', async () => {
        const path = '/internal/auth/reset-password';
        await expect(
            middleware.use(
                {
                    method: 'POST',
                    baseUrl: '',
                    path,
                    originalUrl: path,
                    get: jest.fn(),
                } as unknown as Request,
                {} as Response,
                jest.fn(),
            ),
        ).rejects.toThrow(UnauthorizedException);
    });
});

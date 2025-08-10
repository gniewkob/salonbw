import {
    ExecutionContext,
    HttpArgumentsHost,
    RpcArgumentsHost,
    WsArgumentsHost,
} from '@nestjs/common';
import { Request } from 'express';
import { getCurrentUser } from './current-user.decorator';

describe('CurrentUser decorator', () => {
    it('should return user from request object', () => {
        const mockUser = { id: 1, email: 'test@example.com' };
        const request = { user: mockUser } as Request & {
            user: typeof mockUser;
        };
        const httpHost: HttpArgumentsHost = {
            getRequest: (): Request & { user: typeof mockUser } => request,
            getResponse: (): unknown => undefined,
            getNext: (): unknown => undefined,
        };
        const ctx: ExecutionContext = {
            getArgByIndex: (): unknown => undefined,
            getArgs: (): unknown[] => [],
            getClass: () => class {},
            getHandler: () => () => undefined,
            getType: () => 'http',
            switchToHttp: (): HttpArgumentsHost => httpHost,
            switchToRpc: (): RpcArgumentsHost => ({
                getContext: (): unknown => undefined,
                getData: (): unknown => undefined,
            }),
            switchToWs: (): WsArgumentsHost => ({
                getClient: (): unknown => undefined,
                getData: (): unknown => undefined,
                getPattern: (): string => '',
            }),
        };

        const result = getCurrentUser(ctx);
        expect(result).toEqual(mockUser);
    });
});

import { ExecutionContext } from '@nestjs/common';
import { getCurrentUser } from './current-user.decorator';

describe('CurrentUser decorator', () => {
    it('should return user from request object', () => {
        const mockUser = { id: 1, email: 'test@example.com' };
        const ctx = {
            switchToHttp: () => ({
                getRequest: () => ({ user: mockUser }),
            }),
        } as unknown as ExecutionContext;

        const result = getCurrentUser(ctx);
        expect(result).toEqual(mockUser);
    });
});


describe('auth api simple', () => {
    let requestMock: jest.Mock;

    beforeEach(() => {
        jest.resetModules();
        requestMock = jest.fn();
        jest.doMock('@/api/apiClient', () => ({
            __esModule: true,
            ApiClient: jest
                .fn()
                .mockImplementation(() => ({ request: requestMock })),
        }));
    });

    it('login maps snake_case tokens and refreshToken maps camelCase', async () => {
        const { login, refreshToken, REFRESH_TOKEN_KEY } =
            await import('@/api/auth');
        requestMock.mockResolvedValueOnce({
            access_token: 'a',
            refresh_token: 'r',
        });
        const tokens = await login({ email: 'e', password: 'p' });
        expect(tokens).toEqual({ accessToken: 'a', refreshToken: 'r' });

        // refresh
        localStorage.setItem(REFRESH_TOKEN_KEY, 'r');
        requestMock.mockResolvedValueOnce({
            accessToken: 'na',
            refreshToken: 'nr',
        });
        const newTokens = await refreshToken();
        expect(newTokens).toEqual({ accessToken: 'na', refreshToken: 'nr' });
    });

    it('register surfaces error message', async () => {
        const { register } = await import('@/api/auth');
        requestMock.mockRejectedValueOnce(new Error('taken'));
        await expect(
            register({ name: 'U', email: 'e', phone: '1', password: 'p' }),
        ).rejects.toThrow('taken');
    });

    it('register returns user on success', async () => {
        const { register } = await import('@/api/auth');
        requestMock.mockResolvedValueOnce({ id: 7, name: 'User' });
        const user = await register({
            name: 'User',
            email: 'e',
            phone: '1',
            password: 'p',
        });
        expect(user).toMatchObject({ id: 7, name: 'User' });
    });

    it('login throws generic message when non-error thrown', async () => {
        const { login } = await import('@/api/auth');
        // throw a non-Error value to hit generic path
        requestMock.mockRejectedValueOnce('nope');
        await expect(login({ email: 'e', password: 'p' })).rejects.toThrow(
            'Login failed',
        );
    });

    it('refreshToken throws generic message when non-error thrown', async () => {
        const { refreshToken, REFRESH_TOKEN_KEY } = await import('@/api/auth');
        localStorage.setItem(REFRESH_TOKEN_KEY, 'r');
        requestMock.mockRejectedValueOnce('nope');
        await expect(refreshToken()).rejects.toThrow('Token refresh failed');
    });
});

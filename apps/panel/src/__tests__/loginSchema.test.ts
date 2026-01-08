import { loginValidationSchema } from '@/pages/auth/login';

describe('loginValidationSchema', () => {
    it('requires email and password', async () => {
        await expect(
            loginValidationSchema.validateAt('email', {
                email: '',
                password: '',
            }),
        ).rejects.toThrow('Email is required');
        await expect(
            loginValidationSchema.validateAt('password', {
                email: 'a@b.com',
                password: '',
            }),
        ).rejects.toThrow('Password is required');
    });

    it('validates email format', async () => {
        await expect(
            loginValidationSchema.validate(
                { email: 'bad', password: 'secret' },
                { abortEarly: false },
            ),
        ).rejects.toThrow('Invalid email');
        await expect(
            loginValidationSchema.isValid({
                email: 'user@example.com',
                password: 'secret',
            }),
        ).resolves.toBe(true);
    });
});

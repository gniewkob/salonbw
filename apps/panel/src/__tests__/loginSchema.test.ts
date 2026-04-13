import { loginValidationSchema } from '@/pages/auth/login';

describe('loginValidationSchema', () => {
    it('requires email and password', async () => {
        await expect(
            loginValidationSchema.validateAt('email', {
                email: '',
                password: '',
            }),
        ).rejects.toThrow('Podaj adres e-mail');
        await expect(
            loginValidationSchema.validateAt('password', {
                email: 'a@b.com',
                password: '',
            }),
        ).rejects.toThrow('Podaj hasło');
    });

    it('validates email format', async () => {
        await expect(
            loginValidationSchema.validate(
                { email: 'bad', password: 'secret' },
                { abortEarly: false },
            ),
        ).rejects.toThrow('Podaj poprawny adres e-mail');
        await expect(
            loginValidationSchema.isValid({
                email: 'user@example.com',
                password: 'secret',
            }),
        ).resolves.toBe(true);
    });
});

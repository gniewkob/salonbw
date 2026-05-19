import { loginValidationSchema } from '@/pages/auth/login';

describe('loginValidationSchema', () => {
    it('requires email and password', async () => {
        await expect(
            loginValidationSchema.validateAt('email', {
                email: '',
                password: '',
            }),
        ).rejects.toThrow('Adres e-mail jest wymagany');
        await expect(
            loginValidationSchema.validateAt('password', {
                email: 'a@b.com',
                password: '',
            }),
        ).rejects.toThrow('Hasło jest wymagane');
    });

    it('validates email format', async () => {
        await expect(
            loginValidationSchema.validate(
                { email: 'bad', password: 'secret' },
                { abortEarly: false },
            ),
        ).rejects.toThrow('Nieprawidłowy adres e-mail');
        await expect(
            loginValidationSchema.isValid({
                email: 'user@example.com',
                password: 'secret',
            }),
        ).resolves.toBe(true);
    });
});

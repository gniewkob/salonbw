import { registerValidationSchema } from '@/pages/auth/register';

describe('registerValidationSchema', () => {
    it('requires name, email and password', async () => {
        await expect(
            registerValidationSchema.validateAt('name', {
                name: '',
                email: '',
                phone: '',
                password: '',
            }),
        ).rejects.toThrow('Podaj imię i nazwisko');

        await expect(
            registerValidationSchema.validateAt('email', {
                name: 'Jan Kowalski',
                email: '',
                phone: '',
                password: '',
            }),
        ).rejects.toThrow('Podaj adres e-mail');

        await expect(
            registerValidationSchema.validateAt('password', {
                name: 'Jan Kowalski',
                email: 'jan@example.com',
                phone: '',
                password: '',
            }),
        ).rejects.toThrow('Podaj hasło');
    });

    it('validates email format and password length', async () => {
        await expect(
            registerValidationSchema.validate({
                name: 'Jan Kowalski',
                email: 'bad',
                phone: '',
                password: '123456',
            }),
        ).rejects.toThrow('Podaj poprawny adres e-mail');

        await expect(
            registerValidationSchema.validate({
                name: 'Jan Kowalski',
                email: 'jan@example.com',
                phone: '',
                password: '123',
            }),
        ).rejects.toThrow('Hasło musi mieć co najmniej 6 znaków');

        await expect(
            registerValidationSchema.isValid({
                name: 'Jan Kowalski',
                email: 'jan@example.com',
                phone: '',
                password: '123456',
            }),
        ).resolves.toBe(true);
    });
});

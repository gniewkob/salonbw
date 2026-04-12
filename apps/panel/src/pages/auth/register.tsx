import { FormEvent, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { getPostLoginRoute } from '@/utils/postLoginRoute';
import type { User } from '@/types';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RegisterFormValues = {
    name: string;
    email: string;
    phone: string;
    password: string;
};

type RegisterErrors = Partial<Record<keyof RegisterFormValues, string>>;

const validateRegisterForm = (values: RegisterFormValues): RegisterErrors => {
    const errors: RegisterErrors = {};
    if (!values.name.trim()) {
        errors.name = 'Podaj imię i nazwisko';
    }
    const trimmedEmail = values.email.trim();
    if (!trimmedEmail) {
        errors.email = 'Podaj adres e-mail';
    } else if (!emailPattern.test(trimmedEmail)) {
        errors.email = 'Podaj poprawny adres e-mail';
    }
    if (!values.password) {
        errors.password = 'Podaj hasło';
    } else if (values.password.length < 6) {
        errors.password = 'Hasło musi mieć co najmniej 6 znaków';
    }
    return errors;
};

export const registerValidationSchema = {
    async validateAt(
        field: keyof RegisterFormValues,
        values: RegisterFormValues,
    ) {
        const errors = validateRegisterForm(values);
        const message = errors[field];
        if (message) {
            throw new Error(message);
        }
    },
    async validate(values: RegisterFormValues) {
        const errors = validateRegisterForm(values);
        if (Object.keys(errors).length > 0) {
            throw new Error(
                errors.name ??
                    errors.email ??
                    errors.password ??
                    'Formularz rejestracji zawiera błędy',
            );
        }
        return values;
    },
    async isValid(values: RegisterFormValues) {
        return Object.keys(validateRegisterForm(values)).length === 0;
    },
};

export default function RegisterPage() {
    const { register, apiFetch } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState<RegisterFormValues>({
        name: '',
        email: '',
        phone: '',
        password: '',
    });
    const [touched, setTouched] = useState<
        Partial<Record<keyof RegisterFormValues, boolean>>
    >({});
    const [errors, setErrors] = useState<RegisterErrors>({});
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const runValidation = (currentForm: RegisterFormValues) => {
        const nextErrors = validateRegisterForm(currentForm);
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleChange = (field: keyof RegisterFormValues, value: string) => {
        const nextForm = { ...form, [field]: value };
        setForm(nextForm);
        if (touched[field]) {
            runValidation(nextForm);
        }
    };

    const handleBlur = (field: keyof RegisterFormValues) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
        runValidation(form);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        const valid = runValidation(form);
        if (!valid) {
            setTouched({
                name: true,
                email: true,
                phone: true,
                password: true,
            });
            return;
        }

        setSubmitting(true);
        try {
            await register(form);
            const profile = await apiFetch<User>('/users/profile');
            void router.push(getPostLoginRoute(profile?.role));
        } catch (err: unknown) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Nie udało się utworzyć konta. Spróbuj ponownie.',
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-3 bg-white">
            <button onClick={() => router.back()} className="mb-3">
                &larr; Wróć
            </button>
            <form
                onSubmit={(e) => void handleSubmit(e)}
                className="gap-2 mx-auto"
                noValidate
            >
                <h1 className="fs-3 fw-bold">Załóż konto</h1>
                <p className="text-muted small mb-3">
                    Utwórz konto, aby przejść do panelu rezerwacji i obsługi
                    klientów.
                </p>

                <div>
                    <input
                        className={`border p-2 w-100 rounded ${
                            touched.name && errors.name ? 'border-danger' : ''
                        }`}
                        placeholder="Imię i nazwisko"
                        value={form.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        onBlur={() => handleBlur('name')}
                    />
                    {touched.name && errors.name && (
                        <p className="text-danger small mt-1">{errors.name}</p>
                    )}
                </div>

                <div>
                    <input
                        className={`border p-2 w-100 rounded ${
                            touched.email && errors.email ? 'border-danger' : ''
                        }`}
                        placeholder="Adres e-mail"
                        type="email"
                        value={form.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        onBlur={() => handleBlur('email')}
                    />
                    {touched.email && errors.email && (
                        <p className="text-danger small mt-1">{errors.email}</p>
                    )}
                </div>

                <div>
                    <input
                        className="border p-2 w-100 rounded"
                        placeholder="Telefon (opcjonalnie)"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                    />
                </div>

                <div>
                    <input
                        className={`border p-2 w-100 rounded ${
                            touched.password && errors.password
                                ? 'border-danger'
                                : ''
                        }`}
                        placeholder="Hasło"
                        type="password"
                        value={form.password}
                        onChange={(e) =>
                            handleChange('password', e.target.value)
                        }
                        onBlur={() => handleBlur('password')}
                    />
                    {touched.password && errors.password && (
                        <p className="text-danger small mt-1">
                            {errors.password}
                        </p>
                    )}
                </div>

                <button
                    className="bg-primary bg-opacity-10 text-white px-3 py-2 rounded w-100"
                    type="submit"
                    disabled={submitting}
                >
                    {submitting ? 'Tworzenie konta...' : 'Zarejestruj się'}
                </button>
                {error && (
                    <p role="alert" className="text-danger text-center">
                        {error}
                    </p>
                )}
                <p className="text-center small">
                    Masz już konto?{' '}
                    <Link href="/auth/login" className="text-primary">
                        Zaloguj się
                    </Link>
                </p>
            </form>
        </div>
    );
}

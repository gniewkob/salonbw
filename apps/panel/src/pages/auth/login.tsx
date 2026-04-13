import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { getPostLoginRoute } from '@/utils/postLoginRoute';
import SocialAuthButtons from '@/components/auth/SocialAuthButtons';
import type { User } from '@/types';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LoginFormValues = {
    email: string;
    password: string;
};

type LoginErrors = Partial<Record<keyof LoginFormValues, string>>;

const validateLoginForm = (values: LoginFormValues): LoginErrors => {
    const errors: LoginErrors = {};
    const trimmedEmail = values.email.trim();
    if (!trimmedEmail) {
        errors.email = 'Podaj adres e-mail';
    } else if (!emailPattern.test(trimmedEmail)) {
        errors.email = 'Podaj poprawny adres e-mail';
    }
    if (!values.password.trim()) {
        errors.password = 'Podaj hasło';
    }
    return errors;
};

export const loginValidationSchema = {
    async validateAt(field: keyof LoginFormValues, values: LoginFormValues) {
        const errors = validateLoginForm(values);
        const message = errors[field];
        if (message) {
            throw new Error(message);
        }
    },
    async validate(values: LoginFormValues) {
        const errors = validateLoginForm(values);
        if (Object.keys(errors).length > 0) {
            throw new Error(
                errors.email ??
                    errors.password ??
                    'Podaj poprawny adres e-mail',
            );
        }
        return values;
    },
    async isValid(values: LoginFormValues) {
        return Object.keys(validateLoginForm(values)).length === 0;
    },
};

export default function LoginPage() {
    const { login, apiFetch } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState<LoginFormValues>({
        email: '',
        password: '',
    });
    const [touched, setTouched] = useState({
        email: false,
        password: false,
    });
    const [errors, setErrors] = useState<LoginErrors>({});
    const [status, setStatus] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const trimmedEmail = useMemo(() => form.email.trim(), [form.email]);

    const runValidation = () => {
        const nextErrors = validateLoginForm({
            email: trimmedEmail,
            password: form.password,
        });
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setStatus('');
        const valid = runValidation();
        if (!valid) {
            setTouched({ email: true, password: true });
            return;
        }

        setSubmitting(true);
        try {
            await login(trimmedEmail, form.password);
            const profile = await apiFetch<User>('/users/profile');
            const fallback = getPostLoginRoute(profile?.role);
            const redirectTo =
                typeof router.query.redirectTo === 'string'
                    ? router.query.redirectTo
                    : '';
            void router.push(redirectTo || fallback);
        } catch (err: unknown) {
            setStatus(
                err instanceof Error
                    ? err.message
                    : 'Nie udało się zalogować. Spróbuj ponownie.',
            );
            setForm((prev) => ({ ...prev, password: '' }));
        } finally {
            setSubmitting(false);
        }
    };

    const handleBlur = (field: 'email' | 'password') => {
        setTouched((prev) => ({ ...prev, [field]: true }));
        runValidation();
    };

    return (
        <div
            className="d-flex flex-column align-items-center justify-content-center py-5 px-4 bg-light"
            style={{ minHeight: '100vh' }}
        >
            <div className="w-100" style={{ maxWidth: 448 }}>
                <div className="text-center">
                    <h2 className="mt-4 fs-3 fw-bold text-dark">
                        Zaloguj się do panelu SalonBW
                    </h2>
                    <p className="mt-2 text-muted small">
                        Zarządzaj wizytami, klientami i komunikacją salonu w
                        jednym miejscu.
                    </p>
                </div>
                <form
                    className="mt-4"
                    onSubmit={(event) => {
                        void handleSubmit(event);
                    }}
                >
                    <div className="mb-3">
                        <div>
                            <label htmlFor="email" className="visually-hidden">
                                Adres e-mail
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="form-control rounded-top"
                                placeholder="Adres e-mail"
                                value={form.email}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    setForm((prev) => ({
                                        ...prev,
                                        email: value,
                                    }));
                                    if (touched.email) {
                                        const fieldErrors = validateLoginForm({
                                            email: value,
                                            password: form.password,
                                        });
                                        setErrors((prev) => ({
                                            ...prev,
                                            email: fieldErrors.email,
                                        }));
                                    }
                                }}
                                onBlur={() => handleBlur('email')}
                            />
                            {touched.email && errors.email && (
                                <p
                                    role="alert"
                                    className="text-danger small mt-1"
                                >
                                    {errors.email}
                                </p>
                            )}
                        </div>
                        <div>
                            <label
                                htmlFor="password"
                                className="visually-hidden"
                            >
                                Hasło
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="form-control rounded-bottom"
                                placeholder="Hasło"
                                value={form.password}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    setForm((prev) => ({
                                        ...prev,
                                        password: value,
                                    }));
                                    if (touched.password) {
                                        const fieldErrors = validateLoginForm({
                                            email: form.email,
                                            password: value,
                                        });
                                        setErrors((prev) => ({
                                            ...prev,
                                            password: fieldErrors.password,
                                        }));
                                    }
                                }}
                                onBlur={() => handleBlur('password')}
                            />
                            {touched.password && errors.password && (
                                <p
                                    role="alert"
                                    className="text-danger small mt-1"
                                >
                                    {errors.password}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn btn-primary w-100"
                        >
                            {submitting ? 'Logowanie...' : 'Zaloguj się'}
                        </button>
                    </div>

                    <SocialAuthButtons />

                    {status && (
                        <div className="text-center mt-3">
                            <p role="alert" className="text-danger small">
                                {status}
                            </p>
                        </div>
                    )}
                </form>
                <div className="text-center small mt-3">
                    <p>
                        Nie masz jeszcze konta?{' '}
                        <Link
                            href="/auth/register"
                            prefetch={false}
                            className="fw-semibold text-primary"
                        >
                            Zarejestruj się
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

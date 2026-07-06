import { FormEvent, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { getPostLoginRoute } from '@/utils/postLoginRoute';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';
import {
    AuthField,
    AuthPageShell,
    AuthStatus,
    AuthSubmitButton,
    AuthTextInput,
} from '@/components/auth/AuthPageShell';
import type { User } from '@/types';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LoginFormValues = { email: string; password: string };
type LoginErrors = Partial<Record<keyof LoginFormValues, string>>;

const validateLoginForm = (values: LoginFormValues): LoginErrors => {
    const errors: LoginErrors = {};
    const trimmedEmail = values.email.trim();
    if (!trimmedEmail) {
        errors.email = 'Adres e-mail jest wymagany';
    } else if (!emailPattern.test(trimmedEmail)) {
        errors.email = 'Nieprawidłowy adres e-mail';
    }
    if (!values.password.trim()) {
        errors.password = 'Hasło jest wymagane';
    }
    return errors;
};

export const loginValidationSchema = {
    async validateAt(field: keyof LoginFormValues, values: LoginFormValues) {
        const errors = validateLoginForm(values);
        const message = errors[field];
        if (message) throw new Error(message);
    },
    async validate(values: LoginFormValues) {
        const errors = validateLoginForm(values);
        if (Object.keys(errors).length > 0) {
            throw new Error(
                errors.email ?? errors.password ?? 'Nieprawidłowe dane',
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
    const [touched, setTouched] = useState({ email: false, password: false });
    const [errors, setErrors] = useState<LoginErrors>({});
    const [status, setStatus] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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
            // Accept both ?redirect= (from landing) and ?redirectTo= (legacy)
            const redirectTo =
                (typeof router.query.redirect === 'string'
                    ? router.query.redirect
                    : null) ??
                (typeof router.query.redirectTo === 'string'
                    ? router.query.redirectTo
                    : null) ??
                '';
            void router.push(redirectTo || fallback);
        } catch (err: unknown) {
            setStatus(
                err instanceof Error ? err.message : 'Logowanie nieudane',
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
        <>
            <Head>
                <title>Logowanie — Salon Black &amp; White</title>
            </Head>
            <AuthPageShell
                title="Zaloguj się"
                footerPrompt="Nie masz konta?"
                footerHref="/auth/register"
                footerLabel="Zarejestruj się"
            >
                <form
                    onSubmit={(e) => {
                        void handleSubmit(e);
                    }}
                    noValidate
                >
                    <AuthField
                        id="email"
                        label="Email"
                        error={touched.email ? errors.email : undefined}
                    >
                        <AuthTextInput
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            placeholder="twoj@email.pl"
                            value={form.email}
                            invalid={Boolean(touched.email && errors.email)}
                            onChange={(e) => {
                                const value = e.target.value;
                                setForm((prev) => ({ ...prev, email: value }));
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
                    </AuthField>

                    <AuthField
                        id="password"
                        label="Hasło"
                        spacious
                        error={touched.password ? errors.password : undefined}
                    >
                        <div className="auth-password">
                            <AuthTextInput
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                required
                                placeholder={
                                    showPassword ? 'Twoje hasło' : '••••••••'
                                }
                                value={form.password}
                                invalid={Boolean(
                                    touched.password && errors.password,
                                )}
                                onChange={(e) => {
                                    const value = e.target.value;
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
                            <button
                                type="button"
                                aria-label={
                                    showPassword
                                        ? 'Ukryj wpisane znaki'
                                        : 'Pokaż wpisane znaki'
                                }
                                aria-controls="password"
                                aria-pressed={showPassword}
                                className="auth-password__toggle"
                                onClick={() => setShowPassword((prev) => !prev)}
                            >
                                {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                            </button>
                        </div>
                    </AuthField>

                    <AuthSubmitButton disabled={submitting}>
                        {submitting ? 'Logowanie…' : 'Zaloguj się'}
                    </AuthSubmitButton>

                    <AuthStatus>{status}</AuthStatus>
                </form>

                <GoogleAuthButton label="Zaloguj się przez Google" />
            </AuthPageShell>
        </>
    );
}

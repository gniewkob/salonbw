import { FormEvent, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { getPostLoginRoute } from '@/utils/postLoginRoute';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';
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

const grain = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`;

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
    const [focusedField, setFocusedField] = useState<string | null>(null);
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
        setFocusedField(null);
        setTouched((prev) => ({ ...prev, [field]: true }));
        runValidation();
    };

    const inputStyle = (field: 'email' | 'password'): React.CSSProperties => ({
        display: 'block',
        width: '100%',
        padding: '0.85rem 1rem',
        background: 'rgba(255,255,255,0.05)',
        border: `1px solid ${focusedField === field ? '#b4b8be' : touched[field] && errors[field] ? 'rgba(220,60,60,0.7)' : 'rgba(255,255,255,0.12)'}`,
        borderRadius: '2px',
        color: '#ffffff',
        fontSize: '0.875rem',
        fontFamily: "'Open Sans', sans-serif",
        outline: 'none',
        transition: 'border-color 0.2s',
        boxSizing: 'border-box',
    });

    return (
        <>
            <Head>
                <title>Logowanie — Salon Black &amp; White</title>
            </Head>
            <div
                style={{
                    minHeight: '100vh',
                    background: '#080808',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    padding: '2rem 1.5rem',
                }}
            >
                {/* Grain overlay */}
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundImage: grain,
                        backgroundSize: '180px',
                        opacity: 0.04,
                        pointerEvents: 'none',
                        zIndex: 0,
                    }}
                />

                {/* B&W watermark */}
                <span
                    style={{
                        position: 'fixed',
                        bottom: '-0.1em',
                        left: '-0.05em',
                        fontFamily: "'Playfair Display', serif",
                        fontSize: 'clamp(6rem,20vw,14rem)',
                        fontWeight: 700,
                        color: 'rgba(255,255,255,0.04)',
                        lineHeight: 1,
                        pointerEvents: 'none',
                        userSelect: 'none',
                        zIndex: 0,
                    }}
                >
                    B&amp;W
                </span>

                <main
                    style={{
                        position: 'relative',
                        zIndex: 1,
                        width: '100%',
                        maxWidth: '400px',
                    }}
                >
                    {/* Brand */}
                    <div
                        style={{ textAlign: 'center', marginBottom: '2.5rem' }}
                    >
                        <p
                            style={{
                                fontFamily: "'Open Sans', sans-serif",
                                fontSize: '0.6rem',
                                letterSpacing: '0.2em',
                                textTransform: 'uppercase',
                                color: '#b4b8be',
                                marginBottom: '0.75rem',
                            }}
                        >
                            Akademia Zdrowych Włosów
                        </p>
                        <h1
                            style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: '2rem',
                                fontWeight: 700,
                                color: '#ffffff',
                                margin: 0,
                                lineHeight: 1.15,
                            }}
                        >
                            Zaloguj się
                        </h1>
                        <div
                            style={{
                                width: '32px',
                                height: '2px',
                                background: '#b4b8be',
                                margin: '1rem auto 0',
                            }}
                        />
                    </div>

                    {/* Form */}
                    <form
                        onSubmit={(e) => {
                            void handleSubmit(e);
                        }}
                        noValidate
                    >
                        <div style={{ marginBottom: '1rem' }}>
                            <label
                                htmlFor="email"
                                style={{
                                    display: 'block',
                                    fontSize: '0.7rem',
                                    letterSpacing: '0.1em',
                                    textTransform: 'uppercase',
                                    color: 'rgba(255,255,255,0.45)',
                                    marginBottom: '0.5rem',
                                    fontFamily: "'Open Sans', sans-serif",
                                }}
                            >
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                style={inputStyle('email')}
                                placeholder="twoj@email.pl"
                                value={form.email}
                                onChange={(e) => {
                                    const value = e.target.value;
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
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => handleBlur('email')}
                            />
                            {touched.email && errors.email && (
                                <p
                                    role="alert"
                                    style={{
                                        fontSize: '0.75rem',
                                        color: 'rgba(220,80,80,0.9)',
                                        marginTop: '0.35rem',
                                        fontFamily: "'Open Sans', sans-serif",
                                    }}
                                >
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div style={{ marginBottom: '1.75rem' }}>
                            <label
                                htmlFor="password"
                                style={{
                                    display: 'block',
                                    fontSize: '0.7rem',
                                    letterSpacing: '0.1em',
                                    textTransform: 'uppercase',
                                    color: 'rgba(255,255,255,0.45)',
                                    marginBottom: '0.5rem',
                                    fontFamily: "'Open Sans', sans-serif",
                                }}
                            >
                                Hasło
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    style={{
                                        ...inputStyle('password'),
                                        paddingRight: '3rem',
                                    }}
                                    placeholder={
                                        showPassword
                                            ? 'Twoje hasło'
                                            : '••••••••'
                                    }
                                    value={form.password}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setForm((prev) => ({
                                            ...prev,
                                            password: value,
                                        }));
                                        if (touched.password) {
                                            const fieldErrors =
                                                validateLoginForm({
                                                    email: form.email,
                                                    password: value,
                                                });
                                            setErrors((prev) => ({
                                                ...prev,
                                                password: fieldErrors.password,
                                            }));
                                        }
                                    }}
                                    onFocus={() => setFocusedField('password')}
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
                                    onClick={() =>
                                        setShowPassword((prev) => !prev)
                                    }
                                    style={{
                                        position: 'absolute',
                                        right: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: 44,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        background: 'transparent',
                                        border: 'none',
                                        color: 'rgba(255, 255, 255, 0.55)',
                                        cursor: 'pointer',
                                        padding: 0,
                                    }}
                                >
                                    {showPassword ? (
                                        <EyeSlashIcon
                                            style={{ width: 18, height: 18 }}
                                        />
                                    ) : (
                                        <EyeIcon
                                            style={{ width: 18, height: 18 }}
                                        />
                                    )}
                                </button>
                            </div>
                            {touched.password && errors.password && (
                                <p
                                    role="alert"
                                    style={{
                                        fontSize: '0.75rem',
                                        color: 'rgba(220,80,80,0.9)',
                                        marginTop: '0.35rem',
                                        fontFamily: "'Open Sans', sans-serif",
                                    }}
                                >
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                display: 'block',
                                width: '100%',
                                padding: '0.9rem 1.5rem',
                                background: submitting ? '#8e9298' : '#b4b8be',
                                color: '#0d0d0d',
                                border: 'none',
                                borderRadius: '2px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                letterSpacing: '0.18em',
                                textTransform: 'uppercase',
                                fontFamily: "'Open Sans', sans-serif",
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                transition: 'background 0.2s',
                            }}
                        >
                            {submitting ? 'Logowanie…' : 'Zaloguj się'}
                        </button>

                        {status && (
                            <p
                                role="alert"
                                style={{
                                    textAlign: 'center',
                                    marginTop: '1rem',
                                    fontSize: '0.8rem',
                                    color: 'rgba(220,80,80,0.9)',
                                    fontFamily: "'Open Sans', sans-serif",
                                }}
                            >
                                {status}
                            </p>
                        )}
                    </form>

                    <GoogleAuthButton label="Zaloguj się przez Google" />

                    <p
                        style={{
                            textAlign: 'center',
                            marginTop: '2rem',
                            fontSize: '0.8rem',
                            color: 'rgba(255,255,255,0.35)',
                            fontFamily: "'Open Sans', sans-serif",
                        }}
                    >
                        Nie masz konta?{' '}
                        <Link
                            href="/auth/register"
                            prefetch={false}
                            style={{
                                color: '#b4b8be',
                                textDecoration: 'none',
                                fontWeight: 600,
                            }}
                        >
                            Zarejestruj się
                        </Link>
                    </p>

                    <p
                        style={{
                            textAlign: 'center',
                            marginTop: '2.5rem',
                            fontSize: '0.6rem',
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            color: 'rgba(255,255,255,0.15)',
                            fontFamily: "'Open Sans', sans-serif",
                        }}
                    >
                        Salon Black &amp; White · Bytom
                    </p>
                </main>
            </div>
        </>
    );
}

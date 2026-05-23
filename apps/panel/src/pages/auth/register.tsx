import { FormEvent, useState } from 'react';
import Head from 'next/head';
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
    gdprConsent: boolean;
    smsConsent: boolean;
    emailConsent: boolean;
};
type RegisterErrors = Partial<Record<keyof RegisterFormValues, string>>;

const validateRegisterForm = (values: RegisterFormValues): RegisterErrors => {
    const errors: RegisterErrors = {};
    if (!values.name.trim()) errors.name = 'Imię i nazwisko jest wymagane';
    const trimmedEmail = values.email.trim();
    if (!trimmedEmail) {
        errors.email = 'Adres e-mail jest wymagany';
    } else if (!emailPattern.test(trimmedEmail)) {
        errors.email = 'Nieprawidłowy adres e-mail';
    }
    if (!values.password) {
        errors.password = 'Hasło jest wymagane';
    } else if (values.password.length < 6) {
        errors.password = 'Hasło musi mieć co najmniej 6 znaków';
    }
    if (!values.gdprConsent) {
        errors.gdprConsent =
            'Zgoda na przetwarzanie danych osobowych jest wymagana';
    }
    return errors;
};

const grain = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`;

export default function RegisterPage() {
    const { register, apiFetch } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState<RegisterFormValues>({
        name: '',
        email: '',
        phone: '',
        password: '',
        gdprConsent: false,
        smsConsent: false,
        emailConsent: false,
    });
    const [touched, setTouched] = useState<
        Partial<Record<keyof RegisterFormValues, boolean>>
    >({});
    const [errors, setErrors] = useState<RegisterErrors>({});
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const runValidation = (currentForm: RegisterFormValues) => {
        const nextErrors = validateRegisterForm(currentForm);
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleChange = (field: keyof RegisterFormValues, value: string) => {
        const nextForm = { ...form, [field]: value };
        setForm(nextForm);
        if (touched[field]) runValidation(nextForm);
    };

    const handleCheckbox = (
        field: 'gdprConsent' | 'smsConsent' | 'emailConsent',
        checked: boolean,
    ) => {
        const nextForm = { ...form, [field]: checked };
        setForm(nextForm);
        if (touched[field]) runValidation(nextForm);
    };

    const handleBlur = (field: keyof RegisterFormValues) => {
        setFocusedField(null);
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
                gdprConsent: true,
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
                err instanceof Error ? err.message : 'Rejestracja nieudana',
            );
        } finally {
            setSubmitting(false);
        }
    };

    const inputStyle = (
        field: keyof RegisterFormValues,
    ): React.CSSProperties => ({
        display: 'block',
        width: '100%',
        padding: '0.85rem 1rem',
        background: 'rgba(255,255,255,0.05)',
        border: `1px solid ${focusedField === field ? '#c5a880' : touched[field] && errors[field] ? 'rgba(220,60,60,0.7)' : 'rgba(255,255,255,0.12)'}`,
        borderRadius: '2px',
        color: '#ffffff',
        fontSize: '0.875rem',
        fontFamily: "'Open Sans', sans-serif",
        outline: 'none',
        transition: 'border-color 0.2s',
        boxSizing: 'border-box',
    });

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: '0.7rem',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.45)',
        marginBottom: '0.5rem',
        fontFamily: "'Open Sans', sans-serif",
    };

    const errorStyle: React.CSSProperties = {
        fontSize: '0.75rem',
        color: 'rgba(220,80,80,0.9)',
        marginTop: '0.35rem',
        fontFamily: "'Open Sans', sans-serif",
    };

    return (
        <>
            <Head>
                <title>Rejestracja — Salon Black &amp; White</title>
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

                <div
                    style={{
                        position: 'relative',
                        zIndex: 1,
                        width: '100%',
                        maxWidth: '400px',
                    }}
                >
                    {/* Brand */}
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <p
                            style={{
                                fontFamily: "'Open Sans', sans-serif",
                                fontSize: '0.6rem',
                                letterSpacing: '0.2em',
                                textTransform: 'uppercase',
                                color: '#c5a880',
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
                            Zarejestruj się
                        </h1>
                        <div
                            style={{
                                width: '32px',
                                height: '2px',
                                background: '#c5a880',
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
                            <label htmlFor="name" style={labelStyle}>
                                Imię i nazwisko
                            </label>
                            <input
                                id="name"
                                style={inputStyle('name')}
                                placeholder="Jan Kowalski"
                                autoComplete="name"
                                value={form.name}
                                onChange={(e) =>
                                    handleChange('name', e.target.value)
                                }
                                onFocus={() => setFocusedField('name')}
                                onBlur={() => handleBlur('name')}
                            />
                            {touched.name && errors.name && (
                                <p role="alert" style={errorStyle}>
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label htmlFor="email" style={labelStyle}>
                                Adres e-mail
                            </label>
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                style={inputStyle('email')}
                                placeholder="twoj@email.pl"
                                value={form.email}
                                onChange={(e) =>
                                    handleChange('email', e.target.value)
                                }
                                onFocus={() => setFocusedField('email')}
                                onBlur={() => handleBlur('email')}
                            />
                            {touched.email && errors.email && (
                                <p role="alert" style={errorStyle}>
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label htmlFor="phone" style={labelStyle}>
                                Telefon{' '}
                                <span
                                    style={{ color: 'rgba(255,255,255,0.25)' }}
                                >
                                    (opcjonalnie)
                                </span>
                            </label>
                            <input
                                id="phone"
                                type="tel"
                                autoComplete="tel"
                                style={inputStyle('phone')}
                                placeholder="+48 000 000 000"
                                value={form.phone}
                                onChange={(e) =>
                                    handleChange('phone', e.target.value)
                                }
                                onFocus={() => setFocusedField('phone')}
                                onBlur={() => setFocusedField(null)}
                            />
                        </div>

                        <div style={{ marginBottom: '1.75rem' }}>
                            <label htmlFor="password" style={labelStyle}>
                                Hasło
                            </label>
                            <input
                                id="password"
                                type="password"
                                autoComplete="new-password"
                                style={inputStyle('password')}
                                placeholder="Min. 6 znaków"
                                value={form.password}
                                onChange={(e) =>
                                    handleChange('password', e.target.value)
                                }
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => handleBlur('password')}
                            />
                            {touched.password && errors.password && (
                                <p role="alert" style={errorStyle}>
                                    {errors.password}
                                </p>
                            )}
                        </div>

                        {/* Consent checkboxes */}
                        <div
                            style={{
                                marginBottom: '1.5rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.75rem',
                            }}
                        >
                            <label
                                style={{
                                    display: 'flex',
                                    gap: '0.65rem',
                                    cursor: 'pointer',
                                    alignItems: 'flex-start',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    id="gdprConsent"
                                    checked={form.gdprConsent}
                                    onChange={(e) =>
                                        handleCheckbox(
                                            'gdprConsent',
                                            e.target.checked,
                                        )
                                    }
                                    onBlur={() =>
                                        setTouched((prev) => ({
                                            ...prev,
                                            gdprConsent: true,
                                        }))
                                    }
                                    style={{ marginTop: '2px', flexShrink: 0 }}
                                />
                                <span
                                    style={{
                                        fontSize: '0.75rem',
                                        color: 'rgba(255,255,255,0.65)',
                                        fontFamily: "'Open Sans', sans-serif",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    <span
                                        style={{ color: 'rgba(220,80,80,0.9)' }}
                                    >
                                        *{' '}
                                    </span>
                                    Wyrażam zgodę na przetwarzanie moich danych
                                    osobowych przez Salon Black &amp; White w
                                    celu realizacji usług oraz obsługi konta
                                    zgodnie z{' '}
                                    <a
                                        href="/privacy"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            color: '#c5a880',
                                            textDecoration: 'underline',
                                        }}
                                    >
                                        Polityką prywatności
                                    </a>
                                    .
                                </span>
                            </label>
                            {touched.gdprConsent && errors.gdprConsent && (
                                <p role="alert" style={errorStyle}>
                                    {errors.gdprConsent}
                                </p>
                            )}

                            <label
                                style={{
                                    display: 'flex',
                                    gap: '0.65rem',
                                    cursor: 'pointer',
                                    alignItems: 'flex-start',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    id="smsConsent"
                                    checked={form.smsConsent}
                                    onChange={(e) =>
                                        handleCheckbox(
                                            'smsConsent',
                                            e.target.checked,
                                        )
                                    }
                                    style={{ marginTop: '2px', flexShrink: 0 }}
                                />
                                <span
                                    style={{
                                        fontSize: '0.75rem',
                                        color: 'rgba(255,255,255,0.45)',
                                        fontFamily: "'Open Sans', sans-serif",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    Wyrażam zgodę na otrzymywanie informacji
                                    marketingowych drogą SMS / WhatsApp.{' '}
                                    <span
                                        style={{
                                            color: 'rgba(255,255,255,0.25)',
                                        }}
                                    >
                                        (opcjonalne)
                                    </span>
                                </span>
                            </label>

                            <label
                                style={{
                                    display: 'flex',
                                    gap: '0.65rem',
                                    cursor: 'pointer',
                                    alignItems: 'flex-start',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    id="emailConsent"
                                    checked={form.emailConsent}
                                    onChange={(e) =>
                                        handleCheckbox(
                                            'emailConsent',
                                            e.target.checked,
                                        )
                                    }
                                    style={{ marginTop: '2px', flexShrink: 0 }}
                                />
                                <span
                                    style={{
                                        fontSize: '0.75rem',
                                        color: 'rgba(255,255,255,0.45)',
                                        fontFamily: "'Open Sans', sans-serif",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    Wyrażam zgodę na otrzymywanie informacji
                                    marketingowych drogą e-mail.{' '}
                                    <span
                                        style={{
                                            color: 'rgba(255,255,255,0.25)',
                                        }}
                                    >
                                        (opcjonalne)
                                    </span>
                                </span>
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                display: 'block',
                                width: '100%',
                                padding: '0.9rem 1.5rem',
                                background: submitting ? '#a8895f' : '#c5a880',
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
                            {submitting ? 'Rejestracja…' : 'Zarejestruj się'}
                        </button>

                        {error && (
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
                                {error}
                            </p>
                        )}
                    </form>

                    <p
                        style={{
                            textAlign: 'center',
                            marginTop: '2rem',
                            fontSize: '0.8rem',
                            color: 'rgba(255,255,255,0.35)',
                            fontFamily: "'Open Sans', sans-serif",
                        }}
                    >
                        Masz już konto?{' '}
                        <Link
                            href="/auth/login"
                            style={{
                                color: '#c5a880',
                                textDecoration: 'none',
                                fontWeight: 600,
                            }}
                        >
                            Zaloguj się
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
                </div>
            </div>
        </>
    );
}

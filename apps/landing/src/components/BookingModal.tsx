'use client';
import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPanelUrl } from '@/utils/panelUrl';
import { BUSINESS_INFO } from '@/config/content';
import { useLanguage } from '@/contexts/LanguageContext';

export interface BookingService {
    id: number;
    name: string;
    priceLabel: string;
    duration: string;
}

interface BookingModalProps {
    open: boolean;
    onClose: () => void;
    service?: BookingService;
}

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function BookingModal({
    open,
    onClose,
    service,
}: BookingModalProps) {
    const { login, isAuthenticated } = useAuth();
    const { T } = useLanguage();
    const m = T.modal;
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [touched, setTouched] = useState({ email: false, password: false });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    const previousActiveRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!open) {
            setError('');
            setTouched({ email: false, password: false });
            setFocusedField(null);
        }
    }, [open]);

    // Focus management: remember opener, focus first field, restore on close
    useEffect(() => {
        if (!open) return;
        previousActiveRef.current =
            document.activeElement as HTMLElement | null;
        const firstFocusable = dialogRef.current?.querySelector<HTMLElement>(
            'input, button, [href], select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        firstFocusable?.focus();
        return () => {
            previousActiveRef.current?.focus?.();
        };
    }, [open]);

    // ESC closes; Tab is trapped inside the dialog
    useEffect(() => {
        if (!open) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
                return;
            }
            if (e.key !== 'Tab' || !dialogRef.current) return;
            const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
                'input:not([disabled]), button:not([disabled]), [href], select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
            );
            if (focusables.length === 0) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            const active = document.activeElement;
            if (e.shiftKey && active === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && active === last) {
                e.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    const redirectPath = service
        ? `/booking?serviceId=${service.id}`
        : '/booking';

    const handleRedirectToPanel = () => {
        window.location.href = getPanelUrl(redirectPath);
    };

    const emailError =
        touched.email && !emailRe.test(email.trim())
            ? email.trim()
                ? m.errorInvalidEmail
                : m.errorEmailRequired
            : '';
    const passwordError =
        touched.password && !password.trim() ? m.errorPasswordRequired : '';

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setTouched({ email: true, password: true });
        if (
            emailError ||
            passwordError ||
            !emailRe.test(email.trim()) ||
            !password.trim()
        )
            return;
        setError('');
        setSubmitting(true);
        try {
            await login(email.trim(), password);
            handleRedirectToPanel();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : m.errorLoginFailed);
            setPassword('');
        } finally {
            setSubmitting(false);
        }
    };

    const inputStyle = (field: string): React.CSSProperties => ({
        display: 'block',
        width: '100%',
        padding: '0.8rem 1rem',
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${
            focusedField === field
                ? '#b4b8be'
                : (field === 'email' && emailError) ||
                    (field === 'password' && passwordError)
                  ? 'rgba(220,60,60,0.6)'
                  : 'rgba(255,255,255,0.12)'
        }`,
        borderRadius: '2px',
        color: '#fff',
        fontSize: '0.875rem',
        fontFamily: "var(--font-opensans, 'Open Sans', sans-serif)",
        outline: 'none',
        transition: 'border-color 0.2s',
        boxSizing: 'border-box',
    });

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
                background: 'rgba(0,0,0,0.75)',
                backdropFilter: 'blur(4px)',
            }}
            onClick={onClose}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-label={m.bookingTitle}
                className="w-full max-w-sm"
                style={{
                    background: '#0d0d0d',
                    border: '1px solid rgba(180,184,190,0.2)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Gold top bar */}
                <div
                    style={{
                        height: '3px',
                        background:
                            'linear-gradient(90deg, #b4b8be, #dce0e4, #b4b8be)',
                    }}
                />

                <div style={{ padding: '2rem 2rem 1.75rem' }}>
                    {/* Header */}
                    <div style={{ marginBottom: '1.75rem' }}>
                        <p
                            style={{
                                fontFamily:
                                    "var(--font-opensans, 'Open Sans', sans-serif)",
                                fontSize: '0.6rem',
                                letterSpacing: '0.2em',
                                textTransform: 'uppercase',
                                color: '#b4b8be',
                                marginBottom: '0.5rem',
                            }}
                        >
                            {service ? m.bookingServiceLabel : T.nav.booking}
                        </p>
                        <h2
                            style={{
                                fontFamily:
                                    "var(--font-playfair, 'Playfair Display', serif)",
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: '#fff',
                                margin: 0,
                                lineHeight: 1.2,
                            }}
                        >
                            {service
                                ? service.name
                                : isAuthenticated
                                  ? m.bookingTitle
                                  : m.loginTitle}
                        </h2>
                        {service ? (
                            <p
                                style={{
                                    marginTop: '0.35rem',
                                    fontSize: '0.8rem',
                                    color: 'rgba(255,255,255,0.65)',
                                    fontFamily:
                                        "var(--font-opensans, 'Open Sans', sans-serif)",
                                }}
                            >
                                {service.priceLabel} · {service.duration}
                            </p>
                        ) : (
                            <p
                                style={{
                                    marginTop: '0.35rem',
                                    fontSize: '0.8rem',
                                    color: 'rgba(255,255,255,0.65)',
                                    fontFamily:
                                        "var(--font-opensans, 'Open Sans', sans-serif)",
                                }}
                            >
                                {isAuthenticated
                                    ? BUSINESS_INFO.address.city +
                                      ' · ' +
                                      m.since
                                    : m.loginSub}
                            </p>
                        )}
                        <div
                            style={{
                                width: '28px',
                                height: '1px',
                                background: '#b4b8be',
                                marginTop: '1rem',
                                opacity: 0.6,
                            }}
                        />
                    </div>

                    {/* If already logged in, show Go button */}
                    {isAuthenticated ? (
                        <div>
                            <p
                                style={{
                                    fontSize: '0.8rem',
                                    color: 'rgba(255,255,255,0.55)',
                                    marginBottom: '1.25rem',
                                    fontFamily:
                                        "var(--font-opensans, 'Open Sans', sans-serif)",
                                }}
                            >
                                {m.alreadyLoggedIn}
                            </p>
                            <button
                                type="button"
                                onClick={handleRedirectToPanel}
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: '0.85rem 1.5rem',
                                    background: '#b4b8be',
                                    color: '#0d0d0d',
                                    border: 'none',
                                    borderRadius: '2px',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    letterSpacing: '0.18em',
                                    textTransform: 'uppercase',
                                    fontFamily:
                                        "var(--font-opensans, 'Open Sans', sans-serif)",
                                    cursor: 'pointer',
                                }}
                            >
                                {m.goToBooking}
                            </button>
                        </div>
                    ) : (
                        /* Login form */
                        <form
                            onSubmit={(e) => {
                                void handleSubmit(e);
                            }}
                            noValidate
                        >
                            {/* Email */}
                            <div style={{ marginBottom: '1rem' }}>
                                <label
                                    htmlFor="bm-email"
                                    style={{
                                        display: 'block',
                                        fontSize: '0.65rem',
                                        letterSpacing: '0.12em',
                                        textTransform: 'uppercase',
                                        color: 'rgba(255,255,255,0.65)',
                                        marginBottom: '0.4rem',
                                        fontFamily:
                                            "var(--font-opensans, 'Open Sans', sans-serif)",
                                    }}
                                >
                                    {m.emailLabel}
                                </label>
                                <input
                                    id="bm-email"
                                    type="email"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        if (touched.email)
                                            setTouched((t) => ({
                                                ...t,
                                                email: true,
                                            }));
                                    }}
                                    onFocus={() => setFocusedField('email')}
                                    onBlur={() => {
                                        setFocusedField(null);
                                        setTouched((t) => ({
                                            ...t,
                                            email: true,
                                        }));
                                    }}
                                    style={inputStyle('email')}
                                    placeholder={m.emailPlaceholder}
                                />
                                {emailError && (
                                    <p
                                        role="alert"
                                        style={{
                                            fontSize: '0.72rem',
                                            color: 'rgba(220,80,80,0.9)',
                                            marginTop: '0.3rem',
                                            fontFamily:
                                                "var(--font-opensans, 'Open Sans', sans-serif)",
                                        }}
                                    >
                                        {emailError}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <label
                                    htmlFor="bm-password"
                                    style={{
                                        display: 'block',
                                        fontSize: '0.65rem',
                                        letterSpacing: '0.12em',
                                        textTransform: 'uppercase',
                                        color: 'rgba(255,255,255,0.65)',
                                        marginBottom: '0.4rem',
                                        fontFamily:
                                            "var(--font-opensans, 'Open Sans', sans-serif)",
                                    }}
                                >
                                    {m.passwordLabel}
                                </label>
                                <input
                                    id="bm-password"
                                    type="password"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (touched.password)
                                            setTouched((t) => ({
                                                ...t,
                                                password: true,
                                            }));
                                    }}
                                    onFocus={() => setFocusedField('password')}
                                    onBlur={() => {
                                        setFocusedField(null);
                                        setTouched((t) => ({
                                            ...t,
                                            password: true,
                                        }));
                                    }}
                                    style={inputStyle('password')}
                                    placeholder={m.passwordPlaceholder}
                                />
                                {passwordError && (
                                    <p
                                        role="alert"
                                        style={{
                                            fontSize: '0.72rem',
                                            color: 'rgba(220,80,80,0.9)',
                                            marginTop: '0.3rem',
                                            fontFamily:
                                                "var(--font-opensans, 'Open Sans', sans-serif)",
                                        }}
                                    >
                                        {passwordError}
                                    </p>
                                )}
                            </div>

                            {error && (
                                <p
                                    role="alert"
                                    style={{
                                        fontSize: '0.78rem',
                                        color: 'rgba(220,80,80,0.9)',
                                        marginBottom: '1rem',
                                        textAlign: 'center',
                                        fontFamily:
                                            "var(--font-opensans, 'Open Sans', sans-serif)",
                                    }}
                                >
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: '0.85rem 1.5rem',
                                    background: submitting
                                        ? '#8e9298'
                                        : '#b4b8be',
                                    color: '#0d0d0d',
                                    border: 'none',
                                    borderRadius: '2px',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    letterSpacing: '0.18em',
                                    textTransform: 'uppercase',
                                    fontFamily:
                                        "var(--font-opensans, 'Open Sans', sans-serif)",
                                    cursor: submitting
                                        ? 'not-allowed'
                                        : 'pointer',
                                    transition: 'background 0.2s',
                                    marginBottom: '0.75rem',
                                }}
                            >
                                {submitting ? m.submitting : m.submitLogin}
                            </button>

                            <p
                                style={{
                                    textAlign: 'center',
                                    fontSize: '0.72rem',
                                    color: 'rgba(255,255,255,0.6)',
                                    fontFamily:
                                        "var(--font-opensans, 'Open Sans', sans-serif)",
                                }}
                            >
                                {m.noAccount}{' '}
                                <a
                                    href={getPanelUrl('/auth/register')}
                                    style={{
                                        color: '#b4b8be',
                                        textDecoration: 'none',
                                    }}
                                >
                                    {m.register}
                                </a>
                            </p>
                        </form>
                    )}

                    {/* Cancel */}
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            display: 'block',
                            width: '100%',
                            marginTop: '1rem',
                            padding: '0.5rem',
                            background: 'none',
                            border: 'none',
                            fontSize: '0.65rem',
                            letterSpacing: '0.12em',
                            textTransform: 'uppercase',
                            color: 'rgba(255,255,255,0.55)',
                            fontFamily:
                                "var(--font-opensans, 'Open Sans', sans-serif)",
                            cursor: 'pointer',
                        }}
                    >
                        {m.close}
                    </button>
                </div>
            </div>
        </div>
    );
}

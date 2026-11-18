'use client';
import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPanelUrl } from '@/utils/panelUrl';
import { BUSINESS_INFO } from '@/config/content';
import { useLanguage } from '@/contexts/LanguageContext';
import { XMarkIcon } from '@heroicons/react/24/outline';
import styles from './BookingModal.module.css';

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
    const dialogRef = useRef<HTMLDivElement>(null);
    const previousActiveRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!open) {
            setError('');
            setTouched({ email: false, password: false });
        }
    }, [open]);

    // Focus management: remember opener, focus first field, restore on close
    useEffect(() => {
        if (!open) return;
        previousActiveRef.current =
            document.activeElement as HTMLElement | null;
        // Start in the first field (the close button comes first in DOM order).
        const firstFocusable =
            dialogRef.current?.querySelector<HTMLElement>('input') ??
            dialogRef.current?.querySelector<HTMLElement>(
                'button, [href], select, textarea, [tabindex]:not([tabindex="-1"])',
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

    const titleId = 'booking-modal-title';
    const title = service
        ? service.name
        : isAuthenticated
          ? m.bookingTitle
          : m.loginTitle;

    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className={styles.sheet}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    className={styles.close}
                    onClick={onClose}
                    aria-label={m.close}
                >
                    <XMarkIcon aria-hidden="true" />
                </button>

                <header className={styles.head}>
                    <p className={styles.eyebrow}>
                        {service ? m.bookingServiceLabel : T.nav.booking}
                    </p>
                    <h2 id={titleId} className={styles.title}>
                        {title}
                    </h2>
                    {service ? (
                        <ul className={styles.meta}>
                            <li>
                                <span className={styles.metaLabel}>
                                    {m.priceLabel}
                                </span>
                                <span className={styles.metaValue}>
                                    {service.priceLabel}
                                </span>
                            </li>
                            <li>
                                <span className={styles.metaLabel}>
                                    {m.durationLabel}
                                </span>
                                <span className={styles.metaValue}>
                                    {service.duration}
                                </span>
                            </li>
                        </ul>
                    ) : (
                        <p className={styles.sub}>
                            {isAuthenticated
                                ? `${BUSINESS_INFO.address.city} · ${m.since}`
                                : m.loginSub}
                        </p>
                    )}
                </header>

                <div className={styles.body}>
                    {isAuthenticated ? (
                        <>
                            <p className={styles.note}>{m.alreadyLoggedIn}</p>
                            <button
                                type="button"
                                onClick={handleRedirectToPanel}
                                className={`bw-btn bw-btn--dark ${styles.submit}`}
                            >
                                {m.goToBooking}
                            </button>
                        </>
                    ) : (
                        <form
                            onSubmit={(e) => {
                                void handleSubmit(e);
                            }}
                            noValidate
                        >
                            {service && (
                                <p className={styles.note}>{m.loginSub}</p>
                            )}
                            <div className={styles.field}>
                                <label
                                    htmlFor="bm-email"
                                    className={styles.label}
                                >
                                    {m.emailLabel}
                                </label>
                                <input
                                    id="bm-email"
                                    type="email"
                                    autoComplete="email"
                                    inputMode="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    onBlur={() =>
                                        setTouched((t) => ({
                                            ...t,
                                            email: true,
                                        }))
                                    }
                                    className={styles.input}
                                    placeholder={m.emailPlaceholder}
                                    aria-invalid={emailError ? true : undefined}
                                    aria-describedby="bm-email-hint"
                                />
                                <p
                                    id="bm-email-hint"
                                    className={styles.hint}
                                    role="alert"
                                >
                                    {emailError}
                                </p>
                            </div>

                            <div className={styles.field}>
                                <label
                                    htmlFor="bm-password"
                                    className={styles.label}
                                >
                                    {m.passwordLabel}
                                </label>
                                <input
                                    id="bm-password"
                                    type="password"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    onBlur={() =>
                                        setTouched((t) => ({
                                            ...t,
                                            password: true,
                                        }))
                                    }
                                    className={styles.input}
                                    aria-invalid={
                                        passwordError ? true : undefined
                                    }
                                    aria-describedby="bm-password-hint"
                                />
                                <p
                                    id="bm-password-hint"
                                    className={styles.hint}
                                    role="alert"
                                >
                                    {passwordError}
                                </p>
                            </div>

                            {error && (
                                <p className={styles.formError} role="alert">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                aria-busy={submitting || undefined}
                                className={`bw-btn bw-btn--dark ${styles.submit}`}
                            >
                                {submitting ? m.submitting : m.submitLogin}
                            </button>

                            <p className={styles.register}>
                                {m.noAccount}{' '}
                                <a
                                    href={getPanelUrl(
                                        `/auth/register?redirectTo=${encodeURIComponent(redirectPath)}`,
                                    )}
                                >
                                    {m.register}
                                </a>
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

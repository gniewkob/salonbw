import { FormEvent, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { getBookingRedirect, getPostLoginRoute } from '@/utils/postLoginRoute';
import { landingUrl } from '@/utils/landingUrl';
import GoogleAuthButton from '@/components/auth/GoogleAuthButton';
import {
    AuthConsentLabel,
    AuthField,
    AuthPageShell,
    AuthStatus,
    AuthSubmitButton,
    AuthTextInput,
} from '@/components/auth/AuthPageShell';
import type { User } from '@/types';
import { registrationMarketingChannels } from '@/utils/registrationMarketing';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RegisterFormValues = {
    name: string;
    email: string;
    phone: string;
    password: string;
    termsConsent: boolean;
    marketingConsent: boolean;
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
    if (!values.termsConsent) {
        errors.termsConsent = 'Akceptacja regulaminu jest wymagana';
    }
    return errors;
};

export default function RegisterPage() {
    const { register, apiFetch } = useAuth();
    const router = useRouter();
    const bookingRedirect = getBookingRedirect(router.query?.redirectTo);
    const [form, setForm] = useState<RegisterFormValues>({
        name: '',
        email: '',
        phone: '',
        password: '',
        termsConsent: false,
        marketingConsent: false,
    });
    const [touched, setTouched] = useState<
        Partial<Record<keyof RegisterFormValues, boolean>>
    >({});
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    // Derived validation prevents stale errors after editing the form.
    const errors: RegisterErrors = validateRegisterForm(form);

    const handleChange = (field: keyof RegisterFormValues, value: string) => {
        setForm({ ...form, [field]: value });
    };

    const handleCheckbox = (
        field:
            | 'termsConsent'
            | 'marketingConsent',
        checked: boolean,
    ) => {
        setForm({ ...form, [field]: checked });
    };

    const handleBlur = (field: keyof RegisterFormValues) => {
        setTouched((prev) => ({ ...prev, [field]: true }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        if (Object.keys(errors).length > 0) {
            setTouched({
                name: true,
                email: true,
                phone: true,
                password: true,
                termsConsent: true,
            });
            return;
        }
        setSubmitting(true);
        try {
            await register({
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                password: form.password,
                termsConsent: form.termsConsent,
                // Backend uses this to associate each channel grant with
                // the exact versioned combined statement below.
                marketingConsent: form.marketingConsent,
                // Compatibility for older API deployments (no new consent
                // is ever inferred when the checkbox is unchecked).
                ...registrationMarketingChannels(form.marketingConsent),
            });
            const profile = await apiFetch<User>('/users/profile');
            void router.push(
                (profile?.role === 'client' && bookingRedirect) ||
                    getPostLoginRoute(profile?.role),
            );
        } catch (err: unknown) {
            setError(
                err instanceof Error ? err.message : 'Rejestracja nieudana',
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Head>
                <title>Rejestracja — Salon Black &amp; White</title>
            </Head>
            <AuthPageShell
                title="Zarejestruj się"
                footerPrompt="Masz już konto?"
                footerHref={
                    bookingRedirect
                        ? `/auth/login?redirectTo=${encodeURIComponent(bookingRedirect)}`
                        : '/auth/login'
                }
                footerLabel="Zaloguj się"
            >
                <form
                    onSubmit={(e) => {
                        void handleSubmit(e);
                    }}
                    noValidate
                >
                    <AuthField
                        id="name"
                        label="Imię i nazwisko"
                        error={touched.name ? errors.name : undefined}
                    >
                        <AuthTextInput
                            id="name"
                            placeholder="Jan Kowalski"
                            autoComplete="name"
                            value={form.name}
                            invalid={Boolean(touched.name && errors.name)}
                            onChange={(e) =>
                                handleChange('name', e.target.value)
                            }
                            onBlur={() => handleBlur('name')}
                        />
                    </AuthField>

                    <AuthField
                        id="email"
                        label="Adres e-mail"
                        error={touched.email ? errors.email : undefined}
                    >
                        <AuthTextInput
                            id="email"
                            type="email"
                            autoComplete="email"
                            placeholder="twoj@email.pl"
                            value={form.email}
                            invalid={Boolean(touched.email && errors.email)}
                            onChange={(e) =>
                                handleChange('email', e.target.value)
                            }
                            onBlur={() => handleBlur('email')}
                        />
                    </AuthField>

                    <AuthField id="phone" label="Telefon" optional>
                        <AuthTextInput
                            id="phone"
                            type="tel"
                            autoComplete="tel"
                            placeholder="+48 000 000 000"
                            value={form.phone}
                            onChange={(e) =>
                                handleChange('phone', e.target.value)
                            }
                        />
                    </AuthField>

                    <AuthField
                        id="password"
                        label="Hasło"
                        spacious
                        error={touched.password ? errors.password : undefined}
                    >
                        <AuthTextInput
                            id="password"
                            type="password"
                            autoComplete="new-password"
                            placeholder="Min. 6 znaków"
                            value={form.password}
                            invalid={Boolean(
                                touched.password && errors.password,
                            )}
                            onChange={(e) =>
                                handleChange('password', e.target.value)
                            }
                            onBlur={() => handleBlur('password')}
                        />
                    </AuthField>

                    <div className="auth-consents">
                        <p className="auth-consent__information">
                            Twoje dane wykorzystujemy do założenia konta,
                            obsługi rezerwacji i realizacji usług. Więcej
                            informacji znajdziesz w{' '}
                            <a
                                href={landingUrl('/privacy')}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                Polityce prywatności
                            </a>
                            . Nie wymagamy odrębnej zgody na czynności
                            niezbędne do realizacji usługi.
                        </p>

                        <AuthConsentLabel>
                            <input
                                type="checkbox"
                                id="termsConsent"
                                checked={form.termsConsent}
                                onChange={(e) =>
                                    handleCheckbox(
                                        'termsConsent',
                                        e.target.checked,
                                    )
                                }
                                onBlur={() =>
                                    setTouched((prev) => ({
                                        ...prev,
                                        termsConsent: true,
                                    }))
                                }
                            />
                            <span>
                                <span className="auth-consent__required">
                                    *{' '}
                                </span>
                                Akceptuję{' '}
                                <a
                                    href={landingUrl('/policy')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Regulamin
                                </a>{' '}
                                Salonu Black &amp; White.
                            </span>
                        </AuthConsentLabel>
                        {touched.termsConsent && errors.termsConsent && (
                            <p role="alert" className="auth-field__error">
                                {errors.termsConsent}
                            </p>
                        )}

                        <AuthConsentLabel muted>
                            <input
                                type="checkbox"
                                id="marketingConsent"
                                checked={form.marketingConsent}
                                onChange={(e) =>
                                    handleCheckbox(
                                        'marketingConsent',
                                        e.target.checked,
                                    )
                                }
                            />
                            <span>
                                Wyrażam zgodę na otrzymywanie od Salon Black
                                &amp; White informacji handlowych (ofert i
                                promocji) przez e-mail, SMS i WhatsApp na podane
                                dane kontaktowe. Mogę w każdej chwili wycofać
                                zgodę lub ograniczyć poszczególne kanały w
                                ustawieniach komunikacji.{' '}
                                <span className="auth-consent__optional">
                                    (opcjonalne)
                                </span>
                            </span>
                        </AuthConsentLabel>
                    </div>

                    <AuthSubmitButton disabled={submitting}>
                        {submitting ? 'Rejestracja…' : 'Zarejestruj się'}
                    </AuthSubmitButton>

                    <AuthStatus>{error}</AuthStatus>
                    {error.startsWith(
                        'Konto z tym adresem e-mail już istnieje',
                    ) && (
                        <p className="auth-page__recovery-link">
                            <Link
                                href={`/auth/forgot-password?email=${encodeURIComponent(form.email.trim())}`}
                                prefetch={false}
                                className="auth-page__link"
                            >
                                Ustaw hasło dla tego adresu
                            </Link>
                        </p>
                    )}
                </form>

                <GoogleAuthButton label="Zarejestruj się przez Google" />
            </AuthPageShell>
        </>
    );
}

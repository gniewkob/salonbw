import { FormEvent, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { getPostLoginRoute } from '@/utils/postLoginRoute';
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

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RegisterFormValues = {
    name: string;
    email: string;
    phone: string;
    password: string;
    gdprConsent: boolean;
    termsConsent: boolean;
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
    if (!values.termsConsent) {
        errors.termsConsent = 'Akceptacja regulaminu jest wymagana';
    }
    return errors;
};

export default function RegisterPage() {
    const { register, apiFetch } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState<RegisterFormValues>({
        name: '',
        email: '',
        phone: '',
        password: '',
        gdprConsent: false,
        termsConsent: false,
        smsConsent: false,
        emailConsent: false,
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
        if (touched[field]) runValidation(nextForm);
    };

    const handleCheckbox = (
        field: 'gdprConsent' | 'termsConsent' | 'smsConsent' | 'emailConsent',
        checked: boolean,
    ) => {
        const nextForm = { ...form, [field]: checked };
        setForm(nextForm);
        if (touched[field]) runValidation(nextForm);
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
                gdprConsent: true,
                termsConsent: true,
            });
            return;
        }
        setSubmitting(true);
        try {
            await register({
                ...form,
                whatsappConsent: form.smsConsent,
            });
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

    return (
        <>
            <Head>
                <title>Rejestracja — Salon Black &amp; White</title>
            </Head>
            <AuthPageShell
                title="Zarejestruj się"
                footerPrompt="Masz już konto?"
                footerHref="/auth/login"
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
                        <AuthConsentLabel>
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
                            />
                            <span>
                                <span className="auth-consent__required">
                                    *{' '}
                                </span>
                                Wyrażam zgodę na przetwarzanie moich danych
                                osobowych przez Salon Black &amp; White w celu
                                realizacji usług oraz obsługi konta zgodnie z{' '}
                                <a
                                    href="https://dev.salon-bw.pl/privacy"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Polityką prywatności
                                </a>
                                .
                            </span>
                        </AuthConsentLabel>
                        {touched.gdprConsent && errors.gdprConsent && (
                            <p role="alert" className="auth-field__error">
                                {errors.gdprConsent}
                            </p>
                        )}

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
                                    href="https://dev.salon-bw.pl/policy"
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
                                id="smsConsent"
                                checked={form.smsConsent}
                                onChange={(e) =>
                                    handleCheckbox(
                                        'smsConsent',
                                        e.target.checked,
                                    )
                                }
                            />
                            <span>
                                Wyrażam zgodę na otrzymywanie informacji
                                marketingowych drogą SMS / WhatsApp.{' '}
                                <span className="auth-consent__optional">
                                    (opcjonalne)
                                </span>
                            </span>
                        </AuthConsentLabel>

                        <AuthConsentLabel muted>
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
                            />
                            <span>
                                Wyrażam zgodę na otrzymywanie informacji
                                marketingowych drogą e-mail.{' '}
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
                </form>

                <GoogleAuthButton label="Zarejestruj się przez Google" />
            </AuthPageShell>
        </>
    );
}

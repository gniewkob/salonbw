import { FormEvent, useState } from 'react';
import Head from 'next/head';
import { requestPasswordReset } from '@/api/auth';
import {
    AuthField,
    AuthPageShell,
    AuthStatus,
    AuthSubmitButton,
    AuthTextInput,
} from '@/components/auth/AuthPageShell';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const normalized = email.trim();
        setMessage('');
        if (!emailPattern.test(normalized)) {
            setError('Podaj prawidłowy adres e-mail');
            return;
        }

        setError('');
        setSubmitting(true);
        try {
            const result = await requestPasswordReset(normalized);
            setMessage(result.message);
        } catch (err: unknown) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Nie udało się wysłać instrukcji',
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Head>
                <title>Odzyskaj hasło — Salon Black &amp; White</title>
            </Head>
            <AuthPageShell
                title="Odzyskaj hasło"
                footerPrompt="Pamiętasz hasło?"
                footerHref="/auth/login"
                footerLabel="Zaloguj się"
            >
                <p className="auth-page__intro">
                    Podaj adres użyty przy rejestracji. Wyślemy jednorazowy link
                    ważny przez 30 minut.
                </p>
                <form onSubmit={(event) => void handleSubmit(event)} noValidate>
                    <AuthField id="email" label="Adres e-mail" error={error}>
                        <AuthTextInput
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            placeholder="twoj@email.pl"
                            value={email}
                            invalid={Boolean(error)}
                            onChange={(event) => setEmail(event.target.value)}
                        />
                    </AuthField>
                    <AuthSubmitButton disabled={submitting || Boolean(message)}>
                        {submitting ? 'Wysyłanie…' : 'Wyślij instrukcje'}
                    </AuthSubmitButton>
                    <AuthStatus tone="success">{message}</AuthStatus>
                </form>
            </AuthPageShell>
        </>
    );
}

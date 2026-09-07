import { FormEvent, useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { resetPassword } from '@/api/auth';
import {
    AuthField,
    AuthPageShell,
    AuthStatus,
    AuthSubmitButton,
    AuthTextInput,
} from '@/components/auth/AuthPageShell';

export default function ResetPasswordPage() {
    const [token, setToken] = useState('');
    const tokenCaptured = useRef(false);
    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (tokenCaptured.current) return;
        const queryToken = new URLSearchParams(window.location.search).get(
            'token',
        );
        const fragmentToken = new URLSearchParams(
            window.location.hash.slice(1),
        ).get('token');
        const resolved = queryToken || fragmentToken || '';
        if (!resolved) return;

        tokenCaptured.current = true;
        setToken(resolved);
        const cleanupTimer = window.setTimeout(() => {
            window.history.replaceState(
                window.history.state,
                '',
                '/auth/reset-password',
            );
        }, 0);

        return () => window.clearTimeout(cleanupTimer);
    }, []);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setMessage('');
        if (!token) {
            setError('Brakuje linku resetującego. Poproś o nową wiadomość.');
            return;
        }
        if (password.length < 8) {
            setError('Hasło musi mieć co najmniej 8 znaków');
            return;
        }
        if (password !== confirmation) {
            setError('Hasła nie są takie same');
            return;
        }

        setSubmitting(true);
        try {
            const result = await resetPassword(token, password);
            setMessage(result.message);
            setPassword('');
            setConfirmation('');
        } catch (err: unknown) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Nie udało się zmienić hasła',
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Head>
                <title>Ustaw nowe hasło — Salon Black &amp; White</title>
                <meta name="referrer" content="no-referrer" />
            </Head>
            <AuthPageShell
                title="Ustaw nowe hasło"
                footerPrompt="Hasło już zmienione?"
                footerHref="/auth/login"
                footerLabel="Zaloguj się"
            >
                <p className="auth-page__intro">
                    Nowe hasło powinno mieć co najmniej 8 znaków.
                </p>
                <form onSubmit={(event) => void handleSubmit(event)} noValidate>
                    <AuthField id="password" label="Nowe hasło">
                        <AuthTextInput
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            minLength={8}
                            maxLength={128}
                            required
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                        />
                    </AuthField>
                    <AuthField
                        id="password-confirmation"
                        label="Powtórz nowe hasło"
                        spacious
                    >
                        <AuthTextInput
                            id="password-confirmation"
                            name="password-confirmation"
                            type="password"
                            autoComplete="new-password"
                            minLength={8}
                            maxLength={128}
                            required
                            value={confirmation}
                            onChange={(event) =>
                                setConfirmation(event.target.value)
                            }
                        />
                    </AuthField>
                    <AuthSubmitButton disabled={submitting || Boolean(message)}>
                        {submitting ? 'Zapisywanie…' : 'Ustaw hasło'}
                    </AuthSubmitButton>
                    <AuthStatus>{error}</AuthStatus>
                    <AuthStatus tone="success">{message}</AuthStatus>
                </form>
            </AuthPageShell>
        </>
    );
}

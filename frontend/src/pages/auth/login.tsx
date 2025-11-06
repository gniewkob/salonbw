import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import PublicLayout from '@/components/PublicLayout';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState({ email: '', password: '' });
    const [touched, setTouched] = useState({ email: false, password: false });
    const [errors, setErrors] = useState<{ email?: string; password?: string }>(
        {},
    );
    const [status, setStatus] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const trimmedEmail = useMemo(
        () => form.email.trim(),
        [form.email],
    );

    const validate = () => {
        const nextErrors: { email?: string; password?: string } = {};
        if (!trimmedEmail || !emailPattern.test(trimmedEmail)) {
            nextErrors.email = 'Invalid email';
        }
        if (!form.password.trim()) {
            nextErrors.password = 'Password is required';
        }
        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setStatus('');
        const valid = validate();
        if (!valid) {
            setTouched({ email: true, password: true });
            return;
        }

        setSubmitting(true);
        try {
            await login(trimmedEmail, form.password);
            void router.push('/dashboard');
        } catch (err: unknown) {
            setStatus(err instanceof Error ? err.message : 'Login failed');
            setForm((prev) => ({ ...prev, password: '' }));
        } finally {
            setSubmitting(false);
        }
    };

    const handleBlur = (field: 'email' | 'password') => {
        setTouched((prev) => ({ ...prev, [field]: true }));
        validate();
    };

    return (
        <PublicLayout>
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={(event) => {
                            const value = event.target.value;
                            setForm((prev) => ({ ...prev, email: value }));
                            if (touched.email) {
                                const nextError =
                                    !value.trim() ||
                                    !emailPattern.test(value.trim())
                                        ? 'Invalid email'
                                        : undefined;
                                setErrors((prev) => ({
                                    ...prev,
                                    email: nextError,
                                }));
                            }
                        }}
                        onBlur={() => handleBlur('email')}
                    />
                    {touched.email && errors.email && (
                        <p role="alert" style={{ color: 'red' }}>
                            {errors.email}
                        </p>
                    )}
                </div>
                <div>
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={(event) => {
                            const value = event.target.value;
                            setForm((prev) => ({ ...prev, password: value }));
                            if (touched.password) {
                                const nextError = value.trim()
                                    ? undefined
                                    : 'Password is required';
                                setErrors((prev) => ({
                                    ...prev,
                                    password: nextError,
                                }));
                            }
                        }}
                        onBlur={() => handleBlur('password')}
                    />
                    {touched.password && errors.password && (
                        <p role="alert" style={{ color: 'red' }}>
                            {errors.password}
                        </p>
                    )}
                </div>
                <button type="submit" disabled={submitting}>
                    {submitting ? 'Loading...' : 'Login'}
                </button>
                {status && (
                    <p role="alert" style={{ color: 'red' }}>
                        {status}
                    </p>
                )}
            </form>
            <p>
                Nie masz konta?{' '}
                <Link href="/auth/register">Zarejestruj się</Link>
            </p>
        </PublicLayout>
    );
}

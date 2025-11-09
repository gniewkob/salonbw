import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import PublicLayout from '@/components/PublicLayout';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type LoginFormValues = {
    email: string;
    password: string;
};

type LoginErrors = Partial<Record<keyof LoginFormValues, string>>;

const validateLoginForm = (values: LoginFormValues): LoginErrors => {
    const errors: LoginErrors = {};
    const trimmedEmail = values.email.trim();
    if (!trimmedEmail) {
        errors.email = 'Email is required';
    } else if (!emailPattern.test(trimmedEmail)) {
        errors.email = 'Invalid email';
    }
    if (!values.password.trim()) {
        errors.password = 'Password is required';
    }
    return errors;
};

export const loginValidationSchema = {
    async validateAt(field: keyof LoginFormValues, values: LoginFormValues) {
        const errors = validateLoginForm(values);
        const message = errors[field];
        if (message) {
            throw new Error(message);
        }
    },
    async validate(values: LoginFormValues) {
        const errors = validateLoginForm(values);
        if (Object.keys(errors).length > 0) {
            throw new Error(errors.email ?? errors.password ?? 'Invalid email');
        }
        return values;
    },
    async isValid(values: LoginFormValues) {
        return Object.keys(validateLoginForm(values)).length === 0;
    },
};

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState<LoginFormValues>({
        email: '',
        password: '',
    });
    const [touched, setTouched] = useState({
        email: false,
        password: false,
    });
    const [errors, setErrors] = useState<LoginErrors>({});
    const [status, setStatus] = useState('');
    const [submitting, setSubmitting] = useState(false);

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
        runValidation();
    };

    return (
        <PublicLayout>
            <form
                onSubmit={(event) => {
                    void handleSubmit(event);
                }}
            >
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

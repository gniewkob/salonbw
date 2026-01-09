import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';

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
        <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                        Sign in to SalonBW Panel
                    </h2>
                </div>
                <form
                    className="mt-8 space-y-6"
                    onSubmit={(event) => {
                        void handleSubmit(event);
                    }}
                >
                    <div className="-space-y-px rounded-md shadow-sm">
                        <div>
                            <label htmlFor="email" className="sr-only">
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="relative block w-full rounded-t-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                placeholder="Email address"
                                value={form.email}
                                onChange={(event) => {
                                    const value = event.target.value;
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
                                onBlur={() => handleBlur('email')}
                            />
                            {touched.email && errors.email && (
                                <p
                                    role="alert"
                                    className="text-red-600 text-sm mt-1"
                                >
                                    {errors.email}
                                </p>
                            )}
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="relative block w-full rounded-b-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                                placeholder="Password"
                                value={form.password}
                                onChange={(event) => {
                                    const value = event.target.value;
                                    setForm((prev) => ({
                                        ...prev,
                                        password: value,
                                    }));
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
                                <p
                                    role="alert"
                                    className="text-red-600 text-sm mt-1"
                                >
                                    {errors.password}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="group relative flex w-full justify-center rounded-md bg-indigo-600 py-2 px-3 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-70"
                        >
                            {submitting ? 'Signing in...' : 'Sign in'}
                        </button>
                    </div>

                    {status && (
                        <div className="text-center">
                            <p role="alert" className="text-red-600 text-sm">
                                {status}
                            </p>
                        </div>
                    )}
                </form>
                <div className="text-center text-sm">
                    <p>
                        Don't have an account?{' '}
                        <Link
                            href="/auth/register"
                            className="font-semibold text-indigo-600 hover:text-indigo-500"
                        >
                            Register
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RegisterFormValues = {
    name: string;
    email: string;
    phone: string;
    password: string;
};

type RegisterErrors = Partial<Record<keyof RegisterFormValues, string>>;

const validateRegisterForm = (values: RegisterFormValues): RegisterErrors => {
    const errors: RegisterErrors = {};
    if (!values.name.trim()) {
        errors.name = 'Name is required';
    }
    const trimmedEmail = values.email.trim();
    if (!trimmedEmail) {
        errors.email = 'Email is required';
    } else if (!emailPattern.test(trimmedEmail)) {
        errors.email = 'Invalid email';
    }
    if (!values.password) {
        errors.password = 'Password is required';
    } else if (values.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
    }
    return errors;
};

export default function RegisterPage() {
    const { register } = useAuth();
    const router = useRouter();
    const [form, setForm] = useState<RegisterFormValues>({
        name: '',
        email: '',
        phone: '',
        password: '',
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
        if (touched[field]) {
            runValidation(nextForm);
        }
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
            });
            return;
        }

        setSubmitting(true);
        try {
            await register(form);
            void router.push('/dashboard');
        } catch (err: unknown) {
            setError(
                err instanceof Error ? err.message : 'Registration failed',
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-4 bg-white min-h-screen">
            <button onClick={() => router.back()} className="mb-4">
                &larr; Back
            </button>
            <form
                onSubmit={(e) => void handleSubmit(e)}
                className="space-y-4 max-w-sm mx-auto"
                noValidate
            >
                <h1 className="text-2xl font-bold">Register</h1>

                <div>
                    <input
                        className={`border p-2 w-full rounded ${
                            touched.name && errors.name ? 'border-red-500' : ''
                        }`}
                        placeholder="Name"
                        value={form.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        onBlur={() => handleBlur('name')}
                    />
                    {touched.name && errors.name && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.name}
                        </p>
                    )}
                </div>

                <div>
                    <input
                        className={`border p-2 w-full rounded ${
                            touched.email && errors.email
                                ? 'border-red-500'
                                : ''
                        }`}
                        placeholder="Email"
                        type="email"
                        value={form.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        onBlur={() => handleBlur('email')}
                    />
                    {touched.email && errors.email && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.email}
                        </p>
                    )}
                </div>

                <div>
                    <input
                        className="border p-2 w-full rounded"
                        placeholder="Phone (optional)"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                    />
                </div>

                <div>
                    <input
                        className={`border p-2 w-full rounded ${
                            touched.password && errors.password
                                ? 'border-red-500'
                                : ''
                        }`}
                        placeholder="Password"
                        type="password"
                        value={form.password}
                        onChange={(e) =>
                            handleChange('password', e.target.value)
                        }
                        onBlur={() => handleBlur('password')}
                    />
                    {touched.password && errors.password && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.password}
                        </p>
                    )}
                </div>

                <button
                    className="bg-blue-600 text-white px-4 py-2 rounded w-full disabled:opacity-50"
                    type="submit"
                    disabled={submitting}
                >
                    {submitting ? 'Registering...' : 'Register'}
                </button>
                {error && (
                    <p role="alert" className="text-red-600 text-center">
                        {error}
                    </p>
                )}
                <p className="text-center text-sm">
                    Already have an account?{' '}
                    <Link
                        href="/auth/login"
                        className="text-blue-600 hover:underline"
                    >
                        Login
                    </Link>
                </p>
            </form>
        </div>
    );
}

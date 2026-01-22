import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { useAuth } from '@/contexts/AuthContext';
import PublicLayout from '@/components/PublicLayout';
import type { Route } from 'next';

export default function Login() {
    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            // After successful login, redirect to Panel
            const panelUrl = process.env.NEXT_PUBLIC_PANEL_URL;
            if (panelUrl) {
                window.location.href = panelUrl;
            } else {
                // Fallback if env var is missing (though it should be there)
                console.error('NEXT_PUBLIC_PANEL_URL is not set');
                // Try to guess or fallback to landing page if something is wrong
                await router.push('/');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Login failed');
            setLoading(false);
        }
    };

    return (
        <PublicLayout>
            <Head>
                <title>Login | Salon Black &amp; White</title>
            </Head>
            <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
                <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>
                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                        {error}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-200 disabled:opacity-50"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <div className="mt-4 text-center text-sm">
                    Don't have an account?{' '}
                    <Link
                        href={'/auth/register' as Route}
                        className="text-blue-600 hover:underline"
                    >
                        Register
                    </Link>
                </div>
            </div>
        </PublicLayout>
    );
}

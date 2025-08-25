import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import PublicLayout from '@/components/PublicLayout';

export const loginValidationSchema = Yup.object({
    email: Yup.string().email('Invalid email').required('Email is required'),
    password: Yup.string().required('Password is required'),
});

export default function LoginPage() {
    const { login } = useAuth();
    const router = useRouter();

    return (
        <PublicLayout>
            <Formik
                initialValues={{ email: '', password: '' }}
                validationSchema={loginValidationSchema}
                onSubmit={async (
                    values,
                    { setSubmitting, setStatus, setFieldValue },
                ) => {
                    try {
                        await login(values.email, values.password);
                        void router.push('/dashboard');
                    } catch (err: unknown) {
                        setStatus(
                            err instanceof Error ? err.message : 'Login failed',
                        );
                        void setFieldValue('password', '', false);
                    } finally {
                        setSubmitting(false);
                    }
                }}
            >
                {({
                    errors,
                    touched,
                    isSubmitting,
                    status,
                    handleChange,
                    handleBlur,
                    values,
                }) => (
                    <Form>
                        <div>
                            <label htmlFor="email">Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={values.email}
                                onChange={handleChange}
                                onBlur={handleBlur}
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
                                value={values.password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                            />
                            {touched.password && errors.password && (
                                <p role="alert" style={{ color: 'red' }}>
                                    {errors.password}
                                </p>
                            )}
                        </div>
                        <button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 'Loading...' : 'Login'}
                        </button>
                        {status && (
                            <p role="alert" style={{ color: 'red' }}>
                                {status}
                            </p>
                        )}
                    </Form>
                )}
            </Formik>
            <p>
                Nie masz konta?{' '}
                <Link href="/auth/register">Zarejestruj się</Link>
            </p>
        </PublicLayout>
    );
}

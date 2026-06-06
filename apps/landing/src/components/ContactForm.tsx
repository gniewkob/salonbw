import { FormEvent, useMemo, useState } from 'react';
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/20/solid';
import { useToast } from '@/contexts/ToastContext';
import { useLanguage } from '@/contexts/LanguageContext';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactForm() {
    const toast = useToast();
    const { T } = useLanguage();
    const c = T.contact;
    const [form, setForm] = useState({ name: '', email: '', message: '' });
    const [error, setError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = e.target;
        setForm((f) => ({ ...f, [name]: value }));
        setSubmitted(false);
        setSubmitError('');
        if (name === 'email') {
            const trimmed = value.trim();
            setEmailError(
                !trimmed || emailPattern.test(trimmed) ? '' : c.formErrorEmail,
            );
        }
    };

    const trimmedForm = useMemo(
        () => ({
            name: form.name.trim(),
            email: form.email.trim(),
            message: form.message.trim(),
        }),
        [form],
    );

    const isValid =
        trimmedForm.name.length > 0 &&
        trimmedForm.message.length > 0 &&
        emailPattern.test(trimmedForm.email);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const { name, email, message } = trimmedForm;

        if (!name) {
            setError(c.formErrorName);
            return;
        }
        if (!emailPattern.test(email)) {
            setEmailError(c.formErrorEmail);
            return;
        }
        if (!message) {
            setError(c.formErrorMessage);
            return;
        }

        setError('');
        setEmailError('');
        setSubmitError('');
        setSubmitting(true);
        const retries = 3;
        try {
            for (let attempt = 0; attempt < retries; attempt++) {
                try {
                    const res = await fetch(
                        `${process.env.NEXT_PUBLIC_API_URL}/emails/contact`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                name,
                                replyTo: email,
                                message,
                            }),
                        },
                    );
                    if (!res.ok) throw new Error('Failed');
                    toast.success(c.formSuccess);
                    setSubmitted(true);
                    setForm({ name: '', email: '', message: '' });
                    return;
                } catch (err: unknown) {
                    const e = err as {
                        response?: { data?: unknown };
                        message?: string;
                    };
                    console.error(
                        'Failed to submit contact form',
                        e.response?.data || e.message,
                    );
                    if (attempt === retries - 1) {
                        setSubmitError(c.formErrorSend);
                        toast.error(c.formErrorSend);
                    } else {
                        await new Promise((res) => setTimeout(res, 1000));
                    }
                }
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={(e) => void handleSubmit(e)} className="contact-form">
            <div className="contact-form__field">
                <label className="contact-form__label" htmlFor="cf-name">
                    {c.formName}
                </label>
                <input
                    id="cf-name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder={c.formNamePlaceholder}
                    className="contact-form__input"
                    autoComplete="name"
                    required
                />
            </div>

            <div className="contact-form__field">
                <label className="contact-form__label" htmlFor="cf-email">
                    {c.formEmail}
                </label>
                <input
                    id="cf-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder={c.formEmailPlaceholder}
                    className="contact-form__input"
                    autoComplete="email"
                    required
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? 'cf-email-error' : undefined}
                />
                {emailError && (
                    <p
                        id="cf-email-error"
                        role="alert"
                        className="contact-form__error"
                    >
                        <ExclamationTriangleIcon
                            aria-hidden="true"
                            style={{ width: 14, height: 14 }}
                        />
                        <span>{emailError}</span>
                    </p>
                )}
            </div>

            <div className="contact-form__field">
                <label className="contact-form__label" htmlFor="cf-message">
                    {c.formMessage}
                </label>
                <textarea
                    id="cf-message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder={c.formMessagePlaceholder}
                    className="contact-form__input contact-form__textarea"
                    rows={5}
                    required
                />
            </div>

            {error && (
                <p role="alert" className="contact-form__error">
                    <ExclamationTriangleIcon
                        aria-hidden="true"
                        style={{ width: 14, height: 14 }}
                    />
                    <span>{error}</span>
                </p>
            )}
            {submitError && (
                <p
                    data-testid="form-error-alert"
                    role="alert"
                    aria-live="assertive"
                    className="contact-form__error"
                >
                    <ExclamationTriangleIcon
                        aria-hidden="true"
                        style={{ width: 14, height: 14 }}
                    />
                    <span>{submitError}</span>
                </p>
            )}
            {submitted && (
                <p
                    data-testid="form-success-message"
                    role="status"
                    aria-live="polite"
                    className="contact-form__success"
                >
                    <CheckCircleIcon
                        aria-hidden="true"
                        style={{ width: 14, height: 14 }}
                    />
                    <span>{c.formSuccess}</span>
                </p>
            )}

            <button
                type="submit"
                disabled={!isValid || submitting}
                className="btn-silver contact-form__submit"
            >
                {submitting ? 'Wysyłanie…' : c.formSubmit}
            </button>
        </form>
    );
}

import { FormEvent, useMemo, useState } from 'react';
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

        if (!name) { setError(c.formErrorName); return; }
        if (!emailPattern.test(email)) { setEmailError(c.formErrorEmail); return; }
        if (!message) { setError(c.formErrorMessage); return; }

        setError('');
        setEmailError('');
        setSubmitError('');
        const retries = 3;
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/emails/contact`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name, replyTo: email, message }),
                    },
                );
                if (!res.ok) throw new Error('Failed');
                toast.success(c.formSuccess);
                setSubmitted(true);
                setForm({ name: '', email: '', message: '' });
                return;
            } catch (err: unknown) {
                const e = err as { response?: { data?: unknown }; message?: string };
                console.error('Failed to submit contact form', e.response?.data || e.message);
                if (attempt === retries - 1) {
                    setSubmitError(c.formErrorSend);
                    toast.error(c.formErrorSend);
                } else {
                    await new Promise((res) => setTimeout(res, 1000));
                }
            }
        }
    };

    return (
        <form onSubmit={(e) => void handleSubmit(e)} className="contact-form">
            <div className="contact-form__field">
                <label className="contact-form__label" htmlFor="cf-name">{c.formName}</label>
                <input
                    id="cf-name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder={c.formNamePlaceholder}
                    className="contact-form__input"
                    autoComplete="name"
                />
            </div>

            <div className="contact-form__field">
                <label className="contact-form__label" htmlFor="cf-email">{c.formEmail}</label>
                <input
                    id="cf-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder={c.formEmailPlaceholder}
                    className="contact-form__input"
                    autoComplete="email"
                />
                {emailError && <p role="alert" className="contact-form__error">{emailError}</p>}
            </div>

            <div className="contact-form__field">
                <label className="contact-form__label" htmlFor="cf-message">{c.formMessage}</label>
                <textarea
                    id="cf-message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder={c.formMessagePlaceholder}
                    className="contact-form__input contact-form__textarea"
                    rows={5}
                />
            </div>

            {error && <p role="alert" className="contact-form__error">{error}</p>}
            {submitError && (
                <p data-testid="form-error-alert" className="contact-form__error">{submitError}</p>
            )}
            {submitted && (
                <p data-testid="form-success-message" className="contact-form__success">
                    {c.formSuccess}
                </p>
            )}

            <button
                type="submit"
                disabled={!isValid}
                className="btn-silver contact-form__submit"
            >
                {c.formSubmit}
            </button>
        </form>
    );
}

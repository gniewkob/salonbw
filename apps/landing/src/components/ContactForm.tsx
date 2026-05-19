import { FormEvent, useMemo, useState } from 'react';
import { useToast } from '@/contexts/ToastContext';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactForm() {
    const toast = useToast();
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
                !trimmed || emailPattern.test(trimmed)
                    ? ''
                    : 'Nieprawidłowy format adresu email',
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

        if (!name) { setError('Imię jest wymagane'); return; }
        if (!emailPattern.test(email)) { setEmailError('Nieprawidłowy format adresu email'); return; }
        if (!message) { setError('Wiadomość jest wymagana'); return; }

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
                toast.success('Wiadomość została wysłana');
                setSubmitted(true);
                setForm({ name: '', email: '', message: '' });
                return;
            } catch (err: unknown) {
                const e = err as { response?: { data?: unknown }; message?: string };
                console.error('Failed to submit contact form', e.response?.data || e.message);
                if (attempt === retries - 1) {
                    setSubmitError('Nie udało się wysłać wiadomości. Spróbuj ponownie.');
                    toast.error('Nie udało się wysłać formularza');
                } else {
                    await new Promise((res) => setTimeout(res, 1000));
                }
            }
        }
    };

    return (
        <form onSubmit={(e) => void handleSubmit(e)} className="contact-form">
            <div className="contact-form__field">
                <label className="contact-form__label" htmlFor="cf-name">Imię i nazwisko</label>
                <input
                    id="cf-name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="np. Anna Kowalska"
                    className="contact-form__input"
                    autoComplete="name"
                />
            </div>

            <div className="contact-form__field">
                <label className="contact-form__label" htmlFor="cf-email">Adres email</label>
                <input
                    id="cf-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="np. anna@gmail.com"
                    className="contact-form__input"
                    autoComplete="email"
                />
                {emailError && <p role="alert" className="contact-form__error">{emailError}</p>}
            </div>

            <div className="contact-form__field">
                <label className="contact-form__label" htmlFor="cf-message">Wiadomość</label>
                <textarea
                    id="cf-message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="W czym możemy pomóc?"
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
                    Wiadomość wysłana — odezwiemy się wkrótce.
                </p>
            )}

            <button
                type="submit"
                disabled={!isValid}
                className="btn-gold contact-form__submit"
            >
                Wyślij wiadomość
            </button>
        </form>
    );
}

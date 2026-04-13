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

        if (!name) {
            setError('Imię jest wymagane');
            return;
        }
        if (!emailPattern.test(email)) {
            setEmailError('Nieprawidłowy format adresu email');
            return;
        }
        if (!message) {
            setError('Wiadomość jest wymagana');
            return;
        }

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
                        body: JSON.stringify({
                            name,
                            replyTo: email,
                            message,
                        }),
                    },
                );
                if (!res.ok) throw new Error('Failed');
                toast.success('formularz został wysłany');
                setSubmitted(true);
                setForm({ name: '', email: '', message: '' });
                return;
            } catch (error: unknown) {
                const err = error as {
                    response?: { data?: unknown };
                    message?: string;
                };
                console.error(
                    'Failed to submit contact form',
                    err.response?.data || err.message,
                );
                if (attempt === retries - 1) {
                    setSubmitError('Nie udało się wysłać formularza');
                    toast.error('Nie udało się wysłać formularza');
                } else {
                    await new Promise((res) => setTimeout(res, 1000));
                }
            }
        }
    };

    return (
        <form onSubmit={(e) => void handleSubmit(e)} className="gap-2">
            <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Imię i nazwisko"
                className="w-100 border p-2 rounded"
            />
            <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Adres e-mail"
                className="w-100 border p-2 rounded"
            />
            {emailError && (
                <p role="alert" className="text-danger small">
                    {emailError}
                </p>
            )}
            <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Treść wiadomości"
                className="w-100 border p-2 rounded"
                rows={4}
            />
            {error && (
                <p role="alert" className="text-danger small">
                    {error}
                </p>
            )}
            {submitError && (
                <p data-testid="form-error-alert" className="text-danger small">
                    {submitError}
                </p>
            )}
            {submitted && (
                <p
                    data-testid="form-success-message"
                    className="text-success small"
                >
                    formularz został wysłany
                </p>
            )}
            <button
                type="submit"
                disabled={!isValid}
                className="px-3 py-2 bg-primary bg-opacity-10 text-white rounded"
            >
                Wyślij
            </button>
        </form>
    );
}

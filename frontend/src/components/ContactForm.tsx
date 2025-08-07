import { FormEvent, useState } from 'react';
import { z } from 'zod';
import { useToast } from '@/contexts/ToastContext';

const schema = z.object({
  name: z.string().min(1, { message: 'Imię jest wymagane' }),
  email: z
    .string()
    .email({ message: 'Nieprawidłowy format adresu email' }),
  message: z.string().min(1, { message: 'Wiadomość jest wymagana' }),
});

export default function ContactForm() {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setSubmitted(false);
    setSubmitError('');
    if (name === 'email') {
      const result = schema.shape.email.safeParse(value);
      setEmailError(result.success ? '' : result.error.issues[0].message);
    }
  };

  const isValid = schema.safeParse(form).success;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      const issue = result.error.issues[0];
      if (issue.path[0] === 'email') {
        setEmailError(issue.message);
      } else {
        setError(issue.message);
      }
      return;
    }
    setError('');
    setEmailError('');
    setSubmitError('');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/emails/send`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: 'contact@example.com',
            subject: 'Contact form',
            template: '<p>{{message}}</p>',
            data: form,
          }),
        }
      );
      if (!res.ok) throw new Error('Failed');
      toast.success('formularz został wysłany');
      setSubmitted(true);
      setForm({ name: '', email: '', message: '' });
    } catch (_err: unknown) {
      void _err;
      setSubmitError('Nie udało się wysłać formularza');
      toast.error('Nie udało się wysłać formularza');
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-2">
      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Your name"
        className="w-full border p-2 rounded"
      />
      <input
        name="email"
        type="email"
        value={form.email}
        onChange={handleChange}
        placeholder="Your email"
        className="w-full border p-2 rounded"
      />
      {emailError && (
        <p role="alert" className="text-red-600 text-sm">
          {emailError}
        </p>
      )}
      <textarea
        name="message"
        value={form.message}
        onChange={handleChange}
        placeholder="Message"
        className="w-full border p-2 rounded"
        rows={4}
      />
      {error && (
        <p role="alert" className="text-red-600 text-sm">
          {error}
        </p>
      )}
      {submitError && (
        <p
          data-testid="form-error-alert"
          className="text-red-600 text-sm"
        >
          {submitError}
        </p>
      )}
      {submitted && (
        <p
          data-testid="form-success-message"
          className="text-green-600 text-sm"
        >
          formularz został wysłany
        </p>
      )}
      <button
        type="submit"
        disabled={!isValid}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        Send
      </button>
    </form>
  );
}

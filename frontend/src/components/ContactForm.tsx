import { FormEvent, useState } from 'react';
import { z } from 'zod';
import { useToast } from '@/contexts/ToastContext';

const schema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.string().email({ message: 'Email is invalid' }),
  message: z.string().min(1, { message: 'Message is required' }),
});

export default function ContactForm() {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const isValid = schema.safeParse(form).success;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }
    setError('');
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
      toast.success('Message sent');
      setForm({ name: '', email: '', message: '' });
    } catch (err: any) {
      toast.error(err.message || 'Error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
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

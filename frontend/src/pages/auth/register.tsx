import { FormEvent, useState } from 'react';
import { useRouter } from 'next/router';
import PublicLayout from '@/components/PublicLayout';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, password }),
        }
      );
      if (!res.ok) throw new Error('Registration failed');
      void router.push('/auth/login');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  return (
    <PublicLayout>
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-2 p-4">
        <h1 className="text-2xl font-bold">Register</h1>
        <input
          className="border p-1 w-full"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="border p-1 w-full"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border p-1 w-full"
          placeholder="Phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <input
          className="border p-1 w-full"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="border px-2 py-1" type="submit">
          Register
        </button>
        {error && (
          <p role="alert" className="text-red-600">
            {error}
          </p>
        )}
      </form>
    </PublicLayout>
  );
}

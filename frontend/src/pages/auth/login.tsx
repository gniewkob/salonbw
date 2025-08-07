import { FormEvent, useState } from 'react';
import { useRouter } from 'next/router';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const schema = z.object({
    email: z.string().email({ message: 'Invalid email' }),
    password: z.string().min(1, { message: 'Password is required' }),
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const creds = schema.parse({ email, password });
      await login(creds.email, creds.password);
      router.push('/dashboard');
    } catch (err: unknown) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0]?.message ?? 'Login failed');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Login failed');
      }
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)}>
      <input
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        placeholder="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Login</button>
      {error && (
        <p role="alert" style={{ color: 'red' }}>
          {error}
        </p>
      )}
    </form>
  );
}

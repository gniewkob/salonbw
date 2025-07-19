import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function PublicNav() {
  const { isAuthenticated } = useAuth();
  return (
    <nav className="flex space-x-4 p-2 border-b">
      <Link href="/">Home</Link>
      <Link href="/services">Services</Link>
      <Link href="/gallery">Gallery</Link>
      <Link href="/contact">Contact</Link>
      {isAuthenticated ? (
        <Link href="/dashboard">Dashboard</Link>
      ) : (
        <>
          <Link href="/auth/login">Login</Link>
          <Link href="/auth/register">Register</Link>
        </>
      )}
    </nav>
  );
}

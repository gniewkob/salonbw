'use client';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function PublicNav() {
  const { role } = useAuth();

  return (
    <nav className="flex justify-between items-center p-4 bg-gray-100 shadow-md">
      <Link href="/" className="font-bold text-xl mr-4">
        Salon Black & White
      </Link>
      <div className="flex space-x-4">
        <Link href="/">Home</Link>
        <Link href="/services">Services</Link>
        <Link href="/gallery">Gallery</Link>
        <Link href="/faq">FAQ</Link>
        <Link href="/contact">Contact</Link>
        <Link href="/appointments">Book Now</Link>
        {role ? (
          <Link href={`/dashboard/${role}`}>Dashboard</Link>
        ) : (
          <>
            <Link href="/auth/login">Login</Link>
            <Link href="/auth/register">Register</Link>
          </>
        )}
        <Link href="/policy">Policy</Link>
        <Link href="/privacy">Privacy</Link>
      </div>
    </nav>
  );
}

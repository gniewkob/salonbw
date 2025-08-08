'use client';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function PublicNav() {
  const { role } = useAuth();

  return (
    <nav
      aria-label="Main navigation"
      className="flex justify-between items-center p-4 bg-gray-100 shadow-md"
    >
      <Link href="/" className="font-bold text-xl mr-4">
        Salon Black & White
      </Link>
      <ul className="flex space-x-4">
        <li>
          <Link href="/">Home</Link>
        </li>
        <li>
          <Link href="/services">Services</Link>
        </li>
        <li>
          <Link href="/gallery">Gallery</Link>
        </li>
        <li>
          <Link href="/faq">FAQ</Link>
        </li>
        <li>
          <Link href="/contact">Contact</Link>
        </li>
        <li>
          <Link href="/appointments">Book Now</Link>
        </li>
        {role ? (
          <li>
            <Link href={`/dashboard/${role}`}>Dashboard</Link>
          </li>
        ) : (
          <>
            <li>
              <Link href="/auth/login">Login</Link>
            </li>
            <li>
              <Link href="/auth/register">Register</Link>
            </li>
          </>
        )}
        <li>
          <Link href="/policy">Policy</Link>
        </li>
        <li>
          <Link href="/privacy">Privacy</Link>
        </li>
      </ul>
    </nav>
  );
}

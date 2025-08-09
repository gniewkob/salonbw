'use client';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

export default function PublicNav() {
  const { role } = useAuth();
  const linkClass = 'transition duration-150 hover:text-blue-700';

  return (
    <nav
      aria-label="Main navigation"
      className="flex justify-between items-center p-4 bg-gray-100 shadow-md"
    >
      <Link
        href="/"
        className={`font-bold text-xl mr-4 ${linkClass}`}
      >
        Salon Black & White
      </Link>
      <ul className="flex space-x-4">
        <li>
          <Link href="/" className={linkClass}>
            Home
          </Link>
        </li>
        <li>
          <Link href="/services" className={linkClass}>
            Services
          </Link>
        </li>
        <li>
          <Link href="/gallery" className={linkClass}>
            Gallery
          </Link>
        </li>
        <li>
          <Link href="/faq" className={linkClass}>
            FAQ
          </Link>
        </li>
        <li>
          <Link href="/contact" className={linkClass}>
            Contact
          </Link>
        </li>
        <li>
          <Link href="/appointments" className={linkClass}>
            Book Now
          </Link>
        </li>
        {role ? (
          <li>
            <Link href={`/dashboard/${role}`} className={linkClass}>
              Dashboard
            </Link>
          </li>
        ) : (
          <>
            <li>
              <Link href="/auth/login" className={linkClass}>
                Login
              </Link>
            </li>
            <li>
              <Link href="/auth/register" className={linkClass}>
                Register
              </Link>
            </li>
          </>
        )}
        <li>
          <Link href="/policy" className={linkClass}>
            Policy
          </Link>
        </li>
        <li>
          <Link href="/privacy" className={linkClass}>
            Privacy
          </Link>
        </li>
      </ul>
    </nav>
  );
}

'use client';
import Link from 'next/link';

export default function PublicNav() {
  return (
    <nav className="flex space-x-4 p-2 border-b">
      <Link href="/">Home</Link>
      <Link href="/services">Services</Link>
      <Link href="/gallery">Gallery</Link>
      <Link href="/faq">FAQ</Link>
      <Link href="/contact">Contact</Link>
      <Link href="/appointments">Book Now</Link>
      <Link href="/auth/login">Login</Link>
      <Link href="/auth/register">Register</Link>
      <Link href="/policy">Policy</Link>
      <Link href="/privacy">Privacy</Link>
    </nav>
  );
}

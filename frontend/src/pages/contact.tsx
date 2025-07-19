export default function ContactPage() {
  return (
    <div className="p-4 space-y-2">
      <h1 className="text-2xl font-bold">Contact Us</h1>
      <p>
        You can reach us at{' '}
        <a className="underline" href="mailto:contact@example.com">
          contact@example.com
        </a>
      </p>
      <p>Phone: 123-456-789</p>
    </div>
  );
}

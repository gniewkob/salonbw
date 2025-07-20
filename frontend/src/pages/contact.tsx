export default function ContactPage() {
  return (
    <div className="p-4 space-y-4 max-w-md">
      <h1 className="text-2xl font-bold">Contact Us</h1>
      <p>
        You can reach us at{' '}
        <a className="underline" href="mailto:contact@example.com">
          contact@example.com
        </a>
      </p>
      <p>Phone: 123-456-789</p>
      <form className="space-y-2">
        <input
          type="text"
          placeholder="Your name"
          className="w-full border p-2 rounded"
        />
        <input
          type="email"
          placeholder="Your email"
          className="w-full border p-2 rounded"
        />
        <textarea
          placeholder="Message"
          className="w-full border p-2 rounded"
          rows={4}
        />
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Send
        </button>
      </form>
    </div>
  );
}

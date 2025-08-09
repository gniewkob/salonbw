import Head from 'next/head';
import PublicLayout from '@/components/PublicLayout';

export default function PolicyPage() {
  return (
    <PublicLayout>
      <Head>
        <title>Policy | Salon Black & White</title>
        <meta
          name="description"
          content="Policies for using Salon Black & White."
        />
      </Head>
      <div className="p-4 space-y-4 max-w-md">
        <h1 className="text-2xl font-bold">Policy</h1>
        <p>Placeholder for the salon&apos;s policy information.</p>
      </div>
    </PublicLayout>
  );
}

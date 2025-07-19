import { GetServerSideProps } from 'next';

interface Service {
  id: number;
  name: string;
  price?: number;
}

interface ServicesPageProps {
  services: Service[];
}

export default function ServicesPage({ services }: ServicesPageProps) {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Our Services</h1>
      <ul className="space-y-2">
        {services.map((s) => (
          <li key={s.id} className="border-b pb-1">
            {s.name} {s.price ? `- ${s.price} zł` : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<ServicesPageProps> = async () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
  try {
    const res = await fetch(`${apiUrl}/services`);
    const data = await res.json();
    return { props: { services: data } };
  } catch {
    return { props: { services: [] } };
  }
};

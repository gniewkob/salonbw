import RouteGuard from '@/components/RouteGuard';
import Layout from '@/components/Layout';
import DashboardWidget from '@/components/DashboardWidget';
import { useDashboard } from '@/hooks/useDashboard';
import { usePaymentsApi } from '@/api/payments';

export default function DashboardPage() {
  const { data, loading } = useDashboard();
  const payments = usePaymentsApi();

  return (
    <RouteGuard>
      <Layout>
        <div className="grid gap-4 md:grid-cols-3">
          <DashboardWidget
            label="Klienci"
            value={data?.clientCount ?? 0}
            loading={loading}
          />
          <DashboardWidget
            label="Dzisiejsze rezerwacje"
            value={data?.todayCount ?? 0}
            loading={loading}
          />
          <DashboardWidget
            label="Pracownicy"
            value={data?.employeeCount ?? 0}
            loading={loading}
          />
        </div>
        <div className="mt-6">
          {loading ? (
            <div role="status" className="h-32 bg-gray-200 animate-pulse" />
          ) : (
            <table className="min-w-full border">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2 text-left">ID</th>
                  <th className="p-2 text-left">Data</th>
                  <th className="p-2 text-left">Klient</th>
                  <th className="p-2 text-left">&nbsp;</th>
                </tr>
              </thead>
              <tbody>
                {data?.upcoming.map((a) => (
                  <tr key={a.id} className="border-t">
                    <td className="p-2">{a.id}</td>
                    <td className="p-2">{new Date(a.startTime).toLocaleString()}</td>
                    <td className="p-2">
                      {a.client?.name}{' '}
                      {a.paymentStatus === 'pending' && (
                        <button
                          className="ml-2 underline"
                          onClick={async () => {
                            const url = await payments.createSession(a.id);
                            window.location.href = url;
                          }}
                        >
                          Opłać online
                        </button>
                      )}
                    </td>
                    <td className="p-2">
                      <a
                        className="underline"
                        href={`${process.env.NEXT_PUBLIC_API_URL}/calendar/add/${a.id}`}
                        target="_blank"
                      >
                        Dodaj do kalendarza
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Layout>
    </RouteGuard>
  );
}

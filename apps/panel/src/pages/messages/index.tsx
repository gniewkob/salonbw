import Link from 'next/link';
import SalonBWShell from '@/components/salonbw/SalonBWShell';
import VersumBreadcrumbs from '@/components/salonbw/VersumBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';

export default function MessagesPage() {
    const { role } = useAuth();
    if (!role) return null;
    return (
        <SalonBWShell role={role}>
            <VersumBreadcrumbs
                iconClass="sprite-breadcrumbs_communication"
                items={[
                    { label: 'Komunikacja', href: '/communication' },
                    { label: 'Wiadomości' },
                ]}
            />
            <div>
                <div className="actions">
                    <Link
                        href="/newsletters/new"
                        className="btn button-blue pull-right"
                    >
                        + nowy newsletter
                    </Link>
                </div>
                <h2>Wiadomości</h2>
                <p className="text-muted">
                    Historia wysłanych wiadomości masowych i newsletterów.
                </p>
                <table className="table table-bordered">
                    <thead>
                        <tr>
                            <th>
                                <div>Temat</div>
                            </th>
                            <th>
                                <div>Typ</div>
                            </th>
                            <th>
                                <div>Data wysyłki</div>
                            </th>
                            <th>
                                <div>Odbiorcy</div>
                            </th>
                            <th>
                                <div>Status</div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colSpan={5} style={{ textAlign: 'center' }}>
                                Brak wysłanych wiadomości
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </SalonBWShell>
    );
}

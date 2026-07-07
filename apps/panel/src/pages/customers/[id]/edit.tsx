import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import type { Route } from 'next';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import { useCustomer, useUpdateCustomer } from '@/hooks/useCustomers';
import type { Customer } from '@/types';
import CustomerPersonalDataTab from '@/components/customers/CustomerPersonalDataTab';
import CustomerErrorBoundary from '@/components/customers/CustomerErrorBoundary';

function parseNumericIdParam(
    value: string | string[] | undefined,
): number | null {
    if (!value) return null;
    const raw = Array.isArray(value) ? value[0] : value;
    const n = Number(raw);
    return Number.isInteger(n) && n > 0 ? n : null;
}

function parseCustomerIdFromRoute(
    idParam: string | string[] | undefined,
    asPath: string,
): number | null {
    const fromParam = parseNumericIdParam(idParam);
    if (fromParam !== null) return fromParam;

    const match = asPath.match(/^\/customers\/(\d+)(?:[/?#]|$)/);
    if (!match) return null;
    const parsed = Number(match[1]);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export default function CustomerEditPage() {
    const router = useRouter();
    const { role } = useAuth();
    const { id } = router.query;
    const customerId = parseCustomerIdFromRoute(id, router.asPath);

    const { data: customer, isLoading, error } = useCustomer(customerId);
    const updateCustomer = useUpdateCustomer();

    const handleUpdate = async (data: Partial<Customer>) => {
        if (!customerId) return;
        try {
            await updateCustomer.mutateAsync({ id: customerId, data });
        } catch {
            // onError in useUpdateCustomer already shows the toast
        }
    };

    // Editing shows the whole card, so a duplicate section navigator only
    // burns horizontal space and makes the form feel like several pages.
    useSetSecondaryNav(null);

    return (
        <RouteGuard
            roles={['admin', 'employee', 'receptionist']}
            permission="nav:customers"
        >
            <Head>
                <title>
                    {customer?.name
                        ? `Edytuj: ${customer.name} — Salon Black & White`
                        : 'Edycja klienta — Salon Black & White'}
                </title>
            </Head>
            <SalonShell role={role}>
                <CustomerErrorBoundary
                    fallback={
                        <div className="show_customer" id="customers_main">
                            <div className="customer-error">
                                Wystąpił błąd podczas renderowania formularza
                                edycji klienta.
                            </div>
                        </div>
                    }
                >
                    <div className="show_customer" id="customers_main">
                        <SalonBreadcrumbs
                            iconClass="sprite-breadcrumbs_customers"
                            items={[
                                { label: 'Klienci', href: '/customers' },
                                {
                                    label: customer?.name || '...',
                                    href: customer?.id
                                        ? `/customers/${customer.id}`
                                        : undefined,
                                },
                                { label: 'Edytuj klienta' },
                            ]}
                        />

                        {isLoading ? (
                            <div className="customer-loading">Ładowanie...</div>
                        ) : error ? (
                            <div className="customer-error">
                                Nie udało się załadować klienta.
                            </div>
                        ) : customer ? (
                            <div className="customer-edit-shell">
                                <div className="customer-edit-header">
                                    <div>
                                        <span className="customer-detail-eyebrow">
                                            Edycja klienta
                                        </span>
                                        <h1>
                                            {customer.fullName || customer.name}
                                        </h1>
                                        <p>
                                            Zmieniasz dane kontaktowe, zgody,
                                            opis i rabaty w jednym formularzu.
                                        </p>
                                    </div>
                                    <Link
                                        href={
                                            `/customers/${customer.id}` as Route
                                        }
                                        className="btn btn-outline-secondary btn-sm"
                                    >
                                        Wróć do karty
                                    </Link>
                                </div>
                                <div className="customer-edit-card">
                                    <CustomerPersonalDataTab
                                        customer={customer}
                                        onUpdate={handleUpdate}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="customer-error">
                                Nie znaleziono klienta.
                            </div>
                        )}
                    </div>
                </CustomerErrorBoundary>
            </SalonShell>
        </RouteGuard>
    );
}

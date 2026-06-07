import Link from 'next/link';
import type { Appointment, Customer } from '@/types';
import { trackReceptionAction } from '../receptionTelemetry';

function formatDateTime(value: string | null | undefined): string {
    if (!value) return 'brak';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'brak';
    return date.toLocaleString('pl-PL', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

interface CustomerStats {
    totalVisits: number;
    noShowVisits: number;
    totalSpent: number;
    lastVisitDate: string | null;
}

interface CustomerAlert {
    id: string;
    label: string;
    detail?: string;
    severity: 'info' | 'warning' | 'danger';
}

interface Props {
    mode: 'create' | 'edit';
    isEditMode: boolean;
    customers: Customer[];
    customerSearch: string;
    setCustomerSearch: (v: string) => void;
    clientId: number | '';
    setClientId: (v: number | '') => void;
    showQuickCreateCustomer: boolean;
    setShowQuickCreateCustomer: (v: (prev: boolean) => boolean) => void;
    newCustomerFirstName: string;
    setNewCustomerFirstName: (v: string) => void;
    newCustomerLastName: string;
    setNewCustomerLastName: (v: string) => void;
    newCustomerPhone: string;
    setNewCustomerPhone: (v: string) => void;
    newCustomerEmail: string;
    setNewCustomerEmail: (v: string) => void;
    handleQuickCreateCustomer: () => void;
    appointment: Appointment | null | undefined;
    customerStats: CustomerStats | null | undefined;
    customerStatsLoading: boolean;
    customerAlerts: CustomerAlert[];
    customerAlertsLoading: boolean;
    customerAlertSeverity: 'info' | 'warning' | 'danger' | undefined;
    saving: boolean;
    createCustomerPending: boolean;
    canCreateInlineCustomer: boolean;
}

export default function ClientSection({
    mode,
    isEditMode,
    customers,
    customerSearch,
    setCustomerSearch,
    clientId,
    setClientId,
    showQuickCreateCustomer,
    setShowQuickCreateCustomer,
    newCustomerFirstName,
    setNewCustomerFirstName,
    newCustomerLastName,
    setNewCustomerLastName,
    newCustomerPhone,
    setNewCustomerPhone,
    newCustomerEmail,
    setNewCustomerEmail,
    handleQuickCreateCustomer,
    appointment,
    customerStats,
    customerStatsLoading,
    customerAlerts,
    customerAlertsLoading,
    customerAlertSeverity,
    saving,
    createCustomerPending,
    canCreateInlineCustomer,
}: Props) {
    return (
        <>
            <div className="rounded border p-2">
                <strong className="d-block mb-2">Klient</strong>
                <label className="form-label" htmlFor="appointment-client">
                    Klient
                </label>

                {mode === 'create' && (
                    <input
                        id="appointment-client-search"
                        type="search"
                        aria-label="Szukaj klienta"
                        className="form-control mb-2"
                        placeholder="Szukaj po imieniu, nazwisku, telefonie..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                    />
                )}

                <select
                    id="appointment-client"
                    className="form-select"
                    value={clientId}
                    onChange={(e) => setClientId(Number(e.target.value))}
                    disabled={isEditMode}
                >
                    <option value="">Wybierz klienta</option>
                    {customers.map((customer: Customer) => (
                        <option key={customer.id} value={customer.id}>
                            {customer.fullName ?? customer.name}
                        </option>
                    ))}
                </select>

                {mode === 'create' && (
                    <div className="mt-2">
                        <button
                            type="button"
                            className="btn btn-link btn-sm p-0"
                            onClick={() =>
                                setShowQuickCreateCustomer((prev) => !prev)
                            }
                        >
                            {showQuickCreateCustomer
                                ? 'Ukryj szybkie dodawanie klienta'
                                : 'Dodaj nowego klienta'}
                        </button>
                    </div>
                )}

                {mode === 'create' && showQuickCreateCustomer && (
                    <div className="mt-2 rounded border p-2">
                        <div className="row g-2">
                            <div className="col-6">
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Imię"
                                    value={newCustomerFirstName}
                                    onChange={(e) =>
                                        setNewCustomerFirstName(e.target.value)
                                    }
                                />
                            </div>
                            <div className="col-6">
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Nazwisko"
                                    value={newCustomerLastName}
                                    onChange={(e) =>
                                        setNewCustomerLastName(e.target.value)
                                    }
                                />
                            </div>
                            <div className="col-6">
                                <input
                                    type="text"
                                    className="form-control form-control-sm"
                                    placeholder="Telefon"
                                    value={newCustomerPhone}
                                    onChange={(e) =>
                                        setNewCustomerPhone(e.target.value)
                                    }
                                />
                            </div>
                            <div className="col-6">
                                <input
                                    type="email"
                                    className="form-control form-control-sm"
                                    placeholder="E-mail (opcjonalnie)"
                                    value={newCustomerEmail}
                                    onChange={(e) =>
                                        setNewCustomerEmail(e.target.value)
                                    }
                                />
                            </div>
                            <div className="col-12">
                                <button
                                    type="button"
                                    className="btn btn-outline-primary btn-sm"
                                    onClick={handleQuickCreateCustomer}
                                    disabled={
                                        saving ||
                                        createCustomerPending ||
                                        !canCreateInlineCustomer
                                    }
                                >
                                    Utwórz klienta i wybierz
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {(appointment?.client?.phone || appointment?.client?.email) && (
                    <div className="mt-2 pt-2 border-top small">
                        {appointment.client.phone && (
                            <div>
                                Tel:{' '}
                                <a href={`tel:${appointment.client.phone}`}>
                                    {appointment.client.phone}
                                </a>
                            </div>
                        )}
                        {appointment.client.email && (
                            <div>
                                E-mail:{' '}
                                <a href={`mailto:${appointment.client.email}`}>
                                    {appointment.client.email}
                                </a>
                            </div>
                        )}
                    </div>
                )}

                {appointment && (
                    <div className="mt-2 pt-2 border-top small">
                        <div className="d-flex align-items-center justify-content-between">
                            <strong>Podgląd klienta</strong>
                            {appointment.client?.id && (
                                <Link
                                    href={`/customers/${appointment.client.id}`}
                                    className="btn btn-sm btn-outline-primary"
                                    onClick={() =>
                                        trackReceptionAction({
                                            action: 'open_customer_profile',
                                            appointmentId: appointment.id,
                                            customerId: appointment.client?.id,
                                            customerAlertSeverity,
                                            source: 'appointment_drawer',
                                        })
                                    }
                                >
                                    Otwórz kartę klienta
                                </Link>
                            )}
                        </div>
                        {customerStatsLoading ? (
                            <div className="text-muted mt-1">
                                Ładowanie statystyk klienta...
                            </div>
                        ) : customerStats ? (
                            <div className="mt-1">
                                <div>
                                    Wizyty: {customerStats.totalVisits}
                                    {' · '}No-show: {customerStats.noShowVisits}
                                </div>
                                <div>
                                    Łączne wydatki:{' '}
                                    {customerStats.totalSpent.toFixed(2)} PLN
                                </div>
                                <div>
                                    Ostatnia wizyta:{' '}
                                    {formatDateTime(
                                        customerStats.lastVisitDate,
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-muted mt-1">
                                Brak statystyk klienta.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {appointment &&
                !customerAlertsLoading &&
                customerAlerts.length > 0 && (
                    <div className="rounded border p-2">
                        <strong className="d-block mb-2">Alerty</strong>
                        <div className="d-flex flex-column gap-1">
                            {customerAlerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className={`small rounded px-2 py-1 ${
                                        alert.severity === 'danger'
                                            ? 'bg-danger-subtle text-danger-emphasis'
                                            : alert.severity === 'warning'
                                              ? 'bg-warning-subtle text-warning-emphasis'
                                              : 'bg-info-subtle text-info-emphasis'
                                    }`}
                                >
                                    <strong>{alert.label}</strong>
                                    {alert.detail && (
                                        <span>
                                            {': '}
                                            {alert.detail}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
        </>
    );
}

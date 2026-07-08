import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Appointment, Customer } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import VisitNotes from '@/components/client/VisitNotes';
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

interface RecentVisit {
    id: number;
    date: string;
    service: { id: number; name: string } | null;
    status?: string | null;
    notes: string | null;
    clientComment?: string | null;
    staffRecommendations?: string | null;
    onlineAddonsSummary?: string | null;
    onlineTotalDurationMinutes?: number | null;
    onlineDurationNeedsVerification?: boolean;
}

function hasVisitNotes(visit: RecentVisit) {
    return Boolean(
        visit.clientComment?.trim() ||
            visit.staffRecommendations?.trim() ||
            visit.onlineAddonsSummary?.trim() ||
            visit.onlineTotalDurationMinutes ||
            visit.onlineDurationNeedsVerification,
    );
}

/**
 * Quick "what was done recently" — the answer Aleksandra needs the moment a
 * client is picked or a visit opened, without leaving the calendar. Last 3
 * completed visits with the client-visible note (recommendations).
 */
function RecentVisits({ customerId }: { customerId: number }) {
    const { apiFetch } = useAuth();
    const [visits, setVisits] = useState<RecentVisit[] | null>(null);

    useEffect(() => {
        let cancelled = false;
        setVisits(null);
        apiFetch<{ items: RecentVisit[] }>(
            `/customers/${customerId}/events-history?limit=3&status=completed`,
        )
            .then((data) => {
                if (!cancelled) setVisits(data.items ?? []);
            })
            .catch(() => {
                if (!cancelled) setVisits([]);
            });
        return () => {
            cancelled = true;
        };
    }, [apiFetch, customerId]);

    return (
        <div className="mt-2 pt-2 border-top small">
            <strong className="d-block mb-1">Ostatnie wizyty</strong>
            {visits === null ? (
                <div className="text-muted">Ładowanie…</div>
            ) : visits.length === 0 ? (
                <div className="text-muted">Brak odbytych wizyt.</div>
            ) : (
                <div className="d-flex flex-column gap-1">
                    {visits.map((visit) => (
                        <div key={visit.id}>
                            <span className="text-muted">
                                {new Date(visit.date).toLocaleDateString(
                                    'pl-PL',
                                    { day: 'numeric', month: 'short' },
                                )}
                            </span>{' '}
                            <strong>
                                {visit.service?.name ?? 'Usługa usunięta'}
                            </strong>
                            {hasVisitNotes(visit) && (
                                <div
                                    className="mt-1"
                                    style={{
                                        overflow: 'hidden',
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                    }}
                                >
                                    <VisitNotes
                                        compact
                                        appointmentStatus={
                                            visit.status ?? undefined
                                        }
                                        notes={visit.notes}
                                        clientComment={visit.clientComment}
                                        staffRecommendations={
                                            visit.staffRecommendations
                                        }
                                        onlineAddonsSummary={
                                            visit.onlineAddonsSummary
                                        }
                                        onlineTotalDurationMinutes={
                                            visit.onlineTotalDurationMinutes
                                        }
                                        onlineDurationNeedsVerification={
                                            visit.onlineDurationNeedsVerification
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
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
                                    className="btn btn-sm btn-outline-dark"
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
                                    {/* totalSpent (SUM of decimal paidAmount) can
                                        arrive as a string — coerce before toFixed
                                        or it crashes the whole drawer. */}
                                    {(
                                        Number(customerStats.totalSpent) || 0
                                    ).toFixed(2)}{' '}
                                    PLN
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

                {(() => {
                    const selectedCustomerId =
                        appointment?.client?.id ??
                        (typeof clientId === 'number' ? clientId : null);
                    return selectedCustomerId ? (
                        <RecentVisits customerId={selectedCustomerId} />
                    ) : null;
                })()}
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

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Appointment, Employee, Service } from '@/types';
import { useServices } from '@/hooks/useServices';
import { useEmployees } from '@/hooks/useEmployees';
import {
    useCreateCustomer,
    useCustomers,
    useCustomerStatistics,
} from '@/hooks/useCustomers';
import { useCustomerAlerts } from '@/hooks/useCustomerAlerts';
import { useAuth } from '@/contexts/AuthContext';
import { useAppointmentMutations } from '@/hooks/useAppointments';
import { useWarehouseSales } from '@/hooks/useWarehouseViews';
import { useIsMobile } from '@/hooks/useIsMobile';
import {
    getAppointmentCustomerId,
    trackReceptionAction,
} from './receptionTelemetry';
import FinalizationModal from './FinalizationModal';
import ClientSection from './appointment-drawer/ClientSection';
import FormulaSection from './appointment-drawer/FormulaSection';
import ActionsSection from './appointment-drawer/ActionsSection';

const EMPTY_SERVICES: Service[] = [];
const EMPTY_EMPLOYEES: Employee[] = [];

interface AppointmentDrawerProps {
    open: boolean;
    mode: 'create' | 'edit';
    initialStartTime?: Date;
    initialEndTime?: Date;
    initialEmployeeId?: number;
    initialServiceId?: number;
    initialClientId?: number;
    initialClientName?: string;
    appointment?: Appointment | null;
    onClose: () => void;
    onSaved: () => void;
}

function toLocalDateTimeInput(value: Date): string {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    const hours = `${value.getHours()}`.padStart(2, '0');
    const minutes = `${value.getMinutes()}`.padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function fromLocalDateTimeInput(value: string): string {
    return new Date(value).toISOString();
}

function formatCurrency(value: number | null | undefined): string {
    const normalized = Number(value ?? 0);
    return `${new Intl.NumberFormat('pl-PL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(normalized)} PLN`;
}

function formatDateTime(value: string | null | undefined): string {
    if (!value) return 'brak';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'brak';
    return date.toLocaleString('pl-PL', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
}

function getHighestAlertSeverity(
    alerts: Array<{ severity: 'info' | 'warning' | 'danger' }>,
): 'info' | 'warning' | 'danger' | undefined {
    if (alerts.some((a) => a.severity === 'danger')) return 'danger';
    if (alerts.some((a) => a.severity === 'warning')) return 'warning';
    if (alerts.some((a) => a.severity === 'info')) return 'info';
    return undefined;
}

export default function AppointmentDrawer({
    open,
    mode,
    initialStartTime,
    initialEndTime,
    initialEmployeeId,
    initialServiceId,
    initialClientId,
    initialClientName,
    appointment,
    onClose,
    onSaved,
}: AppointmentDrawerProps) {
    const { apiFetch } = useAuth();
    const isMobile = useIsMobile();
    const services = useServices().data ?? EMPTY_SERVICES;
    const employees = useEmployees().data ?? EMPTY_EMPLOYEES;

    const [customerSearch, setCustomerSearch] = useState('');
    const [debouncedCustomerSearch, setDebouncedCustomerSearch] = useState('');
    const [showQuickCreateCustomer, setShowQuickCreateCustomer] =
        useState(false);
    const [newCustomerFirstName, setNewCustomerFirstName] = useState('');
    const [newCustomerLastName, setNewCustomerLastName] = useState('');
    const [newCustomerPhone, setNewCustomerPhone] = useState('');
    const [newCustomerEmail, setNewCustomerEmail] = useState('');

    const { data: customersResponse } = useCustomers({
        limit: 20,
        page: 1,
        search: debouncedCustomerSearch || undefined,
    });
    const customers = customersResponse?.items ?? [];
    const createCustomer = useCreateCustomer();
    const { cancelAppointment, updateAppointmentStatus } =
        useAppointmentMutations();

    const [startTime, setStartTime] = useState('');
    const [employeeId, setEmployeeId] = useState<number | ''>('');
    const [serviceId, setServiceId] = useState<number | ''>('');
    const [clientId, setClientId] = useState<number | ''>('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [finalizationOpen, setFinalizationOpen] = useState(false);

    const title =
        mode === 'create' ? 'Nowa wizyta' : `Wizyta #${appointment?.id ?? ''}`;

    const selectedService = useMemo<Service | undefined>(
        () => services.find((s) => s.id === Number(serviceId)),
        [serviceId, services],
    );
    // Only offer active services in the picker (legacy/duplicate services are
    // deactivated), but always keep the appointment's current service visible
    // so editing an existing visit on a now-inactive service still works.
    const bookableServices = useMemo<Service[]>(() => {
        const selectedId = Number(serviceId);
        return services.filter(
            (s) => s.isActive !== false || s.id === selectedId,
        );
    }, [services, serviceId]);
    const canCreateInlineCustomer =
        newCustomerFirstName.trim().length > 0 ||
        newCustomerLastName.trim().length > 0;

    const customerIdForInsights =
        mode === 'edit' ? (appointment?.client?.id ?? null) : null;
    const { data: customerStats, isLoading: customerStatsLoading } =
        useCustomerStatistics(customerIdForInsights);
    const { alerts: customerAlerts, isLoading: customerAlertsLoading } =
        useCustomerAlerts(customerIdForInsights);
    const customerAlertSeverity = useMemo(
        () => getHighestAlertSeverity(customerAlerts),
        [customerAlerts],
    );

    const appointmentIdForSales =
        mode === 'edit' ? (appointment?.id ?? null) : null;
    const { data: appointmentSalesResponse } = useWarehouseSales({
        page: 1,
        pageSize: 1,
        enabled: appointmentIdForSales !== null,
        appointmentId:
            appointmentIdForSales !== null ? appointmentIdForSales : undefined,
    });
    const linkedSaleId =
        appointmentSalesResponse?.items?.[0] &&
        Number(appointmentSalesResponse.items[0].id) > 0
            ? Number(appointmentSalesResponse.items[0].id)
            : null;

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedCustomerSearch(customerSearch.trim());
        }, 250);
        return () => window.clearTimeout(timer);
    }, [customerSearch]);

    useEffect(() => {
        if (!open) return;

        if (mode === 'edit' && appointment) {
            setStartTime(toLocalDateTimeInput(new Date(appointment.startTime)));
            setEmployeeId(appointment.employee?.id ?? '');
            setServiceId(appointment.service?.id ?? '');
            setClientId(appointment.client?.id ?? '');
            setError(null);
            return;
        }

        const start = initialStartTime ?? new Date();
        setStartTime(toLocalDateTimeInput(start));
        setEmployeeId(initialEmployeeId ?? '');
        setServiceId(initialServiceId ?? '');
        setClientId(initialClientId ?? '');
        setCustomerSearch(initialClientName ?? '');
        setDebouncedCustomerSearch('');
        setShowQuickCreateCustomer(false);
        setNewCustomerFirstName('');
        setNewCustomerLastName('');
        setNewCustomerPhone('');
        setNewCustomerEmail('');
        setError(null);
    }, [
        open,
        mode,
        appointment,
        initialStartTime,
        initialEndTime,
        initialEmployeeId,
        initialServiceId,
        initialClientId,
        initialClientName,
    ]);

    if (!open) return null;

    const canSaveCreate =
        mode === 'create' &&
        startTime.length > 0 &&
        Number(employeeId) > 0 &&
        Number(serviceId) > 0 &&
        Number(clientId) > 0;

    const isEditMode = mode === 'edit';
    const currentStatus = appointment?.status ?? 'scheduled';
    const isOnlinePending = currentStatus === 'online_pending';
    const isRescheduledPending = currentStatus === 'rescheduled_pending';
    const canConfirm =
        currentStatus === 'scheduled' ||
        isOnlinePending ||
        isRescheduledPending;
    const canStart =
        !isOnlinePending &&
        !isRescheduledPending &&
        (currentStatus === 'scheduled' || currentStatus === 'confirmed');
    const canNoShow =
        !isOnlinePending &&
        !isRescheduledPending &&
        (currentStatus === 'scheduled' || currentStatus === 'confirmed');
    const canCancel =
        currentStatus === 'scheduled' ||
        currentStatus === 'confirmed' ||
        isRescheduledPending;
    const canComplete = currentStatus === 'in_progress';
    const canShowFormulaSection =
        isEditMode &&
        (currentStatus === 'confirmed' ||
            currentStatus === 'in_progress' ||
            currentStatus === 'completed');

    const handleCreate = async () => {
        if (!canSaveCreate) return;
        setSaving(true);
        setError(null);
        try {
            await apiFetch<Appointment>('/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId: Number(clientId),
                    employeeId: Number(employeeId),
                    serviceId: Number(serviceId),
                    startTime: fromLocalDateTimeInput(startTime),
                }),
            });
            onSaved();
            onClose();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Nie udało się utworzyć wizyty',
            );
        } finally {
            setSaving(false);
        }
    };

    const handleQuickCreateCustomer = async () => {
        if (!canCreateInlineCustomer) return;
        setSaving(true);
        setError(null);
        try {
            const customer = await createCustomer.mutateAsync({
                firstName: newCustomerFirstName.trim() || undefined,
                lastName: newCustomerLastName.trim() || undefined,
                phone: newCustomerPhone.trim() || undefined,
                email: newCustomerEmail.trim() || undefined,
            });
            setClientId(customer.id);
            setCustomerSearch(customer.fullName ?? customer.name);
            setShowQuickCreateCustomer(false);
            setNewCustomerFirstName('');
            setNewCustomerLastName('');
            setNewCustomerPhone('');
            setNewCustomerEmail('');
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Nie udało się utworzyć klienta',
            );
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async () => {
        if (!appointment?.id || !startTime) return;
        setSaving(true);
        setError(null);
        try {
            await apiFetch<Appointment>(
                `/appointments/${appointment.id}/reschedule`,
                {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        startTime: fromLocalDateTimeInput(startTime),
                    }),
                },
            );
            onSaved();
            onClose();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Nie udało się zapisać zmian',
            );
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = async () => {
        if (!appointment?.id) return;
        setSaving(true);
        setError(null);
        try {
            await cancelAppointment.mutateAsync(appointment.id);
            onSaved();
            onClose();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Nie udało się anulować wizyty',
            );
        } finally {
            setSaving(false);
        }
    };

    const handleStatusChange = async (
        status: 'confirmed' | 'in_progress' | 'no_show',
    ) => {
        if (!appointment?.id) return;
        setSaving(true);
        setError(null);
        try {
            await updateAppointmentStatus.mutateAsync({
                id: appointment.id,
                status,
            });
            const action =
                status === 'confirmed'
                    ? 'confirm_appointment'
                    : status === 'in_progress'
                      ? 'start_appointment'
                      : 'mark_no_show';
            trackReceptionAction({
                action,
                appointmentId: appointment.id,
                customerId: getAppointmentCustomerId(appointment),
                customerAlertSeverity,
                source: 'appointment_drawer',
            });
            onSaved();
            onClose();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Nie udało się zmienić statusu wizyty',
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div
                className={
                    isMobile
                        ? 'position-fixed top-0 start-0 bottom-0 end-0'
                        : 'position-fixed top-0 start-0 bottom-0 end-0 d-flex align-items-center justify-content-center p-3'
                }
                style={
                    isMobile
                        ? { background: 'rgba(0,0,0,0.4)', zIndex: 1100 }
                        : {
                              background: 'rgba(0,0,0,0.55)',
                              backdropFilter: 'blur(4px)',
                              zIndex: 1100,
                          }
                }
                onClick={onClose}
            >
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Appointment"
                    data-salonbw-drawer-mobile={isMobile ? 'true' : undefined}
                    className={
                        isMobile
                            ? 'bg-white d-flex flex-column position-absolute'
                            : 'bg-white rounded-4 d-flex flex-column overflow-hidden'
                    }
                    style={
                        isMobile
                            ? {
                                  top: 0,
                                  right: 0,
                                  bottom: 0,
                                  left: 0,
                                  width: '100%',
                                  height: '100dvh',
                                  paddingTop: 'env(safe-area-inset-top)',
                                  paddingBottom: 'env(safe-area-inset-bottom)',
                              }
                            : {
                                  width: 'min(760px, 100%)',
                                  maxHeight: '90vh',
                                  boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
                                  border: '1px solid rgba(0,0,0,0.08)',
                              }
                    }
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div
                        className={
                            isMobile
                                ? 'd-flex align-items-center justify-content-between border-bottom px-3 py-2 flex-shrink-0'
                                : 'd-flex align-items-center justify-content-between border-bottom px-4 py-3 flex-shrink-0'
                        }
                    >
                        <strong className="fs-6">{title}</strong>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                            aria-label="Zamknij"
                            style={
                                isMobile ? { width: 28, height: 28 } : undefined
                            }
                        />
                    </div>

                    {/* Body */}
                    <div
                        className={
                            isMobile
                                ? 'p-3 d-flex flex-column gap-3 overflow-y-auto'
                                : 'p-4 d-flex flex-column gap-3 overflow-y-auto'
                        }
                        style={{ flex: 1 }}
                    >
                        {/* Appointment fields */}
                        <div className="rounded border p-2">
                            <strong className="d-block mb-2">Wizyta</strong>
                            <div>
                                <label
                                    className="form-label"
                                    htmlFor="appointment-start-time"
                                >
                                    Start wizyty
                                </label>
                                <input
                                    id="appointment-start-time"
                                    type="datetime-local"
                                    className="form-control"
                                    value={startTime}
                                    onChange={(e) =>
                                        setStartTime(e.target.value)
                                    }
                                />
                            </div>
                            <div className="mt-2">
                                <label
                                    className="form-label"
                                    htmlFor="appointment-employee"
                                >
                                    Pracownik
                                </label>
                                <select
                                    id="appointment-employee"
                                    className="form-select"
                                    value={employeeId}
                                    onChange={(e) =>
                                        setEmployeeId(Number(e.target.value))
                                    }
                                    disabled={isEditMode}
                                >
                                    <option value="">Wybierz pracownika</option>
                                    {employees.map((emp: Employee) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="mt-2">
                                <label
                                    className="form-label"
                                    htmlFor="appointment-service"
                                >
                                    Usługa
                                </label>
                                <select
                                    id="appointment-service"
                                    className="form-select"
                                    value={serviceId}
                                    onChange={(e) =>
                                        setServiceId(Number(e.target.value))
                                    }
                                    disabled={isEditMode}
                                >
                                    <option value="">Wybierz usługę</option>
                                    {bookableServices.map((svc: Service) => (
                                        <option key={svc.id} value={svc.id}>
                                            {svc.name}
                                        </option>
                                    ))}
                                </select>
                                {selectedService && (
                                    <div className="form-text">
                                        Czas: {selectedService.duration} min,
                                        cena: {selectedService.price.toFixed(2)}{' '}
                                        PLN
                                    </div>
                                )}
                            </div>
                            {appointment && (
                                <div className="mt-2 pt-2 border-top small">
                                    <div className="d-flex align-items-center gap-2 mb-1">
                                        <span>Status:</span>
                                        <span
                                            className={`badge ${
                                                currentStatus ===
                                                    'online_pending' ||
                                                currentStatus ===
                                                    'rescheduled_pending'
                                                    ? 'text-bg-warning'
                                                    : currentStatus ===
                                                        'confirmed'
                                                      ? 'text-bg-success'
                                                      : currentStatus ===
                                                          'in_progress'
                                                        ? 'text-bg-primary'
                                                        : currentStatus ===
                                                            'cancelled'
                                                          ? 'text-bg-danger'
                                                          : 'text-bg-secondary'
                                            }`}
                                        >
                                            {currentStatus === 'online_pending'
                                                ? 'Oczekuje na potwierdzenie'
                                                : currentStatus ===
                                                    'rescheduled_pending'
                                                  ? 'Przeniesiona — wymaga akceptacji'
                                                  : currentStatus ===
                                                      'confirmed'
                                                    ? 'Potwierdzona'
                                                    : currentStatus ===
                                                        'in_progress'
                                                      ? 'W trakcie'
                                                      : currentStatus ===
                                                          'completed'
                                                        ? 'Zakończona'
                                                        : currentStatus ===
                                                            'cancelled'
                                                          ? 'Anulowana'
                                                          : currentStatus ===
                                                              'no_show'
                                                            ? 'No-show'
                                                            : 'Zaplanowana'}
                                        </span>
                                    </div>
                                    {isOnlinePending && (
                                        <p className="text-warning-emphasis small mb-1">
                                            Klient zarezerwował online —
                                            potwierdź lub odrzuć rezerwację.
                                        </p>
                                    )}
                                    {isRescheduledPending && (
                                        <p className="text-warning-emphasis small mb-1">
                                            Wizyta przeniesiona — oczekuje na
                                            akceptację klienta.
                                        </p>
                                    )}
                                    <div>
                                        Płatność:{' '}
                                        {appointment.paymentStatus ??
                                            'nieopłacona'}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Client + alerts */}
                        <ClientSection
                            mode={mode}
                            isEditMode={isEditMode}
                            customers={customers}
                            customerSearch={customerSearch}
                            setCustomerSearch={setCustomerSearch}
                            clientId={clientId}
                            setClientId={setClientId}
                            showQuickCreateCustomer={showQuickCreateCustomer}
                            setShowQuickCreateCustomer={
                                setShowQuickCreateCustomer
                            }
                            newCustomerFirstName={newCustomerFirstName}
                            setNewCustomerFirstName={setNewCustomerFirstName}
                            newCustomerLastName={newCustomerLastName}
                            setNewCustomerLastName={setNewCustomerLastName}
                            newCustomerPhone={newCustomerPhone}
                            setNewCustomerPhone={setNewCustomerPhone}
                            newCustomerEmail={newCustomerEmail}
                            setNewCustomerEmail={setNewCustomerEmail}
                            handleQuickCreateCustomer={() =>
                                void handleQuickCreateCustomer()
                            }
                            appointment={appointment}
                            customerStats={customerStats}
                            customerStatsLoading={customerStatsLoading}
                            customerAlerts={customerAlerts}
                            customerAlertsLoading={customerAlertsLoading}
                            customerAlertSeverity={customerAlertSeverity}
                            saving={saving}
                            createCustomerPending={createCustomer.isPending}
                            canCreateInlineCustomer={canCreateInlineCustomer}
                        />

                        {/* Formula + history (edit mode, confirmed+ only) */}
                        {canShowFormulaSection && (
                            <FormulaSection appointment={appointment} />
                        )}

                        {/* Payment summary */}
                        {appointment &&
                            (appointment.finalizedAt ||
                                appointment.paymentMethod ||
                                appointment.paidAmount !== undefined) && (
                                <div className="rounded border p-2 small">
                                    <div className="d-flex align-items-center justify-content-between">
                                        <strong className="d-block mb-2">
                                            Sprzedaż
                                        </strong>
                                        <Link
                                            href={
                                                linkedSaleId
                                                    ? `/sales/history/${linkedSaleId}`
                                                    : appointment.id
                                                      ? `/sales/history?appointmentId=${appointment.id}`
                                                      : '/sales/history'
                                            }
                                            className="btn btn-sm btn-outline-secondary"
                                            onClick={() =>
                                                trackReceptionAction({
                                                    action: 'open_sale_detail',
                                                    appointmentId:
                                                        appointment.id,
                                                    customerId:
                                                        getAppointmentCustomerId(
                                                            appointment,
                                                        ),
                                                    customerAlertSeverity,
                                                    source: 'appointment_drawer',
                                                })
                                            }
                                        >
                                            {linkedSaleId
                                                ? 'Szczegóły sprzedaży'
                                                : 'Historia sprzedaży'}
                                        </Link>
                                    </div>
                                    <div className="mt-1">
                                        <div>
                                            Metoda:{' '}
                                            {appointment.paymentMethod ??
                                                'brak danych'}
                                        </div>
                                        <div>
                                            Zapłacono:{' '}
                                            {formatCurrency(
                                                appointment.paidAmount,
                                            )}
                                        </div>
                                        {appointment.discount !== undefined && (
                                            <div>
                                                Rabat:{' '}
                                                {formatCurrency(
                                                    appointment.discount,
                                                )}
                                            </div>
                                        )}
                                        {appointment.tipAmount !==
                                            undefined && (
                                            <div>
                                                Napiwek:{' '}
                                                {formatCurrency(
                                                    appointment.tipAmount,
                                                )}
                                            </div>
                                        )}
                                        <div>
                                            Finalizacja:{' '}
                                            {formatDateTime(
                                                appointment.finalizedAt,
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                        {error && (
                            <div className="alert alert-danger py-2 mb-0">
                                {error}
                            </div>
                        )}

                        {/* Actions */}
                        <ActionsSection
                            mode={mode}
                            saving={saving}
                            canSaveCreate={canSaveCreate}
                            startTime={startTime}
                            appointment={appointment}
                            isOnlinePending={isOnlinePending}
                            isRescheduledPending={isRescheduledPending}
                            canConfirm={canConfirm}
                            canStart={canStart}
                            canNoShow={canNoShow}
                            canCancel={canCancel}
                            canComplete={canComplete}
                            customerAlertSeverity={customerAlertSeverity}
                            onClose={onClose}
                            handleCreate={() => void handleCreate()}
                            handleUpdate={() => void handleUpdate()}
                            handleCancel={() => void handleCancel()}
                            handleStatusChange={(s) =>
                                void handleStatusChange(s)
                            }
                            setFinalizationOpen={setFinalizationOpen}
                            isMobile={isMobile}
                        />
                    </div>

                    {/* Mobile footer is rendered inside ActionsSection */}
                </div>
            </div>

            <FinalizationModal
                appointment={appointment ?? null}
                open={finalizationOpen}
                onClose={() => setFinalizationOpen(false)}
                onSuccess={() => {
                    onSaved();
                }}
            />
        </>
    );
}

import { useEffect, useMemo, useState } from 'react';
import type { Appointment, Customer, Employee, Service } from '@/types';
import { useServices } from '@/hooks/useServices';
import { useEmployees } from '@/hooks/useEmployees';
import { useCreateCustomer, useCustomers } from '@/hooks/useCustomers';
import { useAuth } from '@/contexts/AuthContext';
import { useAppointmentMutations } from '@/hooks/useAppointments';
import FinalizationModal from './FinalizationModal';

const EMPTY_SERVICES: Service[] = [];
const EMPTY_EMPLOYEES: Employee[] = [];

interface AppointmentDrawerProps {
    open: boolean;
    mode: 'create' | 'edit';
    initialStartTime?: Date;
    initialEndTime?: Date;
    initialEmployeeId?: number;
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

export default function AppointmentDrawer({
    open,
    mode,
    initialStartTime,
    initialEndTime,
    initialEmployeeId,
    appointment,
    onClose,
    onSaved,
}: AppointmentDrawerProps) {
    const { apiFetch } = useAuth();
    const servicesResult = useServices();
    const services = servicesResult.data ?? EMPTY_SERVICES;
    const employeesResult = useEmployees();
    const employees = employeesResult.data ?? EMPTY_EMPLOYEES;
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
        () => services.find((service) => service.id === Number(serviceId)),
        [serviceId, services],
    );
    const canCreateInlineCustomer =
        newCustomerFirstName.trim().length > 0 ||
        newCustomerLastName.trim().length > 0;

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
        setServiceId('');
        setClientId('');
        setCustomerSearch('');
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
    ]);

    if (!open) return null;

    const canSaveCreate =
        mode === 'create' &&
        startTime.length > 0 &&
        Number(employeeId) > 0 &&
        Number(serviceId) > 0 &&
        Number(clientId) > 0;
    const currentStatus = appointment?.status ?? 'scheduled';
    const canConfirm = currentStatus === 'scheduled';
    const canStart =
        currentStatus === 'scheduled' || currentStatus === 'confirmed';
    const canNoShow =
        currentStatus === 'scheduled' || currentStatus === 'confirmed';
    const canCancel =
        currentStatus === 'scheduled' || currentStatus === 'confirmed';
    const canComplete = currentStatus === 'in_progress';

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
            const message =
                err instanceof Error
                    ? err.message
                    : 'Nie udało się utworzyć wizyty';
            setError(message);
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
            const message =
                err instanceof Error
                    ? err.message
                    : 'Nie udało się utworzyć klienta';
            setError(message);
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
            const message =
                err instanceof Error
                    ? err.message
                    : 'Nie udało się zapisać zmian';
            setError(message);
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
            const message =
                err instanceof Error
                    ? err.message
                    : 'Nie udało się anulować wizyty';
            setError(message);
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
            onSaved();
            onClose();
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'Nie udało się zmienić statusu wizyty';
            setError(message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div
                className="position-fixed top-0 end-0 h-100 bg-white border-start shadow-lg"
                style={{ width: '420px', zIndex: 1100 }}
                role="dialog"
                aria-label="Appointment drawer"
            >
                <div className="d-flex align-items-center justify-content-between border-bottom px-3 py-2">
                    <strong>{title}</strong>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={onClose}
                    >
                        Zamknij
                    </button>
                </div>

                <div className="p-3 d-flex flex-column gap-3">
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
                            onChange={(event) =>
                                setStartTime(event.target.value)
                            }
                        />
                    </div>

                    <div>
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
                            onChange={(event) =>
                                setEmployeeId(Number(event.target.value))
                            }
                            disabled={mode === 'edit'}
                        >
                            <option value="">Wybierz pracownika</option>
                            {employees.map((employee: Employee) => (
                                <option key={employee.id} value={employee.id}>
                                    {employee.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label
                            className="form-label"
                            htmlFor="appointment-client"
                        >
                            Klient
                        </label>
                        {mode === 'create' && (
                            <input
                                id="appointment-client-search"
                                type="search"
                                className="form-control mb-2"
                                placeholder="Szukaj po imieniu, nazwisku, telefonie..."
                                value={customerSearch}
                                onChange={(event) =>
                                    setCustomerSearch(event.target.value)
                                }
                            />
                        )}
                        <select
                            id="appointment-client"
                            className="form-select"
                            value={clientId}
                            onChange={(event) =>
                                setClientId(Number(event.target.value))
                            }
                            disabled={mode === 'edit'}
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
                                        setShowQuickCreateCustomer(
                                            (prev) => !prev,
                                        )
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
                                            onChange={(event) =>
                                                setNewCustomerFirstName(
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="col-6">
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            placeholder="Nazwisko"
                                            value={newCustomerLastName}
                                            onChange={(event) =>
                                                setNewCustomerLastName(
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="col-6">
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            placeholder="Telefon"
                                            value={newCustomerPhone}
                                            onChange={(event) =>
                                                setNewCustomerPhone(
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="col-6">
                                        <input
                                            type="email"
                                            className="form-control form-control-sm"
                                            placeholder="E-mail (opcjonalnie)"
                                            value={newCustomerEmail}
                                            onChange={(event) =>
                                                setNewCustomerEmail(
                                                    event.target.value,
                                                )
                                            }
                                        />
                                    </div>
                                    <div className="col-12">
                                        <button
                                            type="button"
                                            className="btn btn-outline-primary btn-sm"
                                            onClick={() =>
                                                void handleQuickCreateCustomer()
                                            }
                                            disabled={
                                                saving ||
                                                createCustomer.isPending ||
                                                !canCreateInlineCustomer
                                            }
                                        >
                                            Utwórz klienta i wybierz
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
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
                            onChange={(event) =>
                                setServiceId(Number(event.target.value))
                            }
                            disabled={mode === 'edit'}
                        >
                            <option value="">Wybierz usługę</option>
                            {services.map((service: Service) => (
                                <option key={service.id} value={service.id}>
                                    {service.name}
                                </option>
                            ))}
                        </select>
                        {selectedService && (
                            <div className="form-text">
                                Czas: {selectedService.duration} min, cena:{' '}
                                {selectedService.price.toFixed(2)} PLN
                            </div>
                        )}
                    </div>

                    {appointment && (
                        <div className="rounded border bg-light p-2 small">
                            <div>Status: {appointment.status ?? '-'}</div>
                            <div>
                                Płatność:{' '}
                                {appointment.paymentStatus ?? 'nieopłacona'}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="alert alert-danger py-2 mb-0">
                            {error}
                        </div>
                    )}

                    <div className="d-flex flex-wrap gap-2">
                        {mode === 'create' ? (
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => void handleCreate()}
                                disabled={!canSaveCreate || saving}
                            >
                                {saving ? 'Zapisywanie…' : 'Utwórz wizytę'}
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={() => void handleUpdate()}
                                disabled={saving || !startTime}
                            >
                                {saving ? 'Zapisywanie…' : 'Zapisz zmiany'}
                            </button>
                        )}

                        {mode === 'edit' && appointment?.id ? (
                            <>
                                {canConfirm ? (
                                    <button
                                        type="button"
                                        className="btn btn-outline-primary"
                                        onClick={() =>
                                            void handleStatusChange('confirmed')
                                        }
                                        disabled={saving}
                                    >
                                        Potwierdź
                                    </button>
                                ) : null}
                                {canStart ? (
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() =>
                                            void handleStatusChange(
                                                'in_progress',
                                            )
                                        }
                                        disabled={saving}
                                    >
                                        Rozpocznij
                                    </button>
                                ) : null}
                                {canNoShow ? (
                                    <button
                                        type="button"
                                        className="btn btn-outline-warning"
                                        onClick={() =>
                                            void handleStatusChange('no_show')
                                        }
                                        disabled={saving}
                                    >
                                        No-show
                                    </button>
                                ) : null}
                                {canComplete ? (
                                    <button
                                        type="button"
                                        className="btn btn-outline-success"
                                        onClick={() =>
                                            setFinalizationOpen(true)
                                        }
                                        disabled={saving}
                                    >
                                        Finalizuj wizytę
                                    </button>
                                ) : null}
                                {canCancel ? (
                                    <button
                                        type="button"
                                        className="btn btn-outline-danger"
                                        onClick={() => void handleCancel()}
                                        disabled={saving}
                                    >
                                        Anuluj wizytę
                                    </button>
                                ) : null}
                            </>
                        ) : null}
                    </div>
                </div>
            </div>

            <div
                className="position-fixed top-0 start-0 w-100 h-100"
                style={{ background: 'rgba(0,0,0,0.35)', zIndex: 1090 }}
                onClick={onClose}
                aria-hidden="true"
            />

            <FinalizationModal
                appointment={appointment ?? null}
                open={finalizationOpen}
                onClose={() => setFinalizationOpen(false)}
                onSuccess={() => {
                    setFinalizationOpen(false);
                    onSaved();
                    onClose();
                }}
            />
        </>
    );
}

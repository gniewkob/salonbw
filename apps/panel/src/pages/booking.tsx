import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import { useAuth } from '@/contexts/AuthContext';

interface OnlineService {
    id: number;
    name: string;
    duration: number;
    price: number;
    priceType: string;
    description?: string;
    category?: string;
}

interface AvailableSlot {
    employeeId: number;
    employeeName: string;
    time: string;
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('pl-PL', {
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatDate(dateStr: string): string {
    return new Date(`${dateStr}T00:00:00`).toLocaleDateString('pl-PL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

function formatPrice(price: number, priceType: string): string {
    return priceType === 'from' ? `od ${price} zł` : `${price} zł`;
}

function todayISODate(): string {
    return new Date().toISOString().slice(0, 10);
}

type Step = 'service' | 'slot' | 'confirm';

export default function BookingPage() {
    const { role, apiFetch } = useAuth();
    const router = useRouter();

    const [step, setStep] = useState<Step>('service');
    const [services, setServices] = useState<OnlineService[]>([]);
    const [servicesLoading, setServicesLoading] = useState(true);
    const [servicesError, setServicesError] = useState('');

    const [selectedService, setSelectedService] =
        useState<OnlineService | null>(null);

    const [selectedDate, setSelectedDate] = useState(todayISODate());
    const [slots, setSlots] = useState<AvailableSlot[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [slotsError, setSlotsError] = useState('');
    const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(
        null,
    );

    const slotsAbortRef = useRef<AbortController | null>(null);

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [createdAppointmentId, setCreatedAppointmentId] = useState<
        number | null
    >(null);

    // Pre-select service from query param
    const { serviceId: serviceIdParam } = router.query;

    useEffect(() => {
        setServicesLoading(true);
        apiFetch<OnlineService[]>('/services/online-booking')
            .then((data) => {
                setServices(data);
                if (serviceIdParam) {
                    const preSelected = data.find(
                        (s) => s.id === Number(serviceIdParam),
                    );
                    if (preSelected) {
                        setSelectedService(preSelected);
                        setStep('slot');
                    }
                }
            })
            .catch(() => {
                setServicesError(
                    'Nie udało się załadować usług. Spróbuj ponownie.',
                );
            })
            .finally(() => {
                setServicesLoading(false);
            });
    }, [apiFetch, serviceIdParam]);

    const loadSlots = useCallback(
        (date: string, svcId: number) => {
            slotsAbortRef.current?.abort();
            const controller = new AbortController();
            slotsAbortRef.current = controller;

            setSlotsLoading(true);
            setSlotsError('');
            setSelectedSlot(null);
            apiFetch<AvailableSlot[]>(
                `/calendar/available-slots?serviceId=${svcId}&date=${date}`,
                { signal: controller.signal },
            )
                .then((data) => {
                    if (!controller.signal.aborted) setSlots(data);
                })
                .catch((err: unknown) => {
                    if (err instanceof Error && err.name === 'AbortError')
                        return;
                    setSlotsError(
                        'Nie udało się załadować dostępnych terminów.',
                    );
                })
                .finally(() => {
                    if (!controller.signal.aborted) setSlotsLoading(false);
                });
        },
        [apiFetch],
    );

    useEffect(() => {
        if (step === 'slot' && selectedService) {
            loadSlots(selectedDate, selectedService.id);
        }
    }, [step, selectedDate, selectedService, loadSlots]);

    const handleSelectService = (svc: OnlineService) => {
        setSelectedService(svc);
        setStep('slot');
    };

    const handleSelectSlot = (slot: AvailableSlot) => {
        setSelectedSlot(slot);
        setStep('confirm');
    };

    const handleDateChange = (date: string) => {
        setSelectedDate(date);
        if (selectedService) {
            loadSlots(date, selectedService.id);
        }
    };

    const handleConfirm = async () => {
        if (!selectedService || !selectedSlot) return;
        setSubmitting(true);
        setSubmitError('');
        try {
            const result = await apiFetch<{ id: number }>('/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    serviceId: selectedService.id,
                    employeeId: selectedSlot.employeeId,
                    startTime: selectedSlot.time,
                    reservedOnline: role === 'client',
                }),
            });
            setCreatedAppointmentId(result.id);
            setSubmitted(true);
        } catch (err: unknown) {
            setSubmitError(
                err instanceof Error
                    ? err.message
                    : 'Nie udało się zarezerwować wizyty. Spróbuj ponownie.',
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (!role) return null;

    return (
        <RouteGuard roles={['client', 'employee', 'receptionist', 'admin']}>
            <SalonShell role={role}>
                <div className="salon-section">
                    <div className="salon-column-row">
                        <div className="salon-column" style={{ maxWidth: 640 }}>
                            {submitted ? (
                                <SuccessScreen
                                    appointmentId={createdAppointmentId}
                                    service={selectedService}
                                    slot={selectedSlot}
                                    onNew={() => {
                                        setStep('service');
                                        setSelectedService(null);
                                        setSelectedSlot(null);
                                        setSubmitted(false);
                                        setCreatedAppointmentId(null);
                                    }}
                                    onHistory={() =>
                                        void router.push(
                                            '/calendar?view=client',
                                        )
                                    }
                                />
                            ) : (
                                <>
                                    <StepHeader
                                        step={step}
                                        onBack={
                                            step === 'slot'
                                                ? () => setStep('service')
                                                : step === 'confirm'
                                                  ? () => setStep('slot')
                                                  : undefined
                                        }
                                    />

                                    {step === 'service' && (
                                        <ServiceStep
                                            services={services}
                                            loading={servicesLoading}
                                            error={servicesError}
                                            onSelect={handleSelectService}
                                        />
                                    )}

                                    {step === 'slot' && selectedService && (
                                        <SlotStep
                                            service={selectedService}
                                            date={selectedDate}
                                            slots={slots}
                                            loading={slotsLoading}
                                            error={slotsError}
                                            onDateChange={handleDateChange}
                                            onSelect={handleSelectSlot}
                                        />
                                    )}

                                    {step === 'confirm' &&
                                        selectedService &&
                                        selectedSlot && (
                                            <ConfirmStep
                                                service={selectedService}
                                                slot={selectedSlot}
                                                submitting={submitting}
                                                error={submitError}
                                                onConfirm={() => {
                                                    void handleConfirm();
                                                }}
                                                onBack={() => setStep('slot')}
                                            />
                                        )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </SalonShell>
        </RouteGuard>
    );
}

function StepHeader({ step, onBack }: { step: Step; onBack?: () => void }) {
    const labels: Record<Step, string> = {
        service: 'Wybierz usługę',
        slot: 'Wybierz termin',
        confirm: 'Potwierdzenie',
    };
    const stepNr: Record<Step, number> = {
        service: 1,
        slot: 2,
        confirm: 3,
    };

    return (
        <div className="d-flex align-items-center gap-3 mb-4">
            {onBack && (
                <button
                    type="button"
                    className="btn btn-link p-0 text-muted"
                    onClick={onBack}
                    aria-label="Wróć"
                >
                    ←
                </button>
            )}
            <div>
                <p
                    className="text-muted mb-0"
                    style={{ fontSize: '0.75rem', letterSpacing: '0.08em' }}
                >
                    Krok {stepNr[step]} z 3
                </p>
                <h2 className="mb-0">{labels[step]}</h2>
            </div>
        </div>
    );
}

function ServiceStep({
    services,
    loading,
    error,
    onSelect,
}: {
    services: OnlineService[];
    loading: boolean;
    error: string;
    onSelect: (svc: OnlineService) => void;
}) {
    if (loading) {
        return <p className="text-muted">Ładowanie usług...</p>;
    }
    if (error) {
        return <p className="text-danger">{error}</p>;
    }
    if (services.length === 0) {
        return (
            <p className="text-muted">
                Brak usług dostępnych do rezerwacji online.
            </p>
        );
    }

    const byCategory = services.reduce<Record<string, OnlineService[]>>(
        (acc, svc) => {
            const cat = svc.category ?? 'Inne';
            if (!acc[cat]) acc[cat] = [];
            acc[cat].push(svc);
            return acc;
        },
        {},
    );

    return (
        <div className="d-flex flex-column gap-3">
            {Object.entries(byCategory).map(([cat, svcs]) => (
                <div key={cat}>
                    <p
                        className="text-muted mb-2"
                        style={{
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                        }}
                    >
                        {cat}
                    </p>
                    <div className="d-flex flex-column gap-2">
                        {svcs.map((svc) => (
                            <button
                                key={svc.id}
                                type="button"
                                className="d-flex justify-content-between align-items-center border rounded p-3 text-start w-100"
                                style={{
                                    cursor: 'pointer',
                                    transition: 'border-color 0.15s',
                                }}
                                onClick={() => onSelect(svc)}
                                onMouseEnter={(e) => {
                                    (
                                        e.currentTarget as HTMLButtonElement
                                    ).style.borderColor = 'var(--salon-brand)';
                                }}
                                onMouseLeave={(e) => {
                                    (
                                        e.currentTarget as HTMLButtonElement
                                    ).style.borderColor = '';
                                }}
                            >
                                <div>
                                    <strong className="d-block">
                                        {svc.name}
                                    </strong>
                                    {svc.description && (
                                        <span className="text-muted small">
                                            {svc.description}
                                        </span>
                                    )}
                                    <span className="text-muted small d-block">
                                        {svc.duration} min
                                    </span>
                                </div>
                                <span
                                    style={{
                                        color: 'var(--salon-accent)',
                                        fontWeight: 600,
                                        whiteSpace: 'nowrap',
                                        marginLeft: '1rem',
                                    }}
                                >
                                    {formatPrice(svc.price, svc.priceType)}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

function SlotStep({
    service,
    date,
    slots,
    loading,
    error,
    onDateChange,
    onSelect,
}: {
    service: OnlineService;
    date: string;
    slots: AvailableSlot[];
    loading: boolean;
    error: string;
    onDateChange: (date: string) => void;
    onSelect: (slot: AvailableSlot) => void;
}) {
    const slotsByEmployee = slots.reduce<Record<string, AvailableSlot[]>>(
        (acc, slot) => {
            if (!acc[slot.employeeName]) acc[slot.employeeName] = [];
            acc[slot.employeeName].push(slot);
            return acc;
        },
        {},
    );

    return (
        <div>
            <div className="border rounded p-3 mb-3">
                <strong>{service.name}</strong>
                <span className="text-muted ms-2">
                    {service.duration} min ·{' '}
                    {formatPrice(service.price, service.priceType)}
                </span>
            </div>

            <div className="mb-3">
                <label
                    className="form-label form-label-sm"
                    htmlFor="booking-date"
                >
                    Wybierz datę
                </label>
                <input
                    id="booking-date"
                    type="date"
                    className="form-control"
                    value={date}
                    min={todayISODate()}
                    onChange={(e) => onDateChange(e.target.value)}
                />
                {date && (
                    <p className="text-muted small mt-1">{formatDate(date)}</p>
                )}
            </div>

            {loading && (
                <p className="text-muted">Szukam wolnych terminów...</p>
            )}
            {error && <p className="text-danger">{error}</p>}

            {!loading && !error && slots.length === 0 && (
                <p className="text-muted">
                    Brak wolnych terminów w tym dniu. Wybierz inną datę.
                </p>
            )}

            {!loading && slots.length > 0 && (
                <div className="d-flex flex-column gap-3">
                    {Object.entries(slotsByEmployee).map(
                        ([employeeName, empSlots]) => (
                            <div key={employeeName}>
                                <p
                                    className="text-muted mb-2"
                                    style={{
                                        fontSize: '0.75rem',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.08em',
                                    }}
                                >
                                    {employeeName}
                                </p>
                                <div className="d-flex flex-wrap gap-2">
                                    {empSlots.map((slot) => (
                                        <button
                                            key={slot.time}
                                            type="button"
                                            className="btn btn-outline-secondary btn-sm"
                                            onClick={() => onSelect(slot)}
                                            style={{ minWidth: 64 }}
                                        >
                                            {formatTime(slot.time)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ),
                    )}
                </div>
            )}
        </div>
    );
}

function ConfirmStep({
    service,
    slot,
    submitting,
    error,
    onConfirm,
    onBack,
}: {
    service: OnlineService;
    slot: AvailableSlot;
    submitting: boolean;
    error: string;
    onConfirm: () => void;
    onBack: () => void;
}) {
    const appointmentDate = new Date(slot.time).toLocaleDateString('pl-PL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div>
            <div className="border rounded p-3 mb-4">
                <dl className="row mb-0">
                    <dt className="col-5 text-muted small fw-normal">Usługa</dt>
                    <dd className="col-7 mb-2">
                        <strong>{service.name}</strong>
                    </dd>

                    <dt className="col-5 text-muted small fw-normal">Cena</dt>
                    <dd className="col-7 mb-2">
                        {formatPrice(service.price, service.priceType)}
                    </dd>

                    <dt className="col-5 text-muted small fw-normal">
                        Czas trwania
                    </dt>
                    <dd className="col-7 mb-2">{service.duration} min</dd>

                    <dt className="col-5 text-muted small fw-normal">Data</dt>
                    <dd className="col-7 mb-2">{appointmentDate}</dd>

                    <dt className="col-5 text-muted small fw-normal">
                        Godzina
                    </dt>
                    <dd className="col-7 mb-2">{formatTime(slot.time)}</dd>

                    <dt className="col-5 text-muted small fw-normal">
                        Pracownik
                    </dt>
                    <dd className="col-7 mb-0">{slot.employeeName}</dd>
                </dl>
            </div>

            {error && <p className="text-danger mb-3">{error}</p>}

            <div className="d-flex gap-2">
                <button
                    type="button"
                    className="btn btn-salon flex-fill"
                    onClick={onConfirm}
                    disabled={submitting}
                >
                    {submitting ? 'Rezerwuję...' : 'Potwierdź rezerwację'}
                </button>
                <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={onBack}
                    disabled={submitting}
                >
                    Wróć
                </button>
            </div>
        </div>
    );
}

function SuccessScreen({
    appointmentId,
    service,
    slot,
    onNew,
    onHistory,
}: {
    appointmentId: number | null;
    service: OnlineService | null;
    slot: AvailableSlot | null;
    onNew: () => void;
    onHistory: () => void;
}) {
    return (
        <div className="text-center py-4">
            <div
                style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'var(--salon-brand)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                    fontSize: '1.5rem',
                }}
            >
                ✓
            </div>
            <h2 className="mb-1">Wizyta zarezerwowana!</h2>
            {service && slot && (
                <p className="text-muted mb-0">
                    {service.name} ·{' '}
                    {new Date(slot.time).toLocaleDateString('pl-PL', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'long',
                    })}{' '}
                    o {formatTime(slot.time)}
                </p>
            )}
            {appointmentId && (
                <p
                    className="text-muted small mb-4"
                    style={{ fontSize: '0.75rem' }}
                >
                    Nr rezerwacji: #{appointmentId}
                </p>
            )}
            <div className="d-flex gap-2 justify-content-center">
                <button type="button" className="btn btn-salon" onClick={onNew}>
                    Zarezerwuj kolejną
                </button>
                <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={onHistory}
                >
                    Moje wizyty
                </button>
            </div>
        </div>
    );
}

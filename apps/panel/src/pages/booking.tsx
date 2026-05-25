import { useState, useEffect, useCallback, Fragment } from 'react';
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
            setSlotsLoading(true);
            setSlotsError('');
            setSelectedSlot(null);
            apiFetch<AvailableSlot[]>(
                `/calendar/available-slots?serviceId=${svcId}&date=${date}`,
            )
                .then(setSlots)
                .catch(() => {
                    setSlotsError(
                        'Nie udało się załadować dostępnych terminów.',
                    );
                })
                .finally(() => setSlotsLoading(false));
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


    return (
        <RouteGuard roles={['client']}>
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
    const steps: { key: Step; label: string }[] = [
        { key: 'service', label: 'Usługa' },
        { key: 'slot', label: 'Termin' },
        { key: 'confirm', label: 'Potwierdzenie' },
    ];
    const currentIdx = steps.findIndex((s) => s.key === step);

    return (
        <div className="mb-4">
            <div className="salonbw-steps mb-3">
                {steps.map((s, i) => (
                    <Fragment key={s.key}>
                        <div
                            className={`salonbw-step${s.key === step ? ' active' : ''}`}
                        >
                            <span className="salonbw-step__number">
                                {i + 1}
                            </span>
                            <span className="salonbw-step__label">
                                {s.label}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div className="salonbw-step__divider" />
                        )}
                    </Fragment>
                ))}
            </div>
            {onBack && (
                <button
                    type="button"
                    className="btn btn-link p-0 text-muted small"
                    onClick={onBack}
                >
                    ← Wróć
                </button>
            )}
            {currentIdx === 0 && <h2 className="mb-0">Wybierz usługę</h2>}
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
                    <p className="booking-category-label">{cat}</p>
                    <div className="d-flex flex-column gap-2">
                        {svcs.map((svc) => (
                            <button
                                key={svc.id}
                                type="button"
                                className="booking-service-card"
                                onClick={() => onSelect(svc)}
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
                                <span className="booking-service-price">
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
            <div className="border rounded bg-white p-3 mb-3">
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
                                <p className="booking-category-label">
                                    {employeeName}
                                </p>
                                <div className="d-flex flex-wrap gap-2">
                                    {empSlots.map((slot) => (
                                        <button
                                            key={slot.time}
                                            type="button"
                                            className="btn btn-outline-secondary btn-sm booking-slot-btn"
                                            onClick={() => onSelect(slot)}
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
            <div className="border rounded bg-white p-3 mb-4">
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
            <div className="booking-success-icon">✓</div>
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

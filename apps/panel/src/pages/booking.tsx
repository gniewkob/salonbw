import { useState, useEffect, useCallback, useRef, Fragment } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
    CheckIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
} from '@heroicons/react/20/solid';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import { useAuth } from '@/contexts/AuthContext';
import Skeleton from '@/components/ui/Skeleton';

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

function addDaysISO(dateStr: string, days: number): string {
    const d = new Date(`${dateStr}T00:00:00`);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

type Step = 'service' | 'slot' | 'confirm';

export default function BookingPage() {
    const { role, apiFetch } = useAuth();
    const router = useRouter();

    const [step, setStep] = useState<Step>('service');
    const [services, setServices] = useState<OnlineService[]>([]);
    const [servicesLoading, setServicesLoading] = useState(true);
    const [servicesError, setServicesError] = useState('');
    const [servicesNotice, setServicesNotice] = useState('');

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
    const [note, setNote] = useState('');
    const [createdAppointmentId, setCreatedAppointmentId] = useState<
        number | null
    >(null);

    // Weekdays (0=Sun..6=Sat) the salon is closed — disables them in the
    // calendar day-picker so the client can't land on a closed day.
    const [closedWeekdays, setClosedWeekdays] = useState<Set<number>>(
        new Set(),
    );
    useEffect(() => {
        apiFetch<{ hours?: Record<string, unknown[]> }>(
            '/calendar/opening-hours',
        )
            .then((payload) => {
                const hours = payload?.hours;
                if (!hours) return;
                const order = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
                const closed = new Set<number>();
                order.forEach((key, dow) => {
                    if ((hours[key]?.length ?? 0) === 0) closed.add(dow);
                });
                setClosedWeekdays(closed);
            })
            .catch(() => {
                /* non-fatal: all days remain selectable */
            });
    }, [apiFetch]);

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
                    } else {
                        setServicesNotice(
                            'Usługa z linku nie jest dostępna do rezerwacji online. Wybierz inną z listy.',
                        );
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
                    ...(note.trim() ? { notes: note.trim() } : {}),
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
            <Head>
                <title>Zarezerwuj wizytę — Salon Black &amp; White</title>
            </Head>
            <SalonShell role={role}>
                <div className="salon-section">
                    <div className="salon-column-row">
                        <div className="salon-column booking-column">
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
                                            notice={servicesNotice}
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
                                            closedWeekdays={closedWeekdays}
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
                                                note={note}
                                                onNoteChange={setNote}
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

const STEP_DEFINITIONS: {
    key: Step;
    label: string;
    heading: string;
    backLabel: string;
}[] = [
    {
        key: 'service',
        label: 'Usługa',
        heading: 'Wybierz usługę',
        backLabel: '',
    },
    {
        key: 'slot',
        label: 'Termin',
        heading: 'Wybierz termin',
        backLabel: 'Wybór usługi',
    },
    {
        key: 'confirm',
        label: 'Potwierdzenie',
        heading: 'Potwierdź rezerwację',
        backLabel: 'Wybór terminu',
    },
];

function StepHeader({ step, onBack }: { step: Step; onBack?: () => void }) {
    const current = STEP_DEFINITIONS.find((s) => s.key === step)!;

    return (
        <div className="mb-4">
            <ol className="salonbw-steps mb-3" aria-label="Kroki rezerwacji">
                {STEP_DEFINITIONS.map((s, i) => {
                    const isActive = s.key === step;
                    return (
                        <Fragment key={s.key}>
                            <li
                                className={`salonbw-step${isActive ? ' active' : ''}`}
                                aria-current={isActive ? 'step' : undefined}
                            >
                                <span
                                    className="salonbw-step__number"
                                    aria-hidden="true"
                                >
                                    {i + 1}
                                </span>
                                <span className="salonbw-step__label">
                                    {s.label}
                                </span>
                            </li>
                            {i < STEP_DEFINITIONS.length - 1 && (
                                <li
                                    className="salonbw-step__divider"
                                    aria-hidden="true"
                                />
                            )}
                        </Fragment>
                    );
                })}
            </ol>
            {onBack && (
                <button
                    type="button"
                    className="btn btn-link booking-back-link text-muted small"
                    onClick={onBack}
                >
                    <ChevronLeftIcon aria-hidden="true" />
                    {current.backLabel}
                </button>
            )}
            <h2 className="mb-0">{current.heading}</h2>
        </div>
    );
}

function ServiceStep({
    services,
    loading,
    error,
    notice,
    onSelect,
}: {
    services: OnlineService[];
    loading: boolean;
    error: string;
    notice: string;
    onSelect: (svc: OnlineService) => void;
}) {
    const [activeCat, setActiveCat] = useState<string>('all');
    if (loading) {
        return (
            <div
                role="status"
                aria-live="polite"
                aria-label="Ładowanie listy usług"
                className="d-flex flex-column gap-2"
            >
                {[0, 1, 2, 3, 4].map((index) => (
                    <div
                        key={index}
                        className="booking-service-card"
                        style={{ pointerEvents: 'none' }}
                    >
                        <div className="d-flex flex-column gap-2 w-100">
                            <Skeleton width="55%" height={18} />
                            <Skeleton width="80%" height={14} />
                            <Skeleton width={70} height={14} />
                        </div>
                        <Skeleton width={70} height={20} />
                    </div>
                ))}
                <span className="visually-hidden">Ładowanie usług...</span>
            </div>
        );
    }
    if (error) {
        return (
            <p className="text-danger" role="alert">
                {error}
            </p>
        );
    }
    if (services.length === 0) {
        return (
            <p className="text-muted">
                Brak usług dostępnych do rezerwacji online.
            </p>
        );
    }

    const categoryNames = Array.from(
        new Set(services.map((s) => s.category ?? 'Inne')),
    );
    const hasFilter = categoryNames.length > 1;
    const visible =
        hasFilter && activeCat !== 'all'
            ? services.filter((s) => (s.category ?? 'Inne') === activeCat)
            : services;
    const byCategory = visible.reduce<Record<string, OnlineService[]>>(
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
            {notice && (
                <div className="booking-notice" role="status">
                    {notice}
                </div>
            )}
            {hasFilter && (
                <div
                    className="booking-cat-filter"
                    role="group"
                    aria-label="Filtr kategorii"
                >
                    <button
                        type="button"
                        className={`booking-cat-chip${activeCat === 'all' ? ' is-active' : ''}`}
                        aria-pressed={activeCat === 'all'}
                        onClick={() => setActiveCat('all')}
                    >
                        Wszystkie
                    </button>
                    {categoryNames.map((cat) => (
                        <button
                            key={cat}
                            type="button"
                            className={`booking-cat-chip${activeCat === cat ? ' is-active' : ''}`}
                            aria-pressed={activeCat === cat}
                            onClick={() => setActiveCat(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}
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
                                    {svc.description &&
                                        svc.description.trim() !==
                                            svc.name.trim() && (
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
    closedWeekdays,
    onDateChange,
    onSelect,
}: {
    service: OnlineService;
    date: string;
    slots: AvailableSlot[];
    loading: boolean;
    error: string;
    closedWeekdays: Set<number>;
    onDateChange: (date: string) => void;
    onSelect: (slot: AvailableSlot) => void;
}) {
    const [dateView, setDateView] = useState<'list' | 'calendar'>('list');
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
                <div className="d-flex align-items-center justify-content-between mb-2">
                    <label
                        className="form-label form-label-sm mb-0"
                        htmlFor="booking-date"
                    >
                        Wybierz datę
                    </label>
                    <div
                        className="btn-group btn-group-sm"
                        role="group"
                        aria-label="Widok wyboru daty"
                    >
                        <button
                            type="button"
                            className={`btn ${dateView === 'list' ? 'btn-dark' : 'btn-outline-dark'}`}
                            aria-pressed={dateView === 'list'}
                            onClick={() => setDateView('list')}
                        >
                            Lista
                        </button>
                        <button
                            type="button"
                            className={`btn ${dateView === 'calendar' ? 'btn-dark' : 'btn-outline-dark'}`}
                            aria-pressed={dateView === 'calendar'}
                            onClick={() => setDateView('calendar')}
                        >
                            Kalendarz
                        </button>
                    </div>
                </div>
                {dateView === 'list' ? (
                    <input
                        id="booking-date"
                        type="date"
                        className="form-control"
                        value={date}
                        min={todayISODate()}
                        onChange={(e) => onDateChange(e.target.value)}
                        aria-describedby={
                            date ? 'booking-date-hint' : undefined
                        }
                    />
                ) : (
                    <MonthCalendarPicker
                        selectedDate={date}
                        closedWeekdays={closedWeekdays}
                        onPick={onDateChange}
                    />
                )}
                {date && (
                    <p id="booking-date-hint" className="text-muted small mt-1">
                        {formatDate(date)}
                    </p>
                )}
            </div>

            {loading && (
                <>
                    <p
                        className="text-muted visually-hidden"
                        role="status"
                        aria-live="polite"
                    >
                        Szukam wolnych terminów...
                    </p>
                    <div className="booking-slot-skeleton" aria-hidden="true">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div
                                key={i}
                                className="booking-slot-skeleton__chip"
                            />
                        ))}
                    </div>
                </>
            )}
            {error && (
                <p className="text-danger" role="alert">
                    {error}
                </p>
            )}

            {!loading && !error && slots.length === 0 && (
                <div>
                    <p className="text-muted mb-3">
                        Brak wolnych terminów w tym dniu. Wybierz inną datę.
                    </p>
                    <DayStepper date={date} onDateChange={onDateChange} />
                </div>
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

function DayStepper({
    date,
    onDateChange,
}: {
    date: string;
    onDateChange: (d: string) => void;
}) {
    const today = todayISODate();
    const prevDate = addDaysISO(date, -1);
    const nextDate = addDaysISO(date, 1);
    const canGoBack = prevDate >= today;

    return (
        <div className="d-flex gap-2">
            <button
                type="button"
                className="btn btn-outline-secondary"
                disabled={!canGoBack}
                onClick={() => onDateChange(prevDate)}
            >
                <ChevronLeftIcon
                    aria-hidden="true"
                    style={{ width: 16, height: 16 }}
                />
                {' Poprzedni dzień'}
            </button>
            <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => onDateChange(nextDate)}
            >
                {'Następny dzień '}
                <ChevronRightIcon
                    aria-hidden="true"
                    style={{ width: 16, height: 16 }}
                />
            </button>
        </div>
    );
}

const WEEKDAY_LABELS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];

function MonthCalendarPicker({
    selectedDate,
    closedWeekdays,
    onPick,
}: {
    selectedDate: string;
    closedWeekdays: Set<number>;
    onPick: (iso: string) => void;
}) {
    const today = todayISODate();
    const [viewMonth, setViewMonth] = useState(() => {
        const base = new Date(`${selectedDate || today}T00:00:00`);
        return new Date(base.getFullYear(), base.getMonth(), 1);
    });

    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const monthLabel = viewMonth.toLocaleDateString('pl-PL', {
        month: 'long',
        year: 'numeric',
    });

    // Monday-first grid: leading blanks before the 1st, then each day.
    const firstDow = new Date(year, month, 1).getDay(); // 0=Sun..6=Sat
    const leading = (firstDow + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < leading; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
        const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(
            d,
        ).padStart(2, '0')}`;
        cells.push(iso);
    }

    return (
        <div className="border rounded p-2 bg-white">
            <div className="d-flex align-items-center justify-content-between mb-2">
                <button
                    type="button"
                    className="btn btn-sm btn-outline-dark"
                    aria-label="Poprzedni miesiąc"
                    onClick={() => setViewMonth(new Date(year, month - 1, 1))}
                >
                    ‹
                </button>
                <strong
                    className="text-capitalize"
                    style={{ fontSize: '0.95rem' }}
                >
                    {monthLabel}
                </strong>
                <button
                    type="button"
                    className="btn btn-sm btn-outline-dark"
                    aria-label="Następny miesiąc"
                    onClick={() => setViewMonth(new Date(year, month + 1, 1))}
                >
                    ›
                </button>
            </div>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gap: 4,
                    textAlign: 'center',
                }}
            >
                {WEEKDAY_LABELS.map((w) => (
                    <div
                        key={w}
                        className="text-muted"
                        style={{ fontSize: '0.7rem', fontWeight: 600 }}
                    >
                        {w}
                    </div>
                ))}
                {cells.map((iso, i) => {
                    if (!iso) return <div key={`empty-${i}`} />;
                    const dow = new Date(`${iso}T00:00:00`).getDay();
                    const isPast = iso < today;
                    const isClosed = closedWeekdays.has(dow);
                    const disabled = isPast || isClosed;
                    const isSelected = iso === selectedDate;
                    return (
                        <button
                            key={iso}
                            type="button"
                            disabled={disabled}
                            aria-pressed={isSelected}
                            aria-label={`${Number(iso.slice(8, 10))} ${monthLabel}${isClosed ? ' (zamknięte)' : ''}`}
                            onClick={() => onPick(iso)}
                            className="btn btn-sm p-0"
                            style={{
                                minHeight: 36,
                                borderRadius: 4,
                                background: isSelected
                                    ? '#0d0d0d'
                                    : 'transparent',
                                color: isSelected
                                    ? '#fff'
                                    : disabled
                                      ? '#c4c8ce'
                                      : '#1a1a1a',
                                border: `1px solid ${isSelected ? '#0d0d0d' : 'transparent'}`,
                                cursor: disabled ? 'not-allowed' : 'pointer',
                                textDecoration:
                                    isClosed && !isPast
                                        ? 'line-through'
                                        : undefined,
                            }}
                        >
                            {Number(iso.slice(8, 10))}
                        </button>
                    );
                })}
            </div>
            <p className="text-muted mt-2 mb-0" style={{ fontSize: '0.7rem' }}>
                Dni wyszarzone / przekreślone są niedostępne.
            </p>
        </div>
    );
}

function ConfirmStep({
    service,
    slot,
    submitting,
    error,
    note,
    onNoteChange,
    onConfirm,
    onBack,
}: {
    service: OnlineService;
    slot: AvailableSlot;
    submitting: boolean;
    error: string;
    note: string;
    onNoteChange: (value: string) => void;
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

            <div className="mb-4">
                <label
                    htmlFor="booking-note"
                    className="form-label text-muted small fw-normal"
                >
                    Uwagi do wizyty (opcjonalnie)
                </label>
                <textarea
                    id="booking-note"
                    className="form-control"
                    rows={3}
                    maxLength={1000}
                    placeholder="Np. preferencje, alergie, informacje dla fryzjera…"
                    value={note}
                    onChange={(e) => onNoteChange(e.target.value)}
                    disabled={submitting}
                />
            </div>

            {error && (
                <p className="text-danger mb-3" role="alert">
                    {error}
                </p>
            )}

            <div className="d-flex gap-2">
                <button
                    type="button"
                    className="btn btn-salon flex-fill"
                    onClick={onConfirm}
                    disabled={submitting}
                    aria-busy={submitting}
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
    const headingRef = useRef<HTMLHeadingElement>(null);
    useEffect(() => {
        headingRef.current?.focus();
    }, []);

    return (
        <div className="text-center py-4" role="status" aria-live="polite">
            <div className="booking-success-icon" aria-hidden="true">
                <CheckIcon />
            </div>
            <h2 ref={headingRef} tabIndex={-1} className="mb-1">
                Wizyta zarezerwowana!
            </h2>
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

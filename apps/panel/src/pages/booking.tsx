import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import BookingStepHeader, {
    type BookingStepDefinition,
} from '@/components/booking/BookingStepHeader';
import { toISODateLocal, todayISODate } from '@/utils/date';

interface OnlineService {
    id: number;
    name: string;
    duration: number;
    price: number;
    priceType: string;
    description?: string;
    category?: string;
    variants?: OnlineServiceVariant[];
    syntheticVariantSourceIds?: number[];
}

interface OnlineServiceVariant {
    id: number;
    name: string;
    description?: string;
    duration: number;
    price: number;
    priceType: string;
    isActive?: boolean;
    sortOrder?: number;
    sourceServiceId?: number;
    sourceServiceName?: string;
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

function getActiveVariants(service: OnlineService | null) {
    return [...(service?.variants ?? [])]
        .filter((variant) => variant.isActive !== false)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

function getPrimaryDuration(
    service: OnlineService,
    variant: OnlineServiceVariant | null,
) {
    return variant?.duration ?? service.duration;
}

function getTotalDuration(
    service: OnlineService,
    variant: OnlineServiceVariant | null,
    addons: OnlineService[],
) {
    return (
        getPrimaryDuration(service, variant) +
        addons.reduce((sum, addon) => sum + addon.duration, 0)
    );
}

function getBookingPrice(
    service: OnlineService,
    variant: OnlineServiceVariant | null,
    addons: OnlineService[],
) {
    const basePrice = Number(variant?.price ?? service.price);
    const total =
        basePrice + addons.reduce((sum, addon) => sum + Number(addon.price), 0);
    const hasFrom =
        (variant?.priceType ?? service.priceType) === 'from' ||
        addons.some((addon) => addon.priceType === 'from');
    return formatPrice(total, hasFrom ? 'from' : 'fixed');
}

function isLikelyAddon(service: OnlineService) {
    const text = `${service.name} ${service.category ?? ''} ${
        service.description ?? ''
    }`.toLocaleLowerCase('pl-PL');
    return [
        'pielęgn',
        'pielegn',
        'regener',
        'odżyw',
        'odzyw',
        'ampuł',
        'ampul',
        'botoks',
        'kuracja',
        'zabieg',
    ].some((needle) => text.includes(needle));
}

function parseFlatVariantName(service: OnlineService) {
    const [baseName, ...variantParts] = service.name
        .split(/\s+[–-]\s+/)
        .map((part) => part.trim())
        .filter(Boolean);
    const variantName = variantParts.join(' – ');

    if (!baseName || !variantName) return null;

    const variantText = variantName.toLocaleLowerCase('pl-PL');
    const looksLikeVariant = [
        'włos',
        'wlos',
        'krótk',
        'krotk',
        'śred',
        'sred',
        'dług',
        'dlug',
        'pasa',
    ].some((needle) => variantText.includes(needle));

    return looksLikeVariant ? { baseName, variantName } : null;
}

function normalizeServicesForBooking(services: OnlineService[]) {
    const directServices: Array<{ service: OnlineService; index: number }> = [];
    const flatGroups = new Map<
        string,
        {
            baseName: string;
            category?: string;
            items: Array<{
                service: OnlineService;
                variantName: string;
                index: number;
            }>;
        }
    >();

    services.forEach((service, index) => {
        if (getActiveVariants(service).length > 0) {
            directServices.push({ service, index });
            return;
        }

        const parsed = parseFlatVariantName(service);
        if (!parsed) {
            directServices.push({ service, index });
            return;
        }

        const key = `${service.category ?? 'Inne'}::${parsed.baseName.toLocaleLowerCase('pl-PL')}`;
        const group =
            flatGroups.get(key) ??
            ({
                baseName: parsed.baseName,
                category: service.category,
                items: [],
            } satisfies {
                baseName: string;
                category?: string;
                items: Array<{
                    service: OnlineService;
                    variantName: string;
                    index: number;
                }>;
            });
        group.items.push({
            service,
            variantName: parsed.variantName,
            index,
        });
        flatGroups.set(key, group);
    });

    const normalizedGroups = Array.from(flatGroups.values()).flatMap(
        (group) => {
            if (group.items.length < 2) {
                return group.items.map(({ service, index }) => ({
                    service,
                    index,
                }));
            }

            const sortedItems = [...group.items].sort(
                (a, b) => a.index - b.index,
            );
            const representative = sortedItems[0].service;
            const lowestPrice = Math.min(
                ...sortedItems.map(({ service }) => Number(service.price)),
            );
            const shortestDuration = Math.min(
                ...sortedItems.map(({ service }) => service.duration),
            );
            const hasDifferentPrices =
                new Set(sortedItems.map(({ service }) => Number(service.price)))
                    .size > 1;

            return [
                {
                    index: sortedItems[0].index,
                    service: {
                        ...representative,
                        name: group.baseName,
                        description:
                            representative.description &&
                            representative.description !== representative.name
                                ? representative.description
                                : undefined,
                        duration: shortestDuration,
                        price: lowestPrice,
                        priceType:
                            hasDifferentPrices ||
                            sortedItems.some(
                                ({ service }) => service.priceType === 'from',
                            )
                                ? 'from'
                                : representative.priceType,
                        category: group.category,
                        syntheticVariantSourceIds: sortedItems.map(
                            ({ service }) => service.id,
                        ),
                        variants: sortedItems.map(
                            ({ service, variantName, index }) => ({
                                id: service.id,
                                name: variantName,
                                description:
                                    service.description &&
                                    service.description !== service.name
                                        ? service.description
                                        : undefined,
                                duration: service.duration,
                                price: service.price,
                                priceType: service.priceType,
                                isActive: true,
                                sortOrder: index,
                                sourceServiceId: service.id,
                                sourceServiceName: service.name,
                            }),
                        ),
                    },
                },
            ];
        },
    );

    return [...directServices, ...normalizedGroups]
        .sort((a, b) => a.index - b.index)
        .map(({ service }) => service);
}

function findPreselectedService(
    services: OnlineService[],
    serviceId: number,
): { service: OnlineService; variant: OnlineServiceVariant | null } | null {
    for (const service of services) {
        const variant = getActiveVariants(service).find(
            (item) => item.sourceServiceId === serviceId,
        );
        if (variant) return { service, variant };
        if (service.id === serviceId) {
            return { service, variant: null };
        }
    }

    return null;
}

function getBookingServiceId(
    service: OnlineService,
    variant: OnlineServiceVariant | null,
) {
    return variant?.sourceServiceId ?? service.id;
}

function getBookingServiceVariantId(variant: OnlineServiceVariant | null) {
    return variant?.sourceServiceId ? undefined : variant?.id;
}

function getPrimaryServiceSourceIds(service: OnlineService) {
    return new Set([
        service.id,
        ...(service.syntheticVariantSourceIds ?? []),
        ...getActiveVariants(service)
            .map((variant) => variant.sourceServiceId)
            .filter((id): id is number => typeof id === 'number'),
    ]);
}

// Format a Date as YYYY-MM-DD in LOCAL time. Using toISOString() here is a
// bug: it converts local midnight to UTC, so in a UTC+ timezone (e.g. Poland
// in summer) it yields the previous calendar day — which made "today" wrong
// after midnight and cancelled the day-stepper's +1/-1.

function addDaysISO(dateStr: string, days: number): string {
    const d = new Date(`${dateStr}T00:00:00`);
    d.setDate(d.getDate() + days);
    return toISODateLocal(d);
}

type Step = 'service' | 'variant' | 'addons' | 'slot' | 'confirm';

export default function BookingPage() {
    const { user, role, apiFetch } = useAuth();
    const router = useRouter();

    const [step, setStep] = useState<Step>('service');
    const [services, setServices] = useState<OnlineService[]>([]);
    const [servicesLoading, setServicesLoading] = useState(true);
    const [servicesError, setServicesError] = useState('');
    const [servicesNotice, setServicesNotice] = useState('');

    const [selectedService, setSelectedService] =
        useState<OnlineService | null>(null);
    const [selectedVariant, setSelectedVariant] =
        useState<OnlineServiceVariant | null>(null);
    const [selectedAddons, setSelectedAddons] = useState<OnlineService[]>([]);

    const [selectedDate, setSelectedDate] = useState(todayISODate());
    const [slots, setSlots] = useState<AvailableSlot[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [slotsError, setSlotsError] = useState('');
    const [slotsNotice, setSlotsNotice] = useState('');
    const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(
        null,
    );

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [note, setNote] = useState('');
    const [assistanceNote, setAssistanceNote] = useState('');
    const [assistanceLoading, setAssistanceLoading] = useState(false);
    const [assistanceError, setAssistanceError] = useState('');
    const [assistanceSent, setAssistanceSent] = useState(false);
    const [createdAppointmentId, setCreatedAppointmentId] = useState<
        number | null
    >(null);
    const autoNearestDateRef = useRef<string | null>(null);
    const bookingServices = useMemo(
        () => normalizeServicesForBooking(services),
        [services],
    );

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
                    const preSelected = findPreselectedService(
                        normalizeServicesForBooking(data),
                        Number(serviceIdParam),
                    );
                    if (preSelected) {
                        setSelectedService(preSelected.service);
                        setSelectedVariant(preSelected.variant);
                        setSelectedAddons([]);
                        setStep(
                            preSelected.variant
                                ? 'addons'
                                : getActiveVariants(preSelected.service)
                                        .length > 0
                                  ? 'variant'
                                  : 'addons',
                        );
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

    const fetchSlots = useCallback(
        async (
            date: string,
            svcId: number,
            variantId?: number,
            addonIds: number[] = [],
        ) => {
            const params = new URLSearchParams({
                serviceId: String(svcId),
                date,
            });
            if (variantId) params.set('serviceVariantId', String(variantId));
            if (addonIds.length > 0) {
                params.set('addonServiceIds', addonIds.join(','));
            }
            const data = await apiFetch<AvailableSlot[]>(
                `/calendar/available-slots?${params}`,
            );
            return [...data].sort(
                (a, b) =>
                    new Date(a.time).getTime() - new Date(b.time).getTime(),
            );
        },
        [apiFetch],
    );

    const loadSlots = useCallback(
        async (
            date: string,
            svcId: number,
            variantId?: number,
            addonIds: number[] = [],
            autoNearest = false,
        ) => {
            const autoNearestRefresh =
                autoNearest && autoNearestDateRef.current === date;
            setSlotsLoading(true);
            setSlotsError('');
            if (!autoNearestRefresh) {
                setSlotsNotice('');
            }
            setSelectedSlot(null);
            try {
                const initialSlots = await fetchSlots(
                    date,
                    svcId,
                    variantId,
                    addonIds,
                );
                if (initialSlots.length > 0 || !autoNearest) {
                    if (autoNearestRefresh) {
                        setSlotsNotice(
                            'Pokazujemy najbliższy wolny termin dla wybranej długości wizyty.',
                        );
                        autoNearestDateRef.current = null;
                    }
                    setSlots(initialSlots);
                    return;
                }

                const SCAN_DAYS = 45;
                for (let offset = 1; offset <= SCAN_DAYS; offset++) {
                    const candidateDate = addDaysISO(date, offset);
                    const dow = new Date(`${candidateDate}T00:00:00`).getDay();
                    if (closedWeekdays.has(dow)) continue;

                    const candidateSlots = await fetchSlots(
                        candidateDate,
                        svcId,
                        variantId,
                        addonIds,
                    );
                    if (candidateSlots.length > 0) {
                        autoNearestDateRef.current = candidateDate;
                        setSelectedDate(candidateDate);
                        setSlots(candidateSlots);
                        setSlotsNotice(
                            'Pokazujemy najbliższy wolny termin dla wybranej długości wizyty.',
                        );
                        return;
                    }
                }

                setSlots([]);
                setSlotsNotice(
                    'Nie znaleźliśmy wolnego terminu w najbliższych 45 dniach dla wybranej długości wizyty.',
                );
            } catch {
                autoNearestDateRef.current = null;
                setSlotsError('Nie udało się załadować dostępnych terminów.');
            } finally {
                setSlotsLoading(false);
            }
        },
        [closedWeekdays, fetchSlots],
    );

    useEffect(() => {
        if (step === 'slot' && selectedService) {
            void loadSlots(
                selectedDate,
                getBookingServiceId(selectedService, selectedVariant),
                getBookingServiceVariantId(selectedVariant),
                selectedAddons.map((addon) => addon.id),
                true,
            );
        }
    }, [
        step,
        selectedDate,
        selectedService,
        selectedVariant,
        selectedAddons,
        loadSlots,
    ]);

    const handleSelectService = (svc: OnlineService) => {
        setSelectedService(svc);
        setSelectedVariant(null);
        setSelectedAddons([]);
        setSelectedSlot(null);
        setAssistanceNote('');
        setAssistanceError('');
        setAssistanceSent(false);
        autoNearestDateRef.current = null;
        setSelectedDate(todayISODate());
        setStep(getActiveVariants(svc).length > 0 ? 'variant' : 'addons');
    };

    const handleSelectVariant = (variant: OnlineServiceVariant) => {
        setSelectedVariant(variant);
        setSelectedSlot(null);
        setStep('addons');
    };

    const handleToggleAddon = (addon: OnlineService) => {
        setSelectedAddons((current) =>
            current.some((item) => item.id === addon.id)
                ? current.filter((item) => item.id !== addon.id)
                : [...current, addon],
        );
    };

    const handleSelectSlot = (slot: AvailableSlot) => {
        setSelectedSlot(slot);
        setStep('confirm');
    };

    const handleDateChange = (date: string) => {
        setSelectedDate(date);
        if (selectedService) {
            autoNearestDateRef.current = null;
            void loadSlots(
                date,
                getBookingServiceId(selectedService, selectedVariant),
                getBookingServiceVariantId(selectedVariant),
                selectedAddons.map((addon) => addon.id),
                false,
            );
        }
    };

    const handleConfirm = async () => {
        if (!selectedService || !selectedSlot) return;
        const serviceVariantId = getBookingServiceVariantId(selectedVariant);
        setSubmitting(true);
        setSubmitError('');
        try {
            const result = await apiFetch<{ id: number }>('/appointments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    serviceId: getBookingServiceId(
                        selectedService,
                        selectedVariant,
                    ),
                    ...(serviceVariantId ? { serviceVariantId } : {}),
                    ...(selectedAddons.length > 0
                        ? {
                              addonServiceIds: selectedAddons.map(
                                  (addon) => addon.id,
                              ),
                          }
                        : {}),
                    employeeId: selectedSlot.employeeId,
                    startTime: selectedSlot.time,
                    reservedOnline: role === 'client',
                    ...(note.trim() ? { clientComment: note.trim() } : {}),
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

    const handleRequestAssistance = async () => {
        if (!selectedService || !user?.email) {
            setAssistanceError(
                'Nie możemy wysłać prośby bez adresu email klienta.',
            );
            return;
        }
        setAssistanceLoading(true);
        setAssistanceError('');
        try {
            const addonsText =
                selectedAddons.length > 0
                    ? selectedAddons.map((addon) => addon.name).join(', ')
                    : 'brak';
            const message = [
                'Klient prosi o pomoc w znalezieniu dogodnego terminu.',
                `Klient: ${user.name}`,
                `Email: ${user.email}`,
                user.phone ? `Telefon: ${user.phone}` : null,
                `Usługa: ${selectedService.name}`,
                selectedVariant ? `Wariant: ${selectedVariant.name}` : null,
                `Dodatki: ${addonsText}`,
                `Łączny czas wizyty: ${getTotalDuration(
                    selectedService,
                    selectedVariant,
                    selectedAddons,
                )} min`,
                `Ostatnio oglądana data: ${formatDate(selectedDate)}`,
                assistanceNote.trim()
                    ? `Preferencje klienta: ${assistanceNote.trim()}`
                    : null,
            ]
                .filter(Boolean)
                .join('\n');

            await apiFetch('/emails/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: user.name,
                    replyTo: user.email,
                    message,
                }),
            });
            setAssistanceSent(true);
            setAssistanceNote('');
        } catch (err: unknown) {
            setAssistanceError(
                err instanceof Error
                    ? err.message
                    : 'Nie udało się wysłać prośby. Spróbuj ponownie.',
            );
        } finally {
            setAssistanceLoading(false);
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
                                    variant={selectedVariant}
                                    addons={selectedAddons}
                                    slot={selectedSlot}
                                    onNew={() => {
                                        setStep('service');
                                        setSelectedService(null);
                                        setSelectedVariant(null);
                                        setSelectedAddons([]);
                                        setSelectedSlot(null);
                                        setSubmitted(false);
                                        setCreatedAppointmentId(null);
                                    }}
                                    onHistory={() =>
                                        // Clients can't access /calendar (staff-only,
                                        // RouteGuard nav:calendar → 403). Their visit
                                        // history lives on the client dashboard.
                                        void router.push('/dashboard')
                                    }
                                />
                            ) : (
                                <>
                                    <StepHeader
                                        step={step}
                                        onBack={
                                            step === 'variant'
                                                ? () => setStep('service')
                                                : step === 'addons'
                                                  ? () =>
                                                        setStep(
                                                            getActiveVariants(
                                                                selectedService,
                                                            ).length > 0
                                                                ? 'variant'
                                                                : 'service',
                                                        )
                                                  : step === 'slot'
                                                    ? () => setStep('addons')
                                                    : step === 'confirm'
                                                      ? () => setStep('slot')
                                                      : undefined
                                        }
                                    />

                                    {step === 'service' && (
                                        <ServiceStep
                                            services={bookingServices}
                                            loading={servicesLoading}
                                            error={servicesError}
                                            notice={servicesNotice}
                                            onSelect={handleSelectService}
                                        />
                                    )}

                                    {step === 'variant' && selectedService && (
                                        <VariantStep
                                            service={selectedService}
                                            onSelect={handleSelectVariant}
                                        />
                                    )}

                                    {step === 'addons' && selectedService && (
                                        <AddonStep
                                            service={selectedService}
                                            variant={selectedVariant}
                                            services={services}
                                            selectedAddons={selectedAddons}
                                            onToggle={handleToggleAddon}
                                            onContinue={() => setStep('slot')}
                                        />
                                    )}

                                    {step === 'slot' && selectedService && (
                                        <SlotStep
                                            service={selectedService}
                                            variant={selectedVariant}
                                            addons={selectedAddons}
                                            date={selectedDate}
                                            slots={slots}
                                            loading={slotsLoading}
                                            error={slotsError}
                                            notice={slotsNotice}
                                            assistanceNote={assistanceNote}
                                            assistanceLoading={
                                                assistanceLoading
                                            }
                                            assistanceError={assistanceError}
                                            assistanceSent={assistanceSent}
                                            closedWeekdays={closedWeekdays}
                                            onDateChange={handleDateChange}
                                            onSelect={handleSelectSlot}
                                            onAssistanceNoteChange={
                                                setAssistanceNote
                                            }
                                            onRequestAssistance={() => {
                                                void handleRequestAssistance();
                                            }}
                                        />
                                    )}

                                    {step === 'confirm' &&
                                        selectedService &&
                                        selectedSlot && (
                                            <ConfirmStep
                                                service={selectedService}
                                                variant={selectedVariant}
                                                addons={selectedAddons}
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

const STEP_DEFINITIONS: BookingStepDefinition<Step>[] = [
    {
        key: 'service',
        label: 'Usługa',
        heading: 'Wybierz usługę',
        backLabel: '',
    },
    {
        key: 'variant',
        label: 'Wariant',
        heading: 'Wybierz wariant',
        backLabel: 'Wybór usługi',
    },
    {
        key: 'addons',
        label: 'Dodatki',
        heading: 'Dodaj pielęgnację lub przejdź dalej',
        backLabel: 'Wybór wariantu',
    },
    {
        key: 'slot',
        label: 'Termin',
        heading: 'Wybierz termin',
        backLabel: 'Dodatki',
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
    const visibleSteps = STEP_DEFINITIONS.filter((s) => s.key !== 'confirm');
    const activeStep = step === 'confirm' ? 'slot' : step;

    return (
        <BookingStepHeader
            activeStep={activeStep}
            current={current}
            steps={visibleSteps}
            onBack={onBack}
        />
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
                        {svcs.map((svc) => {
                            const variants = getActiveVariants(svc);
                            const variantCount = variants.length;
                            const variantNoun =
                                variantCount === 1
                                    ? 'wariant'
                                    : variantCount % 10 >= 2 &&
                                        variantCount % 10 <= 4 &&
                                        (variantCount % 100 < 12 ||
                                            variantCount % 100 > 14)
                                      ? 'warianty'
                                      : 'wariantów';
                            const variantText = `${variantCount} ${variantNoun} do wyboru`;
                            return (
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
                                            {variants.length > 0
                                                ? variantText
                                                : `${svc.duration} min`}
                                        </span>
                                    </div>
                                    <span className="booking-service-price">
                                        {formatPrice(svc.price, svc.priceType)}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

function VariantStep({
    service,
    onSelect,
}: {
    service: OnlineService;
    onSelect: (variant: OnlineServiceVariant) => void;
}) {
    const variants = getActiveVariants(service);

    return (
        <div className="d-flex flex-column gap-3">
            <BookingSummaryStrip
                service={service}
                variant={null}
                addons={[]}
                helper="Wariant określa czas i cenę usługi bazowej."
            />
            <div className="d-flex flex-column gap-2">
                {variants.map((variant) => (
                    <button
                        key={variant.id}
                        type="button"
                        className="booking-service-card booking-option-card"
                        onClick={() => onSelect(variant)}
                    >
                        <div>
                            <strong className="d-block">{variant.name}</strong>
                            {variant.description && (
                                <span className="text-muted small">
                                    {variant.description}
                                </span>
                            )}
                            <span className="text-muted small d-block">
                                {variant.duration} min
                            </span>
                        </div>
                        <span className="booking-service-price">
                            {formatPrice(variant.price, variant.priceType)}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}

function AddonStep({
    service,
    variant,
    services,
    selectedAddons,
    onToggle,
    onContinue,
}: {
    service: OnlineService;
    variant: OnlineServiceVariant | null;
    services: OnlineService[];
    selectedAddons: OnlineService[];
    onToggle: (addon: OnlineService) => void;
    onContinue: () => void;
}) {
    const addons = useMemo(() => {
        const primarySourceIds = getPrimaryServiceSourceIds(service);
        return services
            .filter((item) => !primarySourceIds.has(item.id))
            .sort((a, b) => {
                const rankA = isLikelyAddon(a) ? 0 : 1;
                const rankB = isLikelyAddon(b) ? 0 : 1;
                return rankA - rankB || a.name.localeCompare(b.name, 'pl');
            });
    }, [service, services]);
    const selectedIds = new Set(selectedAddons.map((addon) => addon.id));
    const recommended = addons.filter(isLikelyAddon);
    const other = addons.filter((addon) => !isLikelyAddon(addon));

    const renderAddon = (addon: OnlineService) => {
        const selected = selectedIds.has(addon.id);
        return (
            <button
                key={addon.id}
                type="button"
                className={`booking-service-card booking-addon-card${
                    selected ? ' is-selected' : ''
                }`}
                aria-pressed={selected}
                onClick={() => onToggle(addon)}
            >
                <span className="booking-addon-card__check" aria-hidden="true">
                    {selected && <CheckIcon />}
                </span>
                <span className="booking-addon-card__content">
                    <strong className="d-block">{addon.name}</strong>
                    {addon.description &&
                        addon.description.trim() !== addon.name.trim() && (
                            <span className="text-muted small">
                                {addon.description}
                            </span>
                        )}
                    <span className="text-muted small d-block">
                        +{addon.duration} min
                    </span>
                </span>
                <span className="booking-service-price">
                    {formatPrice(addon.price, addon.priceType)}
                </span>
            </button>
        );
    };

    return (
        <div className="d-flex flex-column gap-3">
            <BookingSummaryStrip
                service={service}
                variant={variant}
                addons={selectedAddons}
                helper="Dodatki wydłużą blok wizyty, a pracownik zweryfikuje łączny czas przy potwierdzeniu."
            />

            {recommended.length > 0 && (
                <div>
                    <p className="booking-category-label">
                        Rekomendowane dodatki
                    </p>
                    <div className="d-flex flex-column gap-2">
                        {recommended.map(renderAddon)}
                    </div>
                </div>
            )}

            {other.length > 0 && (
                <details className="booking-addon-more">
                    <summary>Pokaż pozostałe usługi jako dodatki</summary>
                    <div className="d-flex flex-column gap-2 mt-2">
                        {other.map(renderAddon)}
                    </div>
                </details>
            )}

            {addons.length === 0 && (
                <p className="text-muted mb-0">
                    Brak dodatkowych usług do połączenia z tą rezerwacją.
                </p>
            )}

            <button
                type="button"
                className="btn btn-salon booking-next-btn"
                onClick={onContinue}
            >
                Przejdź do terminu
            </button>
        </div>
    );
}

function BookingSummaryStrip({
    service,
    variant,
    addons,
    helper,
}: {
    service: OnlineService;
    variant: OnlineServiceVariant | null;
    addons: OnlineService[];
    helper?: string;
}) {
    return (
        <div className="booking-summary-strip">
            <div>
                <span className="booking-summary-strip__label">Rezerwacja</span>
                <strong>{service.name}</strong>
                {variant && (
                    <span className="booking-summary-strip__sub">
                        Wariant: {variant.name}
                    </span>
                )}
                {addons.length > 0 && (
                    <span className="booking-summary-strip__sub">
                        Dodatki: {addons.map((addon) => addon.name).join(', ')}
                    </span>
                )}
                {helper && (
                    <span className="booking-summary-strip__helper">
                        {helper}
                    </span>
                )}
            </div>
            <div className="booking-summary-strip__meta">
                <span>{getTotalDuration(service, variant, addons)} min</span>
                <span>{getBookingPrice(service, variant, addons)}</span>
            </div>
        </div>
    );
}

function SlotStep({
    service,
    variant,
    addons,
    date,
    slots,
    loading,
    error,
    notice,
    assistanceNote,
    assistanceLoading,
    assistanceError,
    assistanceSent,
    closedWeekdays,
    onDateChange,
    onSelect,
    onAssistanceNoteChange,
    onRequestAssistance,
}: {
    service: OnlineService;
    variant: OnlineServiceVariant | null;
    addons: OnlineService[];
    date: string;
    slots: AvailableSlot[];
    loading: boolean;
    error: string;
    notice: string;
    assistanceNote: string;
    assistanceLoading: boolean;
    assistanceError: string;
    assistanceSent: boolean;
    closedWeekdays: Set<number>;
    onDateChange: (date: string) => void;
    onSelect: (slot: AvailableSlot) => void;
    onAssistanceNoteChange: (value: string) => void;
    onRequestAssistance: () => void;
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
            <BookingSummaryStrip
                service={service}
                variant={variant}
                addons={addons}
            />

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
                <DayStepper date={date} onDateChange={onDateChange} />
            </div>

            {notice && (
                <div className="booking-notice mb-3" role="status">
                    {notice}
                </div>
            )}

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

            {!loading && !error && (
                <AssistanceRequestBox
                    value={assistanceNote}
                    loading={assistanceLoading}
                    error={assistanceError}
                    sent={assistanceSent}
                    onChange={onAssistanceNoteChange}
                    onSubmit={onRequestAssistance}
                />
            )}
        </div>
    );
}

function AssistanceRequestBox({
    value,
    loading,
    error,
    sent,
    onChange,
    onSubmit,
}: {
    value: string;
    loading: boolean;
    error: string;
    sent: boolean;
    onChange: (value: string) => void;
    onSubmit: () => void;
}) {
    return (
        <div className="booking-assistance-box">
            <div>
                <span className="booking-summary-strip__label">
                    Nie pasuje żaden termin?
                </span>
                <strong>Poproś salon o pomoc w znalezieniu terminu</strong>
                <p className="text-muted small mb-0 mt-1">
                    Wyślemy do zespołu wybraną usługę, dodatki i łączny czas
                    wizyty.
                </p>
            </div>

            <label
                htmlFor="booking-assistance-note"
                className="form-label text-muted small fw-normal mt-3"
            >
                Preferencje terminu (opcjonalnie)
            </label>
            <textarea
                id="booking-assistance-note"
                className="form-control"
                rows={3}
                maxLength={800}
                placeholder="Np. najchętniej piątek po 16:00 albo pierwszy wolny termin u Anny."
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={loading || sent}
            />

            {error && (
                <p className="text-danger small mt-2 mb-0" role="alert">
                    {error}
                </p>
            )}
            {sent && (
                <p className="text-success small mt-2 mb-0" role="status">
                    Prośba została wysłana. Salon skontaktuje się z Tobą w
                    sprawie terminu.
                </p>
            )}

            <button
                type="button"
                className="btn btn-outline-secondary booking-assistance-box__btn"
                onClick={onSubmit}
                disabled={loading || sent}
                aria-busy={loading}
            >
                {loading
                    ? 'Wysyłam...'
                    : sent
                      ? 'Prośba wysłana'
                      : 'Poproś o pomoc'}
            </button>
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
    variant,
    addons,
    slot,
    submitting,
    error,
    note,
    onNoteChange,
    onConfirm,
    onBack,
}: {
    service: OnlineService;
    variant: OnlineServiceVariant | null;
    addons: OnlineService[];
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
                        {variant && (
                            <span className="d-block text-muted small">
                                {variant.name}
                            </span>
                        )}
                    </dd>

                    <dt className="col-5 text-muted small fw-normal">Cena</dt>
                    <dd className="col-7 mb-2">
                        {getBookingPrice(service, variant, addons)}
                    </dd>

                    <dt className="col-5 text-muted small fw-normal">
                        Czas trwania
                    </dt>
                    <dd className="col-7 mb-2">
                        {getTotalDuration(service, variant, addons)} min
                    </dd>

                    {addons.length > 0 && (
                        <>
                            <dt className="col-5 text-muted small fw-normal">
                                Dodatki
                            </dt>
                            <dd className="col-7 mb-2">
                                {addons.map((addon) => addon.name).join(', ')}
                            </dd>
                        </>
                    )}

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
                {addons.length > 0 && (
                    <p className="booking-staff-note" role="note">
                        Pracownik zobaczy dodatki i zweryfikuje łączny czas
                        wizyty przy potwierdzeniu.
                    </p>
                )}
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
    variant,
    addons,
    slot,
    onNew,
    onHistory,
}: {
    appointmentId: number | null;
    service: OnlineService | null;
    variant: OnlineServiceVariant | null;
    addons: OnlineService[];
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
                    {service.name} · {variant ? `${variant.name} · ` : ''}
                    {addons.length > 0
                        ? `${addons.length} dod. · ${getTotalDuration(
                              service,
                              variant,
                              addons,
                          )} min · `
                        : ''}
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

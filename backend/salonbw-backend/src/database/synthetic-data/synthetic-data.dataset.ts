import type {
    DatasetInput,
    SyntheticAppointment,
    SyntheticAppointmentStatus,
    SyntheticClient,
    SyntheticDataset,
    SyntheticProduct,
    SyntheticProductCategory,
    SyntheticSupplier,
    SyntheticWorkingDay,
    SyntheticWarehouseDocument,
} from './synthetic-data.types';
import {
    warsawDateAtMinute,
    warsawDateKey,
    warsawMinuteOfDay,
} from './synthetic-data.schedule';

const APPOINTMENT_STATUSES: SyntheticAppointmentStatus[] = [
    'scheduled',
    'confirmed',
    'in_progress',
    'cancelled',
    'completed',
    'no_show',
    'online_pending',
    'rescheduled_pending',
];
const PAST_APPOINTMENT_STATUSES = new Set<SyntheticAppointmentStatus>([
    'cancelled',
    'completed',
    'no_show',
]);
const APPOINTMENT_GRID_MINUTES = 30;

// Dataset volume. Sized so the owner can exercise scenarios across a realistic
// month of work rather than a single busy week: the earlier 30-appointment /
// 14-day spread packed everything just after the anchor, leaving the calendar
// visibly empty a week later.
export const SYNTHETIC_CLIENT_COUNT = 20;
export const SYNTHETIC_APPOINTMENT_COUNT = 70;
// How far ahead future-dated appointments may land (days from the anchor).
export const SYNTHETIC_FUTURE_SPREAD_DAYS = 30;
// How far back past-dated appointments may land (days before the anchor).
export const SYNTHETIC_PAST_SPREAD_DAYS = 21;

function localDayStart(value: Date): Date {
    return warsawDateAtMinute(warsawDateKey(value), 0);
}

interface AppointmentDraft {
    key: string;
    status: SyntheticAppointmentStatus;
    durationMinutes: 30 | 60 | 90;
    preferredOffset: number;
}

interface OccupiedInterval {
    start: number;
    end: number;
}

function dateOrdinal(date: string): number {
    const [year, month, day] = date.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
}

function allocateAppointment(
    draft: AppointmentDraft,
    candidates: SyntheticWorkingDay[],
    occupied: OccupiedInterval[],
): { startTime: Date; endTime: Date } | null {
    for (const candidate of candidates) {
        const ranges = [...candidate.ranges].sort(
            (a, b) =>
                a.startMinute - b.startMinute || a.endMinute - b.endMinute,
        );

        for (const range of ranges) {
            const firstMinute =
                Math.ceil(range.startMinute / APPOINTMENT_GRID_MINUTES) *
                APPOINTMENT_GRID_MINUTES;
            for (
                let startMinute = firstMinute;
                startMinute + draft.durationMinutes <= range.endMinute;
                startMinute += APPOINTMENT_GRID_MINUTES
            ) {
                const endMinute = startMinute + draft.durationMinutes;
                let startTime: Date;
                let endTime: Date;
                try {
                    startTime = warsawDateAtMinute(candidate.date, startMinute);
                    endTime = warsawDateAtMinute(candidate.date, endMinute);
                    if (
                        warsawDateKey(startTime) !== candidate.date ||
                        warsawDateKey(endTime) !== candidate.date ||
                        warsawMinuteOfDay(startTime) !== startMinute ||
                        warsawMinuteOfDay(endTime) !== endMinute ||
                        endTime.getTime() - startTime.getTime() !==
                            draft.durationMinutes * 60_000 ||
                        startMinute < range.startMinute ||
                        endMinute > range.endMinute
                    ) {
                        continue;
                    }
                } catch {
                    continue;
                }
                const interval = {
                    start: startTime.getTime(),
                    end: endTime.getTime(),
                };
                if (
                    occupied.some(
                        (existing) =>
                            interval.start < existing.end &&
                            interval.end > existing.start,
                    )
                ) {
                    continue;
                }

                occupied.push(interval);
                return { startTime, endTime };
            }
        }
    }

    return null;
}

function preferredPastCandidates(
    draft: AppointmentDraft,
    workingDays: SyntheticWorkingDay[],
    anchorDateKey: string,
): SyntheticWorkingDay[] {
    const preferredOrdinal =
        dateOrdinal(anchorDateKey) + draft.preferredOffset * 86_400_000;
    return workingDays
        .filter((day) => day.date < anchorDateKey)
        .sort(
            (a, b) =>
                Math.abs(dateOrdinal(a.date) - preferredOrdinal) -
                    Math.abs(dateOrdinal(b.date) - preferredOrdinal) ||
                a.date.localeCompare(b.date),
        );
}

// Future drafts used to be handed every upcoming day in ascending order, so the
// allocator always took the earliest free slot and `preferredOffset` was dead
// weight — every upcoming visit piled into the days right after the anchor.
// Mirror the past-side behaviour: order candidates by distance from the day the
// draft actually asked for, so visits spread across the horizon.
function preferredFutureCandidates(
    draft: AppointmentDraft,
    futureDays: SyntheticWorkingDay[],
    anchorDateKey: string,
): SyntheticWorkingDay[] {
    const preferredOrdinal =
        dateOrdinal(anchorDateKey) + draft.preferredOffset * 86_400_000;
    return [...futureDays].sort(
        (a, b) =>
            Math.abs(dateOrdinal(a.date) - preferredOrdinal) -
                Math.abs(dateOrdinal(b.date) - preferredOrdinal) ||
            a.date.localeCompare(b.date),
    );
}

function inProgressCandidate(
    draft: AppointmentDraft,
    workingDays: SyntheticWorkingDay[],
    anchorDateKey: string,
    anchorMinute: number,
): SyntheticWorkingDay[] {
    const anchorDay = workingDays.find((day) => day.date === anchorDateKey);
    const range = anchorDay?.ranges.find(
        (item) =>
            item.startMinute <= anchorMinute && anchorMinute < item.endMinute,
    );
    if (!range) return [];

    let startMinute =
        Math.floor(anchorMinute / APPOINTMENT_GRID_MINUTES) *
        APPOINTMENT_GRID_MINUTES;
    while (
        startMinute >= range.startMinute &&
        (startMinute + draft.durationMinutes > range.endMinute ||
            startMinute + draft.durationMinutes <= anchorMinute)
    ) {
        startMinute -= APPOINTMENT_GRID_MINUTES;
    }
    if (startMinute < range.startMinute) return [];

    return [
        {
            date: anchorDateKey,
            ranges: [
                {
                    startMinute,
                    endMinute: startMinute + draft.durationMinutes,
                },
            ],
        },
    ];
}

function futureCandidates(
    workingDays: SyntheticWorkingDay[],
    anchorDateKey: string,
    anchorMinute: number,
): SyntheticWorkingDay[] {
    const firstFutureMinute =
        (Math.floor(anchorMinute / APPOINTMENT_GRID_MINUTES) + 1) *
        APPOINTMENT_GRID_MINUTES;

    return workingDays
        .filter((day) => day.date >= anchorDateKey)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((day) =>
            day.date === anchorDateKey
                ? {
                      ...day,
                      ranges: day.ranges
                          .map((range) => ({
                              ...range,
                              startMinute: Math.max(
                                  range.startMinute,
                                  firstFutureMinute,
                              ),
                          }))
                          .filter(
                              (range) => range.startMinute < range.endMinute,
                          ),
                  }
                : day,
        );
}

function createClients(): SyntheticClient[] {
    return Array.from({ length: SYNTHETIC_CLIENT_COUNT }, (_, index) => {
        const number = String(index + 1).padStart(2, '0');
        return {
            key: `client-${number}`,
            email: `synthetic.client.${number}@example.invalid`,
            name: `SYNTHETIC Klient ${number}`,
            firstName: 'SYNTHETIC',
            lastName: `Klient ${number}`,
            phone: null,
            receiveNotifications: false,
            notifyPanel: true,
            emailConsent: false,
            smsConsent: false,
            whatsappConsent: false,
            ...(index === 0
                ? {
                      note: 'SYNTHETIC klient powracający',
                      tag: 'SYNTHETIC regularny',
                      group: 'SYNTHETIC UAT',
                      origin: 'SYNTHETIC development',
                  }
                : {}),
        };
    });
}

function createAppointments(input: DatasetInput): {
    appointments: SyntheticAppointment[];
    convertedInProgress: number;
} {
    const drafts = Array.from(
        { length: SYNTHETIC_APPOINTMENT_COUNT },
        (_, index): AppointmentDraft => {
            const status =
                APPOINTMENT_STATUSES[index % APPOINTMENT_STATUSES.length];
            const durationMinutes = (30 + (index % 3) * 30) as 30 | 60 | 90;
            const preferredOffset = PAST_APPOINTMENT_STATUSES.has(status)
                ? -(1 + (index % SYNTHETIC_PAST_SPREAD_DAYS))
                : status === 'in_progress'
                  ? 0
                  : 1 + (index % SYNTHETIC_FUTURE_SPREAD_DAYS);
            return {
                key: `appointment-${String(index + 1).padStart(2, '0')}`,
                status,
                durationMinutes,
                preferredOffset,
            };
        },
    );
    const anchorDateKey = warsawDateKey(input.anchorDate);
    const anchorMinute = warsawMinuteOfDay(input.anchorDate);
    const workingDays = input.workingDays.map((day) => ({
        date: day.date,
        ranges: day.ranges.map((range) => ({ ...range })),
    }));
    const occupied: OccupiedInterval[] = [];
    const allocations = new Map<
        string,
        {
            status: SyntheticAppointmentStatus;
            startTime: Date;
            endTime: Date;
        }
    >();
    let convertedInProgress = 0;

    for (const draft of drafts
        .filter((item) => PAST_APPOINTMENT_STATUSES.has(item.status))
        .sort((a, b) => a.key.localeCompare(b.key))) {
        const allocation = allocateAppointment(
            draft,
            preferredPastCandidates(draft, workingDays, anchorDateKey),
            occupied,
        );
        if (!allocation) throw new Error('SYNTHETIC_SCHEDULE_CAPACITY');
        allocations.set(draft.key, { status: draft.status, ...allocation });
    }

    const futureDrafts = drafts
        .filter(
            (item) =>
                !PAST_APPOINTMENT_STATUSES.has(item.status) &&
                item.status !== 'in_progress',
        )
        .map((draft) => ({ ...draft }));
    for (const draft of drafts
        .filter((item) => item.status === 'in_progress')
        .sort((a, b) => a.key.localeCompare(b.key))) {
        const allocation = allocateAppointment(
            draft,
            inProgressCandidate(
                draft,
                workingDays,
                anchorDateKey,
                anchorMinute,
            ),
            occupied,
        );
        if (allocation) {
            allocations.set(draft.key, {
                status: draft.status,
                ...allocation,
            });
        } else {
            convertedInProgress += 1;
            futureDrafts.push({ ...draft, status: 'confirmed' });
        }
    }

    const futureDays = futureCandidates(
        workingDays,
        anchorDateKey,
        anchorMinute,
    );
    for (const draft of futureDrafts.sort((a, b) =>
        a.key.localeCompare(b.key),
    )) {
        const allocation = allocateAppointment(
            draft,
            preferredFutureCandidates(draft, futureDays, anchorDateKey),
            occupied,
        );
        if (!allocation) throw new Error('SYNTHETIC_SCHEDULE_CAPACITY');
        allocations.set(draft.key, { status: draft.status, ...allocation });
    }

    const appointments = drafts.map((draft, index) => {
        const allocation = allocations.get(draft.key);
        if (!allocation) throw new Error('SYNTHETIC_SCHEDULE_CAPACITY');
        const price = 60 + (index % 6) * 20;
        const completed = allocation.status === 'completed';

        return {
            key: draft.key,
            clientKey: `client-${String((index % 12) + 1).padStart(2, '0')}`,
            employeeId: input.ownerUserId,
            serviceId: input.serviceIds[index % input.serviceIds.length],
            status: allocation.status,
            startTime: allocation.startTime,
            endTime: allocation.endTime,
            price,
            paidAmount: completed ? price : null,
            tipAmount: completed && index % 2 === 0 ? 10 : null,
            paymentMethod: completed
                ? (['cash', 'card', 'transfer'] as const)[index % 3]
                : null,
        };
    });

    return { appointments, convertedInProgress };
}

function createProductCategories(): SyntheticProductCategory[] {
    return ['Kolor', 'Pielęgnacja', 'Stylizacja', 'Akcesoria'].map(
        (label, index) => ({
            key: `category-${index + 1}`,
            name: `SYNTHETIC ${label}`,
        }),
    );
}

function createSuppliers(): SyntheticSupplier[] {
    return [1, 2].map((number) => ({
        key: `supplier-${number}`,
        name: `SYNTHETIC Dostawca ${number}`,
        email: `synthetic.supplier.${number}@example.invalid`,
    }));
}

function createProducts(): SyntheticProduct[] {
    return Array.from({ length: 12 }, (_, index) => {
        const number = index + 1;
        const minQuantity = 5;
        const stock = index % 3 === 0 ? 0 : index % 3 === 1 ? 2 : 12;

        return {
            key: `product-${number}`,
            categoryKey: `category-${(index % 4) + 1}`,
            supplierKey: `supplier-${(index % 2) + 1}`,
            sku: `SYNTH-${String(number).padStart(3, '0')}`,
            name: `SYNTHETIC Produkt ${String(number).padStart(2, '0')}`,
            brand: 'SYNTHETIC LAB',
            unit: index % 2 === 0 ? 'szt.' : 'ml',
            stock,
            minQuantity,
            purchasePrice: 10 + number * 2,
            unitPrice: 20 + number * 3,
        };
    });
}

function document(
    kind: string,
    status: string,
    productKeys: string[],
): SyntheticWarehouseDocument {
    return {
        key: kind.toLowerCase(),
        number: `SYNTHETIC-${kind}-001`,
        productKeys,
        status,
    };
}

export function generateSyntheticDataset(
    input: DatasetInput,
): SyntheticDataset {
    if (!Number.isInteger(input.ownerUserId) || input.ownerUserId <= 0) {
        throw new Error('ownerUserId must be a positive integer');
    }
    if (input.serviceIds.length === 0) {
        throw new Error('serviceIds must contain at least one service');
    }

    const anchorDate = localDayStart(input.anchorDate);
    const products = createProducts();
    const productKeys = products.slice(0, 3).map((product) => product.key);
    const { appointments, convertedInProgress } = createAppointments(input);
    const completedAppointments = appointments.filter(
        (appointment) => appointment.status === 'completed',
    );

    return {
        anchorDate,
        generationSummary: {
            convertedInProgress,
        },
        clients: createClients(),
        appointments,
        productCategories: createProductCategories(),
        products,
        suppliers: createSuppliers(),
        deliveries: [document('DELIVERY', 'received', productKeys)],
        orders: [document('ORDER', 'ordered', productKeys)],
        sales: [document('SALE', 'completed', productKeys.slice(0, 1))],
        usages: [document('USAGE', 'completed', productKeys.slice(1, 2))],
        stocktakings: [
            document(
                'STOCKTAKING',
                'completed',
                products.map((p) => p.key),
            ),
        ],
        commissions: completedAppointments.map((appointment) => ({
            appointmentKey: appointment.key,
            employeeId: input.ownerUserId,
            amount: (appointment.paidAmount ?? 0) * 0.3,
            percent: 30,
        })),
        reviews: completedAppointments
            .slice(0, 2)
            .map((appointment, index) => ({
                appointmentKey: appointment.key,
                clientKey: appointment.clientKey,
                rating: 4 + (index % 2),
                comment: `SYNTHETIC opinia ${index + 1}`,
            })),
        loyaltyTransactions: [
            { clientKey: 'client-01', points: 20, type: 'earned' },
            { clientKey: 'client-01', points: 5, type: 'redeemed' },
            { clientKey: 'client-02', points: 10, type: 'earned' },
        ],
        recipeItems: [
            {
                serviceId: input.serviceIds[0],
                productKey: 'product-1',
                quantity: 1,
                unit: 'szt.',
            },
        ],
    };
}

import type {
    DatasetInput,
    SyntheticAppointment,
    SyntheticAppointmentStatus,
    SyntheticClient,
    SyntheticDataset,
    SyntheticProduct,
    SyntheticProductCategory,
    SyntheticSupplier,
    SyntheticWarehouseDocument,
} from './synthetic-data.types';

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

function localDayStart(value: Date): Date {
    const result = new Date(value);
    result.setHours(0, 0, 0, 0);
    return result;
}

function appointmentDayOffset(
    status: SyntheticAppointmentStatus,
    index: number,
): number {
    switch (status) {
        case 'completed':
        case 'cancelled':
        case 'no_show':
            return -(1 + (index % 21));
        case 'in_progress':
            return 0;
        default:
            return 1 + (index % 14);
    }
}

function createClients(): SyntheticClient[] {
    return Array.from({ length: 12 }, (_, index) => {
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

function createAppointments(input: DatasetInput): SyntheticAppointment[] {
    const anchor = localDayStart(input.anchorDate);

    return Array.from({ length: 30 }, (_, index) => {
        const status = APPOINTMENT_STATUSES[index % APPOINTMENT_STATUSES.length];
        const startTime = new Date(anchor);
        startTime.setDate(
            startTime.getDate() + appointmentDayOffset(status, index),
        );
        startTime.setHours(9 + (index % 8), (index % 2) * 30, 0, 0);
        const durationMinutes = 30 + (index % 3) * 30;
        const endTime = new Date(
            startTime.getTime() + durationMinutes * 60_000,
        );
        const price = 60 + (index % 6) * 20;
        const completed = status === 'completed';

        return {
            key: `appointment-${String(index + 1).padStart(2, '0')}`,
            clientKey: `client-${String((index % 12) + 1).padStart(2, '0')}`,
            employeeId: input.ownerUserId,
            serviceId: input.serviceIds[index % input.serviceIds.length],
            status,
            startTime,
            endTime,
            price,
            paidAmount: completed ? price : null,
            tipAmount: completed && index % 2 === 0 ? 10 : null,
            paymentMethod: completed
                ? (['cash', 'card', 'transfer'] as const)[index % 3]
                : null,
        };
    });
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

export function generateSyntheticDataset(input: DatasetInput): SyntheticDataset {
    if (!Number.isInteger(input.ownerUserId) || input.ownerUserId <= 0) {
        throw new Error('ownerUserId must be a positive integer');
    }
    if (input.serviceIds.length === 0) {
        throw new Error('serviceIds must contain at least one service');
    }

    const anchorDate = localDayStart(input.anchorDate);
    const products = createProducts();
    const productKeys = products.slice(0, 3).map((product) => product.key);
    const appointments = createAppointments({ ...input, anchorDate });
    const completedAppointments = appointments.filter(
        (appointment) => appointment.status === 'completed',
    );

    return {
        anchorDate,
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
            document('STOCKTAKING', 'completed', products.map((p) => p.key)),
        ],
        commissions: completedAppointments.map((appointment) => ({
            appointmentKey: appointment.key,
            employeeId: input.ownerUserId,
            amount: (appointment.paidAmount ?? 0) * 0.3,
            percent: 30,
        })),
        reviews: completedAppointments.slice(0, 2).map((appointment, index) => ({
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

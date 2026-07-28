export type SyntheticMode = 'plan' | 'apply' | 'verify' | 'cleanup';

export interface FileMetadata {
    isFile: boolean;
    size: number;
    ageMs: number;
}

export interface SyntheticRunConfig {
    mode: SyntheticMode;
    protectedEmails: string[];
    backupFile?: string;
    reportJson: boolean;
}

export interface DatasetInput {
    anchorDate: Date;
    ownerUserId: number;
    serviceIds: number[];
}

export type SyntheticAppointmentStatus =
    | 'scheduled'
    | 'confirmed'
    | 'in_progress'
    | 'cancelled'
    | 'completed'
    | 'no_show'
    | 'online_pending'
    | 'rescheduled_pending';

export interface SyntheticClient {
    key: string;
    email: string;
    name: string;
    firstName: string;
    lastName: string;
    phone: null;
    receiveNotifications: false;
    notifyPanel: true;
    emailConsent: false;
    smsConsent: false;
    whatsappConsent: false;
    note?: string;
    tag?: string;
    group?: string;
    origin?: string;
}

export interface SyntheticAppointment {
    key: string;
    clientKey: string;
    employeeId: number;
    serviceId: number;
    status: SyntheticAppointmentStatus;
    startTime: Date;
    endTime: Date;
    price: number;
    paidAmount: number | null;
    tipAmount: number | null;
    paymentMethod: 'cash' | 'card' | 'transfer' | null;
}

export interface SyntheticProductCategory {
    key: string;
    name: string;
}

export interface SyntheticSupplier {
    key: string;
    name: string;
    email: string;
}

export interface SyntheticProduct {
    key: string;
    categoryKey: string;
    supplierKey: string;
    sku: string;
    name: string;
    brand: string;
    unit: string;
    stock: number;
    minQuantity: number;
    purchasePrice: number;
    unitPrice: number;
}

export interface SyntheticWarehouseDocument {
    key: string;
    number: string;
    productKeys: string[];
    status: string;
}

export interface SyntheticCommission {
    appointmentKey: string;
    employeeId: number;
    amount: number;
    percent: number;
}

export interface SyntheticReview {
    appointmentKey: string;
    clientKey: string;
    rating: number;
    comment: string;
}

export interface SyntheticLoyaltyTransaction {
    clientKey: string;
    points: number;
    type: 'earned' | 'redeemed';
}

export interface SyntheticRecipeItem {
    serviceId: number;
    productKey: string;
    quantity: number;
    unit: string;
}

export interface SyntheticDataset {
    anchorDate: Date;
    clients: SyntheticClient[];
    appointments: SyntheticAppointment[];
    productCategories: SyntheticProductCategory[];
    products: SyntheticProduct[];
    suppliers: SyntheticSupplier[];
    deliveries: SyntheticWarehouseDocument[];
    orders: SyntheticWarehouseDocument[];
    sales: SyntheticWarehouseDocument[];
    usages: SyntheticWarehouseDocument[];
    stocktakings: SyntheticWarehouseDocument[];
    commissions: SyntheticCommission[];
    reviews: SyntheticReview[];
    loyaltyTransactions: SyntheticLoyaltyTransaction[];
    recipeItems: SyntheticRecipeItem[];
}

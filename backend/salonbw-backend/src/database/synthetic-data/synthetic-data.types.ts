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

export interface SyntheticGenerationSummary {
    convertedInProgress: number;
}

export interface DatasetInput {
    anchorDate: Date;
    ownerUserId: number;
    serviceIds: number[];
    workingDays: SyntheticWorkingDay[];
}

export interface SyntheticWorkingRange {
    startMinute: number;
    endMinute: number;
}

export interface SyntheticWorkingDay {
    date: string;
    ranges: SyntheticWorkingRange[];
}

export interface SyntheticAppointmentWindow {
    key: string;
    employeeId: number;
    status: SyntheticAppointmentStatus;
    startTime: Date;
    endTime: Date;
}

export interface SyntheticScheduleValidationInput {
    appointments: SyntheticAppointmentWindow[];
    workingDays: SyntheticWorkingDay[];
    ownerUserId: number;
    anchorDate: Date;
}

export interface SyntheticScheduleSummary {
    rangeStart: string;
    rangeEnd: string;
    workingDays: number;
    closedDays: number;
    convertedInProgress: number;
}

export interface SyntheticTimetableRecord {
    id: number;
    validFrom: string | Date;
    validTo: string | Date | null;
    slots: Array<{
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        isBreak: boolean;
    }>;
}

export interface SyntheticTimetableExceptionRecord {
    timetableId: number;
    date: string | Date;
    type: string;
    customStartTime: string | null;
    customEndTime: string | null;
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

export interface SyntheticAppointment extends SyntheticAppointmentWindow {
    clientKey: string;
    serviceId: number;
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
    generationSummary: SyntheticGenerationSummary;
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

export interface SyntheticPlan {
    protectedUserIds: number[];
    protectedAdminPresent: boolean;
    protectedCiClientPresent: boolean;
    ownerUserId: number | null;
    serviceIds: number[];
    deleteCounts: Record<string, number>;
    createCounts: Record<string, number>;
    blockers: string[];
}

export interface SyntheticVerificationExpected {
    clients: number;
    appointments: number;
    products: number;
    warehouseDocuments: number;
}

export interface SyntheticVerificationReport {
    actual: SyntheticVerificationExpected;
    expected: SyntheticVerificationExpected;
    protectedAccountsPresent: number;
    remainingNonSyntheticClients: number;
    blockers: string[];
}

export interface Client {
    id: number;
    name: string;
    phone?: string;
}

export type Role = 'client' | 'employee' | 'receptionist' | 'admin';

export interface User {
    id: number;
    email: string;
    name: string;
    role: Role;
    avatarUrl?: string;
}

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'online' | 'voucher';
export type AppointmentStatus =
    | 'scheduled'
    | 'confirmed'
    | 'in_progress'
    | 'cancelled'
    | 'completed'
    | 'no_show';

export interface Appointment {
    id: number;
    startTime: string;
    endTime?: string;
    client?: Client;
    service?: Service;
    employee?: Employee;
    status?: AppointmentStatus;
    paymentStatus?: string;
    paymentMethod?: PaymentMethod;
    paidAmount?: number;
    tipAmount?: number;
    discount?: number;
    finalizedAt?: string;
    finalizedBy?: { id: number; name: string };
    notes?: string;
    internalNote?: string;
}

export type PriceType = 'fixed' | 'from';

export interface Service {
    id: number;
    name: string;
    description?: string;
    publicDescription?: string;
    privateDescription?: string;
    duration: number;
    price: number;
    priceType: PriceType;
    vatRate?: number;
    isFeatured?: boolean;
    category?: string;
    categoryId?: number;
    categoryRelation?: ServiceCategory;
    commissionPercent?: number;
    isActive: boolean;
    onlineBooking: boolean;
    sortOrder: number;
    variants?: ServiceVariant[];
    media?: ServiceMedia[];
    reviews?: ServiceReview[];
    recipeItems?: ServiceRecipeItem[];
    employeeServices?: EmployeeService[];
    createdAt?: string;
    updatedAt?: string;
}

export interface ServiceCategory {
    id: number;
    name: string;
    description?: string;
    color?: string;
    sortOrder: number;
    isActive: boolean;
    parentId?: number;
    parent?: ServiceCategory;
    children?: ServiceCategory[];
    services?: Service[];
    createdAt?: string;
    updatedAt?: string;
}

export interface ServiceVariant {
    id: number;
    serviceId: number;
    name: string;
    description?: string;
    duration: number;
    price: number;
    priceType: PriceType;
    sortOrder: number;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface EmployeeService {
    id: number;
    employeeId: number;
    serviceId: number;
    serviceVariantId?: number | null;
    employee?: Employee;
    service?: Service;
    serviceVariant?: ServiceVariant;
    customDuration?: number;
    customPrice?: number;
    commissionPercent?: number;
    isActive: boolean;
    createdAt?: string;
}

export interface ServiceMedia {
    id: number;
    serviceId: number;
    url: string;
    caption?: string | null;
    sortOrder: number;
    isPublic: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export type ServiceReviewSource = 'booksy' | 'moment' | 'internal';

export interface ServiceReview {
    id: number;
    serviceId: number;
    source: ServiceReviewSource;
    rating: number;
    comment?: string | null;
    authorName?: string | null;
    createdAt?: string;
}

export interface ServiceRecipeItem {
    id: number;
    serviceId: number;
    serviceVariantId?: number | null;
    productId?: number | null;
    quantity?: number | null;
    unit?: string | null;
    notes?: string | null;
    product?: Product | null;
    serviceVariant?: ServiceVariant | null;
    createdAt?: string;
}

export interface Category {
    id: number;
    name: string;
}

export interface Employee {
    id: number;
    name: string;
    // Optional fields for compatibility in UI components that may still reference them
    firstName?: string;
    lastName?: string;
    fullName?: string;
    color?: string;
}

export interface Product {
    id: number;
    name: string;
    brand?: string | null;
    description?: string | null;
    sku?: string | null;
    barcode?: string | null;
    productType?: ProductType;
    unitPrice: number;
    vatRate?: number;
    purchasePrice?: number | null;
    stock: number;
    lowStockThreshold: number;
    minQuantity?: number | null;
    unit?: string | null;
    packageSize?: number | null;
    packageUnit?: string | null;
    manufacturer?: string | null;
    categoryId?: number | null;
    category?: ProductCategory | null;
    defaultSupplierId?: number | null;
    isActive?: boolean;
    trackStock?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface Review {
    id: number;
    appointmentId: number;
    rating: number;
    comment?: string;
    employee?: Employee;
    author?: Client;
}

export interface DashboardResponse {
    clientCount: number;
    employeeCount: number;
    todayAppointments: number;
    upcomingAppointments: Appointment[];
}

export interface ClientDashboardResponse {
    upcomingAppointment: {
        id: number;
        serviceName: string;
        startTime: string;
        employeeName: string;
    } | null;
    completedCount: number;
    serviceHistory: { id: number; name: string; count: number }[];
    recentAppointments: {
        id: number;
        serviceName: string;
        startTime: string;
        status: string;
    }[];
}

export interface Notification {
    id: number;
    message: string;
    createdAt: string;
}

export interface EmailLog {
    id: number;
    recipient: string;
    subject: string;
    status: string;
    sentAt: string;
}

export interface Invoice {
    id: number;
    reservationId: number;
    number: string;
    pdfUrl: string;
    createdAt: string;
    status: string;
}

export type TimeBlockType =
    | 'break'
    | 'vacation'
    | 'training'
    | 'sick'
    | 'other';

export interface TimeBlock {
    id: number;
    employeeId: number;
    employeeName: string;
    startTime: string;
    endTime: string;
    type: TimeBlockType;
    title?: string;
    notes?: string;
    allDay: boolean;
}

export type CalendarEventType = 'appointment' | 'time_block';

export interface CalendarEvent {
    id: number;
    type: CalendarEventType;
    title: string;
    startTime: string;
    endTime: string;
    employeeId: number;
    employeeName: string;
    clientId?: number;
    clientName?: string;
    serviceId?: number;
    serviceName?: string;
    status?: string;
    blockType?: TimeBlockType;
    notes?: string;
    allDay?: boolean;
}

export type CalendarView = 'day' | 'week' | 'month' | 'reception';

export interface CalendarData {
    events: CalendarEvent[];
    employees: Array<{ id: number; name: string; color?: string }>;
    dateRange: { start: string; end: string };
}

// Customer CRM types
export type Gender = 'male' | 'female' | 'other';
export type NoteType =
    | 'general'
    | 'warning'
    | 'preference'
    | 'medical'
    | 'payment';

export interface Customer {
    id: number;
    name: string;
    fullName?: string; // Alias dla name (Versum compat)
    email: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    birthDate?: string;
    gender?: Gender;
    address?: string;
    city?: string;
    postalCode?: string;
    description?: string;
    smsConsent: boolean;
    emailConsent: boolean;
    gdprConsent: boolean;
    gdprConsentDate?: string;
    createdAt: string;
    updatedAt: string;
    lastVisitDate?: string | null;
    groups?: CustomerGroup[];
    tags?: CustomerTag[];
}

export interface CustomerGroup {
    id: number;
    name: string;
    description?: string;
    color?: string;
    members?: Customer[];
    memberCount?: number;
    createdAt: string;
}

export interface CustomerNote {
    id: number;
    content: string;
    type: NoteType;
    isPinned: boolean;
    createdBy?: { id: number; name: string };
    createdAt: string;
    updatedAt: string;
}

export interface CustomerTag {
    id: number;
    name: string;
    color?: string;
    createdAt: string;
}

export interface CustomerStatistics {
    totalVisits: number;
    completedVisits: number;
    cancelledVisits: number;
    noShowVisits: number;
    totalSpent: number;
    averageSpent: number;
    lastVisitDate: string | null;
    firstVisitDate: string | null;
    favoriteServices: Array<{
        serviceId: number;
        serviceName: string;
        count: number;
    }>;
    favoriteEmployees: Array<{
        employeeId: number;
        employeeName: string;
        count: number;
    }>;
    visitsByMonth: Array<{
        month: string;
        count: number;
        spent: number;
    }>;
}

export interface CustomerEventHistory {
    items: Array<{
        id: number;
        date: string;
        time: string;
        service: { id: number; name: string } | null;
        employee: { id: number; name: string } | null;
        status: string;
        price: number;
    }>;
    counts?: {
        all: number;
        upcoming: number;
        completed: number;
        cancelled: number;
        no_show: number;
    };
    total: number;
    limit: number;
    offset: number;
}

export interface CustomerFilterParams {
    search?: string;
    gender?: Gender;
    ageMin?: number;
    ageMax?: number;
    groupId?: number;
    groupOperator?: 'and' | 'or' | 'AND' | 'OR';
    tagId?: number;
    spentMin?: number;
    spentMax?: number;
    hasVisitSince?: string;
    noVisitSince?: string;
    serviceId?: number;
    employeeId?: number;
    hasUpcomingVisit?: boolean;
    recentlyAdded?: boolean;
    noOnlineReservations?: boolean;
    smsConsent?: boolean;
    emailConsent?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedCustomers {
    items: Customer[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// Warehouse types
export type ProductType = 'product' | 'supply' | 'universal';
export type DeliveryStatus = 'draft' | 'pending' | 'received' | 'cancelled';
export type StocktakingStatus =
    | 'draft'
    | 'in_progress'
    | 'completed'
    | 'cancelled';
export type MovementType =
    | 'delivery'
    | 'sale'
    | 'stocktaking'
    | 'adjustment'
    | 'return';

export interface Supplier {
    id: number;
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
    nip?: string;
    notes?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ProductCategory {
    id: number;
    name: string;
    parentId?: number | null;
    parent?: ProductCategory | null;
    children?: ProductCategory[];
    sortOrder: number;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface ProductExtended extends Product {
    description?: string;
    sku?: string;
    barcode?: string;
    productType: ProductType;
    purchasePrice?: number;
    minQuantity?: number;
    unit?: string;
    defaultSupplierId?: number;
    defaultSupplier?: Supplier;
    isActive: boolean;
    trackStock: boolean;
    createdAt: string;
    updatedAt: string;
    volumeMl?: number;
}

export interface ProductCardView {
    product: ProductExtended;
    pricing: {
        saleGross: number;
        saleNet: number;
        purchaseNet: number;
        purchaseGross: number;
        vatRate: number;
    };
    stock: {
        quantity: number;
        unit: string;
        minQuantity: number | null;
        stockValueNet: number;
        stockValueGross: number;
    };
    metadata: {
        category: string | null;
        manufacturer: string | null;
        packageSize: number | null;
        packageUnit: string | null;
        sku: string | null;
        barcode: string | null;
        createdAt: string;
        updatedAt: string;
    };
}

export interface ProductHistoryItem {
    id: string;
    source: 'sale' | 'usage' | 'delivery' | 'stocktaking' | 'adjustment';
    label: string;
    createdAt: string;
    quantity: number;
    quantityBefore: number | null;
    quantityAfter: number | null;
    unitPriceNet: number | null;
    unitPriceGross: number | null;
    totalNet: number | null;
    totalGross: number | null;
    vatRate: number | null;
    clientName: string | null;
    reference: {
        type: 'sale' | 'usage' | 'delivery' | 'stocktaking' | 'inventory';
        id: number;
        label: string;
        href: string;
    } | null;
    notes: string | null;
}

export interface ProductCommissionRule {
    id: number | null;
    employeeId: number;
    employeeName: string;
    commissionPercent: number;
}

export interface WarehouseSaleItem {
    id: number;
    saleId: number;
    productId: number | null;
    productName: string;
    quantity: number;
    unit: string;
    unitPriceNet: number;
    unitPriceGross: number;
    vatRate: number;
    discountGross: number;
    totalNet: number;
    totalGross: number;
    createdAt: string;
    product?: ProductExtended | null;
}

export interface WarehouseSale {
    id: number;
    saleNumber: string;
    soldAt: string;
    clientName?: string | null;
    clientId?: number | null;
    employeeId?: number | null;
    appointmentId?: number | null;
    discountGross: number;
    totalNet: number;
    totalGross: number;
    paymentMethod?: string | null;
    notes?: string | null;
    createdById?: number | null;
    items: WarehouseSaleItem[];
    employee?: { id: number; name: string } | null;
    createdBy?: { id: number; name: string } | null;
    summary?: {
        totalItems: number;
        totalNet: number;
        totalGross: number;
        discountGross: number;
    };
    createdAt: string;
    updatedAt: string;
}

export interface WarehouseUsageItem {
    id: number;
    usageId: number;
    productId: number | null;
    productName: string;
    quantity: number;
    unit: string;
    stockBefore: number;
    stockAfter: number;
    createdAt: string;
    product?: ProductExtended | null;
}

export interface WarehouseUsage {
    id: number;
    usageNumber: string;
    usedAt: string;
    scope?: 'planned' | 'completed';
    clientName?: string | null;
    clientId?: number | null;
    employeeId?: number | null;
    appointmentId?: number | null;
    notes?: string | null;
    createdById?: number | null;
    items: WarehouseUsageItem[];
    employee?: { id: number; name: string } | null;
    createdBy?: { id: number; name: string } | null;
    summary?: {
        totalItems: number;
    };
    createdAt: string;
    updatedAt: string;
}

export type WarehouseOrderStatus =
    | 'draft'
    | 'sent'
    | 'partially_received'
    | 'received'
    | 'cancelled';

export interface WarehouseOrderItem {
    id: number;
    orderId: number;
    productId: number | null;
    productName: string;
    quantity: number;
    unit: string;
    receivedQuantity: number;
    createdAt: string;
    product?: ProductExtended | null;
}

export interface WarehouseOrder {
    id: number;
    orderNumber: string;
    supplierId: number | null;
    supplier?: Supplier | null;
    status: WarehouseOrderStatus;
    sentAt: string | null;
    receivedAt: string | null;
    notes?: string | null;
    createdById: number | null;
    createdBy?: { id: number; name: string } | null;
    items: WarehouseOrderItem[];
    createdAt: string;
    updatedAt: string;
}

export interface DeliveryItem {
    id: number;
    deliveryId: number;
    productId: number;
    product?: ProductExtended;
    quantity: number;
    unitCost: number;
    totalCost: number;
    batchNumber?: string;
    expiryDate?: string;
    createdAt: string;
}

export interface Delivery {
    id: number;
    deliveryNumber: string;
    supplierId?: number;
    supplier?: Supplier;
    status: DeliveryStatus;
    deliveryDate?: string;
    receivedDate?: string;
    invoiceNumber?: string;
    totalCost: number;
    notes?: string;
    receivedById?: number;
    receivedBy?: { id: number; name: string };
    items: DeliveryItem[];
    createdAt: string;
    updatedAt: string;
}

export interface StocktakingItem {
    id: number;
    stocktakingId: number;
    productId: number;
    product?: ProductExtended;
    systemQuantity: number;
    countedQuantity?: number;
    difference?: number;
    notes?: string;
    createdAt: string;
}

export interface Stocktaking {
    id: number;
    stocktakingNumber: string;
    status: StocktakingStatus;
    stocktakingDate: string;
    notes?: string;
    createdById?: number;
    createdBy?: { id: number; name: string };
    completedById?: number;
    completedBy?: { id: number; name: string };
    completedAt?: string;
    items: StocktakingItem[];
    createdAt: string;
    updatedAt: string;
}

export interface ProductMovement {
    id: number;
    productId: number;
    product?: ProductExtended;
    movementType: MovementType;
    quantity: number;
    quantityBefore: number;
    quantityAfter: number;
    deliveryId?: number;
    stocktakingId?: number;
    appointmentId?: number;
    createdById?: number;
    createdBy?: { id: number; name: string };
    notes?: string;
    createdAt: string;
}

// Stock Alerts types
export type StockAlertPriority = 'critical' | 'high' | 'medium' | 'low';

export interface LowStockProduct {
    id: number;
    name: string;
    brand: string | null;
    sku: string | null;
    barcode: string | null;
    productType: ProductType;
    stock: number;
    minQuantity: number;
    unit: string | null;
    deficit: number;
    deficitPercentage: number;
    purchasePrice: number | null;
    defaultSupplierId: number | null;
    defaultSupplierName: string | null;
}

export interface ReorderSuggestion {
    productId: number;
    productName: string;
    brand: string | null;
    sku: string | null;
    currentStock: number;
    minQuantity: number;
    suggestedOrderQuantity: number;
    estimatedCost: number | null;
    supplierId: number | null;
    supplierName: string | null;
    priority: StockAlertPriority;
}

export interface StockAlertsSummary {
    totalLowStock: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    estimatedTotalReorderCost: number | null;
    lastCheckedAt: string;
}

export interface StockAlertsResponse {
    summary: StockAlertsSummary;
    lowStockProducts: LowStockProduct[];
    reorderSuggestions: ReorderSuggestion[];
}

export interface StockSummary {
    totalProducts: number;
    trackedProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    healthyStockCount: number;
}

// Visit Finalization types
export interface ProductSaleItem {
    productId: number;
    quantity: number;
    unitPriceCents?: number;
    discountCents?: number;
}

export interface FinalizeAppointmentRequest {
    paymentMethod: PaymentMethod;
    paidAmountCents: number;
    tipAmountCents?: number;
    discountCents?: number;
    products?: ProductSaleItem[];
    note?: string;
}

export interface FinalizationSummary {
    servicePrice: number;
    discount: number;
    tip: number;
    productsTotal: number;
    grandTotal: number;
}

// Timetable types
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // Mon=0, Sun=6
export type ExceptionType =
    | 'day_off'
    | 'vacation'
    | 'sick_leave'
    | 'training'
    | 'custom_hours'
    | 'other';

export interface TimetableSlot {
    id: number;
    timetableId: number;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    isBreak: boolean;
    notes?: string;
}

export interface TimetableException {
    id: number;
    timetableId: number;
    date: string;
    type: ExceptionType;
    title?: string;
    reason?: string;
    customStartTime?: string;
    customEndTime?: string;
    isAllDay: boolean;
    isPending: boolean;
    createdBy?: { id: number; name: string };
    approvedBy?: { id: number; name: string };
    approvedAt?: string;
    createdAt: string;
}

export interface Timetable {
    id: number;
    employeeId: number;
    employee?: Employee;
    name: string;
    description?: string;
    validFrom: string;
    validTo?: string;
    isActive: boolean;
    slots: TimetableSlot[];
    exceptions?: TimetableException[];
    createdAt: string;
    updatedAt: string;
}

export interface AvailabilitySlot {
    date: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    isException: boolean;
    exceptionType?: ExceptionType;
    isAvailable: boolean;
}

export interface EmployeeAvailability {
    employeeId: number;
    employeeName: string;
    from: string;
    to: string;
    slots: AvailabilitySlot[];
}

// SMS/Communication types
export type TemplateType =
    | 'appointment_reminder'
    | 'appointment_confirmation'
    | 'appointment_cancellation'
    | 'birthday_wish'
    | 'follow_up'
    | 'marketing'
    | 'custom';

export type MessageChannel = 'sms' | 'email' | 'whatsapp';
export type SmsStatus =
    | 'pending'
    | 'sent'
    | 'delivered'
    | 'failed'
    | 'rejected';

export interface MessageTemplate {
    id: number;
    name: string;
    type: TemplateType;
    channel: MessageChannel;
    content: string;
    subject?: string;
    description?: string;
    isActive: boolean;
    isDefault: boolean;
    availableVariables?: string[];
    createdAt: string;
    updatedAt: string;
}

export interface SmsLog {
    id: number;
    recipient: string;
    channel: MessageChannel;
    content: string;
    subject?: string;
    status: SmsStatus;
    externalId?: string;
    errorMessage?: string;
    partsCount: number;
    cost: number;
    templateId?: number;
    template?: MessageTemplate;
    recipientId?: number;
    recipientUser?: { id: number; name: string };
    appointmentId?: number;
    sentById?: number;
    sentBy?: { id: number; name: string };
    sentAt?: string;
    deliveredAt?: string;
    createdAt: string;
}

export interface SmsStats {
    totalSent: number;
    totalDelivered: number;
    totalFailed: number;
    totalCost: number;
    byChannel: Record<string, number>;
}

// Statistics types
export const DateRange = {
    Today: 'today',
    Yesterday: 'yesterday',
    ThisWeek: 'this_week',
    LastWeek: 'last_week',
    ThisMonth: 'this_month',
    LastMonth: 'last_month',
    ThisYear: 'this_year',
    Custom: 'custom',
} as const;
export type DateRange = (typeof DateRange)[keyof typeof DateRange];

export const GroupBy = {
    Day: 'day',
    Week: 'week',
    Month: 'month',
} as const;
export type GroupBy = (typeof GroupBy)[keyof typeof GroupBy];

export interface DashboardStats {
    todayRevenue: number;
    todayAppointments: number;
    todayCompletedAppointments: number;
    todayNewClients: number;
    weekRevenue: number;
    weekAppointments: number;
    monthRevenue: number;
    monthAppointments: number;
    pendingAppointments: number;
    averageRating: number;
}

export interface RevenueDataPoint {
    date: string;
    label: string;
    revenue: number;
    appointments: number;
    tips: number;
    products: number;
}

export interface EmployeeStats {
    employeeId: number;
    employeeName: string;
    revenue: number;
    appointments: number;
    completedAppointments: number;
    averageDuration: number;
    averageRevenue: number;
    tips: number;
    rating: number;
    reviewCount: number;
}

export interface CommissionReportSummary {
    totalCommissions: number;
    totalBaseAmount: number;
    byEmployee: Array<{
        employeeId: number;
        employeeName: string;
        commissionAmount: number;
        baseAmount: number;
        appointmentsCount: number;
    }>;
}

export interface ServiceStats {
    serviceId: number;
    serviceName: string;
    categoryName: string | null;
    bookingCount: number;
    revenue: number;
    averagePrice: number;
    averageDuration: number;
}

export interface ClientStatsData {
    newClients: number;
    returningClients: number;
    totalVisits: number;
    averageVisitsPerClient: number;
    topClients: Array<{
        clientId: number;
        clientName: string;
        visits: number;
        totalSpent: number;
    }>;
}

export interface CashRegisterEntry {
    id: number;
    time: string;
    type: 'appointment' | 'product' | 'other';
    description: string;
    paymentMethod: string;
    amount: number;
    tip: number;
    employeeName: string | null;
    clientName: string | null;
}

export interface CashRegisterSummary {
    date: string;
    entries: CashRegisterEntry[];
    totals: {
        cash: number;
        card: number;
        transfer: number;
        online: number;
        voucher: number;
        total: number;
        tips: number;
    };
}

export interface TipsSummary {
    employeeId: number;
    employeeName: string;
    tipsCount: number;
    tipsTotal: number;
    averageTip: number;
}

// Automatic Messages types
export const AutomaticMessageTrigger = {
    AppointmentReminder: 'appointment_reminder',
    AppointmentConfirmation: 'appointment_confirmation',
    AppointmentCancellation: 'appointment_cancellation',
    FollowUp: 'follow_up',
    Birthday: 'birthday',
    InactiveClient: 'inactive_client',
    NewClient: 'new_client',
    ReviewRequest: 'review_request',
} as const;
export type AutomaticMessageTrigger =
    (typeof AutomaticMessageTrigger)[keyof typeof AutomaticMessageTrigger];

export const AutomaticMessageChannel = {
    Sms: 'sms',
    Email: 'email',
    Whatsapp: 'whatsapp',
} as const;
export type AutomaticMessageChannel =
    (typeof AutomaticMessageChannel)[keyof typeof AutomaticMessageChannel];

export interface AutomaticMessageRule {
    id: number;
    name: string;
    description: string | null;
    trigger: AutomaticMessageTrigger;
    channel: AutomaticMessageChannel;
    offsetHours: number;
    inactivityDays: number | null;
    sendWindowStart: string;
    sendWindowEnd: string;
    templateId: number | null;
    templateName?: string | null;
    content: string | null;
    serviceIds: number[] | null;
    employeeIds: number[] | null;
    requireSmsConsent: boolean;
    requireEmailConsent: boolean;
    isActive: boolean;
    sentCount: number;
    lastSentAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAutomaticMessageRuleRequest {
    name: string;
    description?: string;
    trigger: AutomaticMessageTrigger;
    channel?: AutomaticMessageChannel;
    offsetHours?: number;
    inactivityDays?: number;
    sendWindowStart?: string;
    sendWindowEnd?: string;
    templateId?: number;
    content?: string;
    serviceIds?: number[];
    employeeIds?: number[];
    requireSmsConsent?: boolean;
    requireEmailConsent?: boolean;
    isActive?: boolean;
}

export interface UpdateAutomaticMessageRuleRequest {
    name?: string;
    description?: string;
    trigger?: AutomaticMessageTrigger;
    channel?: AutomaticMessageChannel;
    offsetHours?: number;
    inactivityDays?: number;
    sendWindowStart?: string;
    sendWindowEnd?: string;
    templateId?: number | null;
    content?: string | null;
    serviceIds?: number[] | null;
    employeeIds?: number[] | null;
    requireSmsConsent?: boolean;
    requireEmailConsent?: boolean;
    isActive?: boolean;
}

export interface ProcessAutomaticMessagesResult {
    trigger: AutomaticMessageTrigger;
    processed: number;
    sent: number;
    skipped: number;
    errors: number;
    details?: string[];
}

// Newsletter types
export type NewsletterStatus =
    | 'draft'
    | 'scheduled'
    | 'sending'
    | 'sent'
    | 'partial_failure'
    | 'failed'
    | 'cancelled';
export type NewsletterChannel = 'email' | 'sms';
export type RecipientStatus =
    | 'pending'
    | 'sent'
    | 'delivered'
    | 'opened'
    | 'clicked'
    | 'bounced'
    | 'failed'
    | 'unsubscribed';

export interface RecipientFilter {
    groupIds?: number[];
    tagIds?: number[];
    gender?: 'male' | 'female' | 'other';
    ageMin?: number;
    ageMax?: number;
    hasEmailConsent?: boolean;
    hasSmsConsent?: boolean;
    lastVisitAfter?: string;
    lastVisitBefore?: string;
}

export interface Newsletter {
    id: number;
    name: string;
    subject: string;
    content: string;
    plainTextContent: string | null;
    channel: NewsletterChannel;
    status: NewsletterStatus;
    scheduledAt: string | null;
    sentAt: string | null;
    totalRecipients: number;
    sentCount: number;
    deliveredCount: number;
    failedCount: number;
    openedCount: number;
    clickedCount: number;
    recipientFilter: RecipientFilter | null;
    recipientIds: number[] | null;
    createdBy: { id: number; name: string } | null;
    sentBy: { id: number; name: string } | null;
    createdAt: string;
    updatedAt: string;
}

export interface NewsletterRecipient {
    id: number;
    recipientId: number | null;
    recipientEmail: string;
    recipientName: string | null;
    status: RecipientStatus;
    sentAt: string | null;
    deliveredAt: string | null;
    openedAt: string | null;
    clickedAt: string | null;
    errorMessage: string | null;
}

export interface NewsletterStats {
    totalNewsletters: number;
    sentNewsletters: number;
    draftNewsletters: number;
    totalRecipients: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    averageOpenRate: number;
    averageClickRate: number;
}

export interface CreateNewsletterRequest {
    name: string;
    subject: string;
    content: string;
    plainTextContent?: string;
    channel?: NewsletterChannel;
    recipientFilter?: RecipientFilter;
    recipientIds?: number[];
    scheduledAt?: string;
}

export interface UpdateNewsletterRequest {
    name?: string;
    subject?: string;
    content?: string;
    plainTextContent?: string;
    channel?: NewsletterChannel;
    recipientFilter?: RecipientFilter;
    recipientIds?: number[];
    scheduledAt?: string;
}

export interface RecipientPreview {
    totalCount: number;
    recipients: Array<{
        id: number;
        name: string;
        email: string;
    }>;
}

// Settings types
export interface BranchSettings {
    id: number;
    companyName: string;
    displayName: string | null;
    nip: string | null;
    regon: string | null;
    street: string | null;
    buildingNumber: string | null;
    apartmentNumber: string | null;
    postalCode: string | null;
    city: string | null;
    country: string | null;
    phone: string | null;
    phoneSecondary: string | null;
    email: string | null;
    website: string | null;
    facebookUrl: string | null;
    instagramUrl: string | null;
    tiktokUrl: string | null;
    logoUrl: string | null;
    primaryColor: string;
    currency: string;
    locale: string;
    timezone: string;
    defaultVatRate: number;
    isVatPayer: boolean;
    receiptFooter: string | null;
    invoiceNotes: string | null;
    invoicePaymentDays: number;
    gdprDataRetentionDays: number;
    gdprConsentText: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CalendarSettings {
    id: number;
    defaultView: CalendarView;
    timeSlotDuration: number;
    defaultStartTime: string;
    defaultEndTime: string;
    showWeekends: boolean;
    weekStartsOn: number;
    showEmployeePhotos: boolean;
    showServiceColors: boolean;
    compactView: boolean;
    allowOverlappingAppointments: boolean;
    minAppointmentDuration: number;
    maxAppointmentDuration: number;
    bufferTimeBefore: number;
    bufferTimeAfter: number;
    minBookingAdvanceHours: number;
    maxBookingAdvanceDays: number;
    allowSameDayBooking: boolean;
    cancellationDeadlineHours: number;
    allowClientReschedule: boolean;
    rescheduleDeadlineHours: number;
    reminderEnabled: boolean;
    reminderHoursBefore: number;
    secondReminderEnabled: boolean;
    secondReminderHoursBefore: number;
    autoMarkNoshowAfterMinutes: number;
    noshowPenaltyEnabled: boolean;
    statusColors: Record<string, string>;
    createdAt: string;
    updatedAt: string;
}

export interface OnlineBookingSettings {
    id: number;
    isEnabled: boolean;
    bookingPageUrl: string | null;
    requirePhone: boolean;
    requireEmail: boolean;
    allowGuestBooking: boolean;
    requireAccount: boolean;
    showPrices: boolean;
    showDuration: boolean;
    allowMultipleServices: boolean;
    maxServicesPerBooking: number;
    allowEmployeeSelection: boolean;
    showEmployeePhotosOnline: boolean;
    autoAssignEmployee: boolean;
    onlineSlotDuration: number;
    showFirstAvailable: boolean;
    requireConfirmation: boolean;
    autoConfirm: boolean;
    sendConfirmationEmail: boolean;
    sendConfirmationSms: boolean;
    requirePrepayment: boolean;
    prepaymentPercentage: number;
    acceptOnlinePayments: boolean;
    showCancellationPolicy: boolean;
    cancellationPolicyText: string | null;
    welcomeMessage: string | null;
    confirmationMessage: string | null;
    bookingNotesPlaceholder: string | null;
    blockedServices: number[];
    blockedEmployees: number[];
    widgetTheme: string;
    widgetPrimaryColor: string | null;
    widgetBorderRadius: number;
    createdAt: string;
    updatedAt: string;
}

export interface AllSettings {
    branch: BranchSettings;
    calendar: CalendarSettings;
    onlineBooking: OnlineBookingSettings;
}

export interface UpdateBranchSettingsRequest {
    companyName?: string;
    displayName?: string;
    nip?: string;
    regon?: string;
    street?: string;
    buildingNumber?: string;
    apartmentNumber?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    phone?: string;
    phoneSecondary?: string;
    email?: string;
    website?: string;
    facebookUrl?: string;
    instagramUrl?: string;
    tiktokUrl?: string;
    logoUrl?: string;
    primaryColor?: string;
    currency?: string;
    locale?: string;
    timezone?: string;
    defaultVatRate?: number;
    isVatPayer?: boolean;
    receiptFooter?: string;
    invoiceNotes?: string;
    invoicePaymentDays?: number;
    gdprDataRetentionDays?: number;
    gdprConsentText?: string;
}

export interface UpdateCalendarSettingsRequest {
    defaultView?: CalendarView;
    timeSlotDuration?: number;
    defaultStartTime?: string;
    defaultEndTime?: string;
    showWeekends?: boolean;
    weekStartsOn?: number;
    showEmployeePhotos?: boolean;
    showServiceColors?: boolean;
    compactView?: boolean;
    allowOverlappingAppointments?: boolean;
    minAppointmentDuration?: number;
    maxAppointmentDuration?: number;
    bufferTimeBefore?: number;
    bufferTimeAfter?: number;
    minBookingAdvanceHours?: number;
    maxBookingAdvanceDays?: number;
    allowSameDayBooking?: boolean;
    cancellationDeadlineHours?: number;
    allowClientReschedule?: boolean;
    rescheduleDeadlineHours?: number;
    reminderEnabled?: boolean;
    reminderHoursBefore?: number;
    secondReminderEnabled?: boolean;
    secondReminderHoursBefore?: number;
    autoMarkNoshowAfterMinutes?: number;
    noshowPenaltyEnabled?: boolean;
    statusColors?: Record<string, string>;
}

export interface UpdateOnlineBookingSettingsRequest {
    isEnabled?: boolean;
    bookingPageUrl?: string;
    requirePhone?: boolean;
    requireEmail?: boolean;
    allowGuestBooking?: boolean;
    requireAccount?: boolean;
    showPrices?: boolean;
    showDuration?: boolean;
    allowMultipleServices?: boolean;
    maxServicesPerBooking?: number;
    allowEmployeeSelection?: boolean;
    showEmployeePhotosOnline?: boolean;
    autoAssignEmployee?: boolean;
    onlineSlotDuration?: number;
    showFirstAvailable?: boolean;
    requireConfirmation?: boolean;
    autoConfirm?: boolean;
    sendConfirmationEmail?: boolean;
    sendConfirmationSms?: boolean;
    requirePrepayment?: boolean;
    prepaymentPercentage?: number;
    acceptOnlinePayments?: boolean;
    showCancellationPolicy?: boolean;
    cancellationPolicyText?: string;
    welcomeMessage?: string;
    confirmationMessage?: string;
    bookingNotesPlaceholder?: string;
    blockedServices?: number[];
    blockedEmployees?: number[];
    widgetTheme?: string;
    widgetPrimaryColor?: string;
    widgetBorderRadius?: number;
}

// Branch / Multi-location types
export type BranchStatus = 'active' | 'inactive' | 'suspended';

export interface WorkingHours {
    open: string;
    close: string;
}

export interface Branch {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    phone: string | null;
    email: string | null;
    street: string | null;
    buildingNumber: string | null;
    apartmentNumber: string | null;
    postalCode: string | null;
    city: string | null;
    country: string | null;
    latitude: number | null;
    longitude: number | null;
    logoUrl: string | null;
    coverImageUrl: string | null;
    primaryColor: string;
    workingHours: Record<string, WorkingHours | null>;
    timezone: string;
    currency: string;
    locale: string;
    status: BranchStatus;
    onlineBookingEnabled: boolean;
    bookingUrl: string | null;
    ownerId: number | null;
    owner: { id: number; name: string } | null;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface BranchMember {
    id: number;
    branchId: number;
    userId: number;
    user: { id: number; name: string; email: string };
    branchRole: string;
    isPrimary: boolean;
    canManage: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateBranchRequest {
    name: string;
    slug?: string;
    description?: string;
    phone?: string;
    email?: string;
    street?: string;
    buildingNumber?: string;
    apartmentNumber?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    logoUrl?: string;
    coverImageUrl?: string;
    primaryColor?: string;
    workingHours?: Record<string, WorkingHours | null>;
    timezone?: string;
    currency?: string;
    locale?: string;
    onlineBookingEnabled?: boolean;
    bookingUrl?: string;
}

export interface UpdateBranchRequest {
    name?: string;
    slug?: string;
    description?: string;
    phone?: string;
    email?: string;
    street?: string;
    buildingNumber?: string;
    apartmentNumber?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    logoUrl?: string;
    coverImageUrl?: string;
    primaryColor?: string;
    workingHours?: Record<string, WorkingHours | null>;
    timezone?: string;
    currency?: string;
    locale?: string;
    status?: BranchStatus;
    onlineBookingEnabled?: boolean;
    bookingUrl?: string;
    sortOrder?: number;
}

export interface AddBranchMemberRequest {
    userId: number;
    branchRole?: string;
    isPrimary?: boolean;
    canManage?: boolean;
}

export interface CrossBranchStats {
    totalBranches: number;
    branches: Array<{
        id: number;
        name: string;
        city: string | null;
        status: BranchStatus;
    }>;
}

// Gift Card types
export type GiftCardStatus = 'active' | 'used' | 'expired' | 'cancelled';
export type GiftCardTransactionType =
    | 'purchase'
    | 'redemption'
    | 'refund'
    | 'adjustment'
    | 'expiration';

export interface GiftCardTransaction {
    id: number;
    giftCardId: number;
    type: GiftCardTransactionType;
    amount: number;
    balanceAfter: number;
    appointmentId: number | null;
    performedById: number | null;
    performedBy: { id: number; name: string } | null;
    notes: string | null;
    createdAt: string;
}

export interface GiftCard {
    id: number;
    code: string;
    initialValue: number;
    currentBalance: number;
    currency: string;
    status: GiftCardStatus;
    validFrom: string;
    validUntil: string;
    purchasedById: number | null;
    purchasedBy: { id: number; name: string } | null;
    purchaserName: string | null;
    purchaserEmail: string | null;
    recipientId: number | null;
    recipient: { id: number; name: string } | null;
    recipientName: string | null;
    recipientEmail: string | null;
    message: string | null;
    templateId: string | null;
    allowedServices: number[];
    minPurchaseAmount: number | null;
    notes: string | null;
    soldById: number | null;
    soldBy: { id: number; name: string } | null;
    soldAt: string | null;
    transactions?: GiftCardTransaction[];
    createdAt: string;
    updatedAt: string;
}

export interface GiftCardStats {
    totalCards: number;
    activeCards: number;
    totalValue: number;
    usedValue: number;
    outstandingValue: number;
}

export interface GiftCardValidation {
    valid: boolean;
    reason?: string;
    giftCard?: {
        code: string;
        currentBalance: number;
        validUntil: string;
        allowedServices: number[];
    };
}

export interface CreateGiftCardRequest {
    initialValue: number;
    currency?: string;
    validFrom: string;
    validUntil: string;
    purchasedById?: number;
    purchaserName?: string;
    purchaserEmail?: string;
    recipientId?: number;
    recipientName?: string;
    recipientEmail?: string;
    message?: string;
    templateId?: string;
    allowedServices?: number[];
    minPurchaseAmount?: number;
    notes?: string;
}

export interface UpdateGiftCardRequest {
    status?: GiftCardStatus;
    validUntil?: string;
    recipientId?: number;
    recipientName?: string;
    recipientEmail?: string;
    message?: string;
    allowedServices?: number[];
    minPurchaseAmount?: number;
    notes?: string;
}

export interface RedeemGiftCardRequest {
    code: string;
    amount: number;
    appointmentId?: number;
    notes?: string;
}

export interface AdjustGiftCardBalanceRequest {
    amount: number;
    notes: string;
}

export interface GiftCardQueryParams {
    status?: GiftCardStatus;
    recipientId?: number;
    purchasedById?: number;
    code?: string;
    page?: number;
    limit?: number;
}

// Loyalty Program types
export type LoyaltyTransactionType =
    | 'earn'
    | 'spend'
    | 'expire'
    | 'adjust'
    | 'bonus'
    | 'referral';
export type LoyaltyTransactionSource =
    | 'appointment'
    | 'product_purchase'
    | 'reward'
    | 'birthday'
    | 'referral'
    | 'signup'
    | 'manual'
    | 'expiration';
export type RewardType =
    | 'discount'
    | 'free_service'
    | 'free_product'
    | 'gift_card'
    | 'custom';

export interface TierThreshold {
    name: string;
    minPoints: number;
    multiplier: number;
}

export interface LoyaltyProgram {
    id: number;
    name: string;
    description: string | null;
    pointsPerCurrency: number;
    minPointsPerVisit: number;
    maxPointsPerVisit: number | null;
    birthdayBonusPoints: number;
    referralBonusPoints: number;
    signupBonusPoints: number;
    pointsValueCurrency: number;
    minPointsRedemption: number;
    pointsExpireMonths: number | null;
    enableTiers: boolean;
    tierThresholds: TierThreshold[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface LoyaltyBalance {
    userId: number;
    userName: string;
    currentBalance: number;
    totalPointsEarned: number;
    totalPointsSpent: number;
    lifetimeTierPoints: number;
    currentTier: string | null;
    tierMultiplier: number;
    pointsValue: number;
}

export interface LoyaltyTransaction {
    id: number;
    userId: number;
    user?: { id: number; name: string };
    type: LoyaltyTransactionType;
    source: LoyaltyTransactionSource;
    points: number;
    balanceAfter: number;
    appointmentId: number | null;
    rewardId: number | null;
    referralUserId: number | null;
    description: string | null;
    performedById: number | null;
    performedBy: { id: number; name: string } | null;
    expiresAt: string | null;
    isExpired: boolean;
    createdAt: string;
}

export interface LoyaltyReward {
    id: number;
    name: string;
    description: string | null;
    type: RewardType;
    pointsCost: number;
    discountPercent: number | null;
    discountAmount: number | null;
    serviceId: number | null;
    productId: number | null;
    giftCardValue: number | null;
    isActive: boolean;
    availableFrom: string | null;
    availableUntil: string | null;
    maxRedemptions: number | null;
    currentRedemptions: number;
    imageUrl: string | null;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}

export interface LoyaltyRewardRedemption {
    id: number;
    userId: number;
    rewardId: number;
    reward?: LoyaltyReward;
    pointsSpent: number;
    transactionId: number;
    status: string;
    usedAt: string | null;
    usedAppointmentId: number | null;
    expiresAt: string | null;
    redemptionCode: string;
    processedById: number | null;
    createdAt: string;
}

export interface LoyaltyStats {
    totalMembers: number;
    activeMembers: number;
    totalPointsIssued: number;
    totalPointsRedeemed: number;
    totalRewardsRedeemed: number;
    outstandingPoints: number;
    outstandingValue: number;
}

export interface UpdateLoyaltyProgramRequest {
    name?: string;
    description?: string;
    pointsPerCurrency?: number;
    minPointsPerVisit?: number;
    maxPointsPerVisit?: number;
    birthdayBonusPoints?: number;
    referralBonusPoints?: number;
    signupBonusPoints?: number;
    pointsValueCurrency?: number;
    minPointsRedemption?: number;
    pointsExpireMonths?: number;
    enableTiers?: boolean;
    tierThresholds?: TierThreshold[];
    isActive?: boolean;
}

export interface CreateRewardRequest {
    name: string;
    description?: string;
    type: RewardType;
    pointsCost: number;
    discountPercent?: number;
    discountAmount?: number;
    serviceId?: number;
    productId?: number;
    giftCardValue?: number;
    availableFrom?: string;
    availableUntil?: string;
    maxRedemptions?: number;
    imageUrl?: string;
    sortOrder?: number;
}

export interface UpdateRewardRequest {
    name?: string;
    description?: string;
    pointsCost?: number;
    discountPercent?: number;
    discountAmount?: number;
    serviceId?: number;
    productId?: number;
    giftCardValue?: number;
    isActive?: boolean;
    availableFrom?: string;
    availableUntil?: string;
    maxRedemptions?: number;
    imageUrl?: string;
    sortOrder?: number;
}

export interface AwardPointsRequest {
    userId: number;
    points: number;
    source: LoyaltyTransactionSource;
    appointmentId?: number;
    referralUserId?: number;
    description?: string;
}

export interface AdjustPointsRequest {
    points: number;
    description: string;
}

export interface RedeemRewardRequest {
    rewardId: number;
}

export interface UseCouponRequest {
    redemptionCode: string;
    appointmentId?: number;
}

export interface LoyaltyTransactionQueryParams {
    userId?: number;
    type?: LoyaltyTransactionType;
    source?: LoyaltyTransactionSource;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
}

export interface RewardQueryParams {
    type?: RewardType;
    isActive?: boolean;
    page?: number;
    limit?: number;
}

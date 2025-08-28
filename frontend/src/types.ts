export interface Client {
    id: number;
    name: string;
}

export type Role = 'client' | 'employee' | 'receptionist' | 'admin';

export interface User {
    id: number;
    email: string;
    name: string;
    role: Role;
}

export interface Appointment {
    id: number;
    startTime: string;
    client?: Client;
    service?: Service;
    employee?: Employee;
    paymentStatus?: string;
}

export interface Service {
    id: number;
    name: string;
    duration: number;
    price: number;
    category?: Category | null;
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
}

export interface Product {
    id: number;
    name: string;
    brand?: string;
    unitPrice: number;
    stock: number;
    lowStockThreshold: number;
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

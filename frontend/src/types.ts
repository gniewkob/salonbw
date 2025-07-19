export interface Client {
  id: number;
  name: string;
}

export interface Appointment {
  id: number;
  startTime: string;
  client?: Client;
}

export interface Service {
  id: number;
  name: string;
}

export interface Employee {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  brand?: string;
  unitPrice: number;
  stock: number;
}

export interface Review {
  id: number;
  reservationId: number;
  rating: number;
  comment?: string;
}

export interface DashboardResponse {
  clientCount: number;
  todayCount: number;
  employeeCount: number;
  upcoming: Appointment[];
}

export interface Notification {
  id: number;
  message: string;
  createdAt: string;
}

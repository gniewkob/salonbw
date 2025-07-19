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

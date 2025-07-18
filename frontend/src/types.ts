export interface Client {
  id: number;
  name: string;
}

export interface Appointment {
  id: number;
  date: string;
  clientId: number;
}

export interface Service {
  id: number;
  name: string;
}

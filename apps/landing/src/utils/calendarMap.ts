import type { Appointment, Employee, Service } from '@/types';

export type CalendarEvent = {
    id: string;
    title: string;
    start: string;
    end?: string;
    backgroundColor?: string;
    borderColor?: string;
    extendedProps?: Record<string, unknown>;
};

export function colorFor(empId?: number, status?: string): string {
    if (status === 'completed') return '#16a34a';
    if (status === 'cancelled') return '#9ca3af';
    if (!empId) return '#60a5fa';
    const hues = [200, 260, 20, 340, 120, 180, 300, 30];
    const h = hues[empId % hues.length];
    return `hsl(${h} 70% 60%)`;
}

export function mapAppointmentsToEvents(
    data: Appointment[],
    services: Service[] = [],
    employees: Employee[] = [],
    employeeFilter: number | 'all' = 'all',
): CalendarEvent[] {
    const svcMap = new Map(services.map((s) => [s.id, s]));
    const empMap = new Map(employees.map((e) => [e.id, e]));

    return data
        .filter((a) =>
            employeeFilter !== 'all' ? a.employee?.id === employeeFilter : true,
        )
        .map((a) => {
            const svc = a.service?.id ? svcMap.get(a.service.id) : undefined;
            const emp = a.employee?.id ? empMap.get(a.employee.id) : undefined;
            const end = (a as unknown as { endTime?: string }).endTime;
            const title = `${a.client?.name ?? ''}${a.client?.name ? ' – ' : ''}${
                a.service?.name ?? ''
            }${emp?.name ? ` (${emp.name})` : ''}`;
            const bg = colorFor(a.employee?.id, a.paymentStatus);
            return {
                id: String(a.id),
                title: title || `#${a.id}`,
                start: a.startTime,
                end,
                backgroundColor: bg,
                borderColor: bg,
                extendedProps: {
                    appointment: a,
                    service: svc as unknown as Record<string, unknown>,
                    employee: emp as unknown as Record<string, unknown>,
                },
            } satisfies CalendarEvent;
        });
}

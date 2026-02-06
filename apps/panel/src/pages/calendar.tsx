import { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import CalendarView from '@/components/calendar/CalendarView';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/hooks/useEmployees';
import { useAppointments } from '@/hooks/useAppointments';
import type { CalendarView as ViewType } from '@/types';

export default function CalendarPage() {
    const { role } = useAuth();
    const router = useRouter();
    const { date: dateParam } = router.query;

    // State
    const [view, setView] = useState<ViewType>('week');
    const [currentDate, setCurrentDate] = useState(
        dateParam ? new Date(dateParam as string) : new Date(),
    );
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>(
        [],
    );

    // Data
    const { data: employees = [] } = useEmployees();
    const { data: appointmentData, loading } = useAppointments(
        currentDate.toISOString().split('T')[0],
        currentDate.toISOString().split('T')[0], // Simplified range for demo
    );

    // Handlers
    const handleDateChange = useCallback((date: Date) => {
        setCurrentDate(date);
        // URL sync is handled inside Sidebar or here?
        // Sidebar has URL sync, so we just update local state if needed
        // but Sidebar uses router.push, which triggers page reload/prop update?
        // Ideally we sync both.
    }, []);

    const handleEventDrop = async (id: number, start: Date, end: Date) => {
        console.log('Update appointment', id, start, end);
        // Implement API call
    };

    return (
        <RouteGuard
            roles={['client', 'employee', 'receptionist', 'admin']}
            permission="nav:appointments"
        >
            <DashboardLayout>
                <div className="h-[calc(100vh-64px)] overflow-hidden flex flex-col">
                    <CalendarView
                        events={appointmentData || []}
                        employees={employees}
                        loading={loading}
                        currentDate={currentDate}
                        currentView={view}
                        selectedEmployeeIds={selectedEmployeeIds}
                        onEventClick={(e) => console.log('Click', e)}
                        onEventDrop={handleEventDrop}
                        onDateSelect={(start, end) =>
                            console.log('Select', start, end)
                        }
                        onDateChange={handleDateChange}
                        onViewChange={setView}
                        onEmployeeFilterChange={setSelectedEmployeeIds}
                    />
                </div>
            </DashboardLayout>
        </RouteGuard>
    );
}

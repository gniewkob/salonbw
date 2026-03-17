'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import RouteGuard from '@/components/RouteGuard';
import VersumShell from '@/components/versum/VersumShell';
import ManageCalendarViewsModal, {
    type CalendarViewDraft,
} from '@/components/versum/modals/ManageCalendarViewsModal';
import CreateCalendarViewModal from '@/components/versum/modals/CreateCalendarViewModal';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/hooks/useEmployees';

const STORAGE_KEY = 'salonbw.calendarViewDrafts';

type Props = {
    nestedCreate?: boolean;
};

function readDrafts(): CalendarViewDraft[] {
    if (typeof window === 'undefined') {
        return [];
    }

    try {
        const raw = window.sessionStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as CalendarViewDraft[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeDrafts(drafts: CalendarViewDraft[]) {
    if (typeof window === 'undefined') {
        return;
    }

    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

/**
 * Source route: `/calendar/views`
 * Classification: reconstructed + invented
 *
 * Reconstructed:
 * - modal `Zarządzaj widokami`
 * - empty state `Brak zdefiniowanych widoków`
 * - CTA `Utwórz nowy widok`
 * - nested modal `Utwórz nowy widok`
 * - fields: `Nazwa`, `Pracownicy (n)`, `zapisz`, `anuluj`
 *
 * Invented:
 * - local draft persistence in `sessionStorage`
 * - rendering the modal flow as direct Next.js routes
 * - returning to `/calendar` on close instead of relying on PJAX history
 */
export default function CalendarViewsRoute({ nestedCreate = false }: Props) {
    const { role } = useAuth();
    const router = useRouter();
    const { data: employees } = useEmployees();
    const [drafts, setDrafts] = useState<CalendarViewDraft[]>([]);

    useEffect(() => {
        setDrafts(readDrafts());
    }, []);

    const normalizedEmployees = useMemo(() => employees ?? [], [employees]);

    if (!role) return null;

    const handleCloseManage = () => {
        void router.push('/calendar');
    };

    const handleCloseCreate = () => {
        void router.push('/calendar/views');
    };

    const handleCreate = (payload: { name: string; employeeIds: number[] }) => {
        const selectedEmployees = normalizedEmployees.filter((employee) =>
            payload.employeeIds.includes(employee.id),
        );
        const nextDraft: CalendarViewDraft = {
            id: `${Date.now()}`,
            name: payload.name,
            employeeIds: payload.employeeIds,
            employeeNames: selectedEmployees.map((employee) => employee.name),
        };
        const nextDrafts = [...drafts, nextDraft];
        setDrafts(nextDrafts);
        writeDrafts(nextDrafts);
        void router.push('/calendar/views');
    };

    return (
        <RouteGuard permission="nav:calendar">
            <VersumShell role={role}>
                <div
                    className="versum-page"
                    data-testid="calendar-views-modal-route"
                />
                <ManageCalendarViewsModal
                    drafts={drafts}
                    onClose={handleCloseManage}
                />
                {nestedCreate ? (
                    <CreateCalendarViewModal
                        employees={normalizedEmployees}
                        onCancel={handleCloseCreate}
                        onSubmit={handleCreate}
                    />
                ) : null}
            </VersumShell>
        </RouteGuard>
    );
}

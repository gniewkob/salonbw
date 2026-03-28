'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import ManageCalendarViewsModal from '@/components/salon/modals/ManageCalendarViewsModal';
import CreateCalendarViewModal, {
    type CreateCalendarViewPayload,
} from '@/components/salon/modals/CreateCalendarViewModal';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/hooks/useEmployees';
import { useCalendarViews, useSettingsMutations } from '@/hooks/useSettings';

type Props = {
    nestedCreate?: boolean;
};

/**
 * Source route: `/calendar/views`
 * Classification: reconstructed + adapted
 *
 * Reconstructed:
 * - modal `Zarządzaj widokami`
 * - empty state `Brak zdefiniowanych widoków`
 * - CTA `Utwórz nowy widok`
 * - nested modal `Utwórz nowy widok`
 * - fields: `Nazwa`, `Pracownicy (n)`, `zapisz`, `anuluj`
 *
 * Known delta:
 * - modal flow nadal jest route-driven w Next.js zamiast PJAX partials source system
 * - zapis/opcje widoków idą przez backend SalonBW, nie przez legacy HTML contract
 */
export default function CalendarViewsRoute({ nestedCreate = false }: Props) {
    const { role } = useAuth();
    const router = useRouter();
    const editIdParam = router.query.edit;
    const editId =
        typeof editIdParam === 'string'
            ? Number.parseInt(editIdParam, 10)
            : NaN;
    const { data: employees } = useEmployees();
    const { data: views } = useCalendarViews();
    const { createCalendarView, updateCalendarView, deleteCalendarView } =
        useSettingsMutations();
    const [manageError, setManageError] = useState<string | null>(null);
    const [formError, setFormError] = useState<string | null>(null);

    const normalizedEmployees = useMemo(() => employees ?? [], [employees]);
    const normalizedViews = useMemo(() => {
        return (views ?? []).map((view) => ({
            ...view,
            employeeNames: view.employeeIds
                .map(
                    (employeeId) =>
                        normalizedEmployees.find(
                            (employee) => employee.id === employeeId,
                        )?.name,
                )
                .filter((name): name is string => Boolean(name)),
        }));
    }, [normalizedEmployees, views]);
    const editingView = useMemo(() => {
        if (!nestedCreate || Number.isNaN(editId)) {
            return null;
        }

        return normalizedViews.find((view) => view.id === editId) ?? null;
    }, [editId, nestedCreate, normalizedViews]);

    useEffect(() => {
        if (nestedCreate && editIdParam && !editingView && views?.length) {
            setFormError('Wybrany widok nie istnieje.');
        }
    }, [editIdParam, editingView, nestedCreate, views]);

    if (!role) return null;

    const handleCloseManage = () => {
        void router.push('/calendar');
    };

    const handleCloseCreate = () => {
        setFormError(null);
        void router.push('/calendar/views');
    };

    const handleOpenEdit = (viewId: number) => {
        setFormError(null);
        void router.push({
            pathname: '/calendar/views/new',
            query: { edit: String(viewId) },
        });
    };

    const handleDelete = (viewId: number) => {
        setManageError(null);
        deleteCalendarView.mutate(viewId, {
            onError: (error) => {
                setManageError(
                    error instanceof Error
                        ? error.message
                        : 'Nie udało się usunąć widoku.',
                );
            },
        });
    };

    const handleSubmit = (payload: CreateCalendarViewPayload) => {
        setFormError(null);
        const onSuccess = () => {
            void router.push('/calendar/views');
        };
        const onError = (error: unknown) => {
            setFormError(
                error instanceof Error
                    ? error.message
                    : 'Nie udało się zapisać widoku.',
            );
        };

        if (editingView) {
            updateCalendarView.mutate(
                {
                    id: editingView.id,
                    data: payload,
                },
                { onSuccess, onError },
            );
            return;
        }

        createCalendarView.mutate(payload, { onSuccess, onError });
    };

    return (
        <RouteGuard permission="nav:calendar">
            <SalonShell role={role}>
                <div
                    className="salonbw-page"
                    data-testid="calendar-views-modal-route"
                />
                <ManageCalendarViewsModal
                    views={normalizedViews}
                    error={manageError}
                    deletingId={deleteCalendarView.variables ?? null}
                    onEdit={handleOpenEdit}
                    onDelete={handleDelete}
                    onClose={handleCloseManage}
                />
                {nestedCreate ? (
                    <CreateCalendarViewModal
                        employees={normalizedEmployees}
                        initialValue={
                            editingView
                                ? {
                                      name: editingView.name,
                                      employeeIds: editingView.employeeIds,
                                  }
                                : undefined
                        }
                        title={
                            editingView ? 'Edytuj widok' : 'Utwórz nowy widok'
                        }
                        submitLabel={editingView ? 'zapisz zmiany' : 'zapisz'}
                        error={formError}
                        submitting={
                            createCalendarView.isPending ||
                            updateCalendarView.isPending
                        }
                        onCancel={handleCloseCreate}
                        onSubmit={handleSubmit}
                    />
                ) : null}
            </SalonShell>
        </RouteGuard>
    );
}

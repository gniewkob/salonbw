import { useState, useEffect, type ComponentProps } from 'react';
import dynamic from 'next/dynamic';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import DataTable, { Column } from '@/components/DataTable';
import Modal from '@/components/Modal';
import { useReviews } from '@/hooks/useReviews';
import { useReviewApi } from '@/api/reviews';
import { useAuth } from '@/contexts/AuthContext';
import { Review } from '@/types';

import type ReviewFormComponent from '@/components/ReviewForm';

const ReviewForm = dynamic<ComponentProps<typeof ReviewFormComponent>>(
    () => import('@/components/ReviewForm'),
    {
        ssr: false,
        loading: () => (
            <div className="salonbw-loading">Ładowanie formularza opinii…</div>
        ),
    },
);

export default function ReviewsPage() {
    const { role } = useAuth();
    const isAdmin = role === 'admin';
    const [employeeId, setEmployeeId] = useState(1);
    const { data } = useReviews(isAdmin ? { employeeId } : { mine: true });
    const api = useReviewApi();
    type Row = Review & {
        appointmentDisplay?: number | string;
        employeeName?: string;
        authorName?: string;
    };
    const [rows, setRows] = useState<Row[]>([]);
    const [openForm, setOpenForm] = useState(false);
    const [editing, setEditing] = useState<Row | null>(null);

    useEffect(() => {
        setRows(
            data.map((r) => ({
                ...r,
                appointmentDisplay: r.appointmentId ?? r.appointment?.id ?? '',
                employeeName: r.employee?.fullName ?? r.employee?.name,
                authorName: r.author?.name ?? r.customer?.name,
            })),
        );
    }, [data]);

    if (!role) return null;

    const columns: Column<Row>[] = [
        { header: 'ID', accessor: 'id' },
        { header: 'Wizyta', accessor: 'appointmentDisplay' },
        { header: 'Pracownik', accessor: 'employeeName' },
        { header: 'Autor', accessor: 'authorName' },
        { header: 'Ocena', accessor: 'rating' },
        { header: 'Komentarz', accessor: 'comment' },
    ];

    const handleCreate = async (values: {
        appointmentId: number;
        rating: number;
        comment?: string;
    }) => {
        const created = await api.create(values.appointmentId, {
            rating: values.rating,
            comment: values.comment,
        });
        setRows((c) => [
            ...c,
            {
                ...created,
                appointmentDisplay:
                    created.appointmentId ?? created.appointment?.id ?? '',
                employeeName:
                    created.employee?.fullName ?? created.employee?.name,
                authorName: created.author?.name ?? created.customer?.name,
            },
        ]);
        setOpenForm(false);
    };

    const handleUpdate = async (values: {
        appointmentId: number;
        rating: number;
        comment?: string;
    }) => {
        if (!editing) return;
        const updated = await api.update(editing.id, {
            rating: values.rating,
            comment: values.comment,
        });
        setRows((c) =>
            c.map((cl) =>
                cl.id === editing.id
                    ? {
                          ...updated,
                          appointmentDisplay:
                              updated.appointmentId ??
                              updated.appointment?.id ??
                              '',
                          employeeName:
                              updated.employee?.fullName ??
                              updated.employee?.name,
                          authorName:
                              updated.author?.name ?? updated.customer?.name,
                      }
                    : cl,
            ),
        );
        setEditing(null);
        setOpenForm(false);
    };

    const handleDelete = async (row: Row) => {
        if (!confirm(`Usunąć opinię #${row.id}?`)) return;
        await api.remove(row.id);
        setRows((c) => c.filter((cl) => cl.id !== row.id));
    };

    return (
        <RouteGuard permission="nav:reviews">
            <SalonShell role={role}>
                <div className="salonbw-page" data-testid="reviews-page">
                    <SalonBreadcrumbs
                        iconClass="sprite-breadcrumbs_settings"
                        items={[
                            { label: 'Ustawienia', href: '/settings' },
                            { label: 'Opinie' },
                        ]}
                    />
                    <div className="salonbw-page__toolbar">
                        {isAdmin && (
                            <label className="salonbw-label">
                                Pracownik
                                <input
                                    type="number"
                                    className="salonbw-input salonbw-input--sm"
                                    value={employeeId}
                                    onChange={(e) => {
                                        const n = Number(e.target.value);
                                        if (Number.isInteger(n) && n > 0)
                                            setEmployeeId(n);
                                    }}
                                />
                            </label>
                        )}
                        <button
                            type="button"
                            className="salonbw-btn salonbw-btn--primary"
                            onClick={() => {
                                setEditing(null);
                                setOpenForm(true);
                            }}
                        >
                            Dodaj opinię
                        </button>
                    </div>

                    <DataTable
                        data={rows}
                        columns={columns}
                        renderActions={(r) => (
                            <span className="space-x-2">
                                <button
                                    className="salonbw-btn salonbw-btn--sm salonbw-btn--light"
                                    onClick={() => {
                                        setEditing(r);
                                        setOpenForm(true);
                                    }}
                                >
                                    Edytuj
                                </button>
                                <button
                                    className="salonbw-btn salonbw-btn--sm salonbw-btn--danger"
                                    onClick={() => void handleDelete(r)}
                                >
                                    Usuń
                                </button>
                            </span>
                        )}
                    />

                    <Modal
                        open={openForm || Boolean(editing)}
                        onClose={() => {
                            setOpenForm(false);
                            setEditing(null);
                        }}
                    >
                        <ReviewForm
                            initial={editing ?? undefined}
                            onCancel={() => {
                                setOpenForm(false);
                                setEditing(null);
                            }}
                            onSubmit={editing ? handleUpdate : handleCreate}
                        />
                    </Modal>
                </div>
            </SalonShell>
        </RouteGuard>
    );
}

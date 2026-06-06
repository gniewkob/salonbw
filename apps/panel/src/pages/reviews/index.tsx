import Head from 'next/head';
import { useState, useEffect, type ComponentProps } from 'react';
import dynamic from 'next/dynamic';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import DataTable, { Column } from '@/components/DataTable';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import { useReviews } from '@/hooks/useReviews';
import { useReviewApi } from '@/api/reviews';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useEmployees } from '@/hooks/useEmployees';
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
    const [employeeId, setEmployeeId] = useState<number | undefined>(undefined);
    const { data: employeesData } = useEmployees();
    const employees = employeesData ?? [];
    const { data } = useReviews(
        isAdmin ? (employeeId ? { employeeId } : {}) : { mine: true },
    );
    const api = useReviewApi();
    const toast = useToast();
    type Row = Review & {
        appointmentDisplay?: number | string;
        employeeName?: string;
        authorName?: string;
    };
    const [rows, setRows] = useState<Row[]>([]);
    const [minRating, setMinRating] = useState<number | undefined>(undefined);
    const [openForm, setOpenForm] = useState(false);
    const [editing, setEditing] = useState<Row | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<Row | null>(null);

    useEffect(() => {
        setRows(
            data.map((r) => ({
                ...r,
                appointmentDisplay: r.appointmentId ?? r.appointment?.id ?? '',
                employeeName: r.employee?.fullName ?? r.employee?.name,
                authorName: r.author?.name ?? r.client?.name,
            })),
        );
    }, [data]);

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
        try {
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
                    authorName: created.author?.name ?? created.client?.name,
                },
            ]);
            setOpenForm(false);
            toast.success('Opinia została dodana');
        } catch {
            toast.error('Nie udało się dodać opinii');
        }
    };

    const handleUpdate = async (values: {
        appointmentId: number;
        rating: number;
        comment?: string;
    }) => {
        if (!editing) return;
        try {
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
                                  updated.author?.name ?? updated.client?.name,
                          }
                        : cl,
                ),
            );
            setEditing(null);
            setOpenForm(false);
            toast.success('Opinia została zaktualizowana');
        } catch {
            toast.error('Nie udało się zaktualizować opinii');
        }
    };

    const handleDelete = (row: Row) => {
        setConfirmDelete(row);
    };

    const doDelete = async () => {
        if (!confirmDelete) return;
        const row = confirmDelete;
        setConfirmDelete(null);
        try {
            await api.remove(row.id);
            setRows((c) => c.filter((cl) => cl.id !== row.id));
            toast.success('Opinia została usunięta');
        } catch {
            toast.error('Nie udało się usunąć opinii');
        }
    };

    return (
        <RouteGuard permission="nav:reviews">
            <Head>
                <title>Opinie — Salon Black &amp; White</title>
            </Head>
            <SalonShell role={role}>
                <div className="salonbw-page" data-testid="reviews-page">
                    <SalonBreadcrumbs
                        iconClass="sprite-breadcrumbs_settings"
                        items={[{ label: 'Opinie' }]}
                    />
                    <div className="salonbw-page__toolbar">
                        {isAdmin && (
                            <label className="form-label">
                                Pracownik
                                <select
                                    className="form-select form-select-sm"
                                    value={employeeId ?? ''}
                                    onChange={(e) =>
                                        setEmployeeId(
                                            e.target.value
                                                ? Number(e.target.value)
                                                : undefined,
                                        )
                                    }
                                >
                                    <option value="">— wszyscy —</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        )}
                        <label className="form-label">
                            Min. ocena
                            <select
                                className="form-select form-select-sm"
                                value={minRating ?? ''}
                                onChange={(e) =>
                                    setMinRating(
                                        e.target.value
                                            ? Number(e.target.value)
                                            : undefined,
                                    )
                                }
                            >
                                <option value="">— wszystkie —</option>
                                {[1, 2, 3, 4, 5].map((r) => (
                                    <option key={r} value={r}>
                                        {'★'.repeat(r)} ({r}+)
                                    </option>
                                ))}
                            </select>
                        </label>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => {
                                setEditing(null);
                                setOpenForm(true);
                            }}
                        >
                            Dodaj opinię
                        </button>
                    </div>

                    <DataTable
                        data={
                            minRating
                                ? rows.filter(
                                      (r) => (r.rating ?? 0) >= minRating,
                                  )
                                : rows
                        }
                        columns={columns}
                        renderActions={(r) => (
                            <span className="space-x-2">
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => {
                                        setEditing(r);
                                        setOpenForm(true);
                                    }}
                                >
                                    Edytuj
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-danger"
                                    onClick={() => handleDelete(r)}
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
                    <ConfirmModal
                        open={!!confirmDelete}
                        title="Usuń opinię"
                        message={`Czy na pewno chcesz usunąć opinię #${confirmDelete?.id}?`}
                        confirmLabel="Usuń"
                        confirmVariant="danger"
                        onConfirm={() => void doDelete()}
                        onCancel={() => setConfirmDelete(null)}
                    />
                </div>
            </SalonShell>
        </RouteGuard>
    );
}

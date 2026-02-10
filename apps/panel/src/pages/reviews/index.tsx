import { useState, useEffect, type ComponentProps } from 'react';
import dynamic from 'next/dynamic';
import RouteGuard from '@/components/RouteGuard';
import VersumShell from '@/components/versum/VersumShell';
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
            <div className="versum-loading">Loading review form…</div>
        ),
    },
);

export default function ReviewsPage() {
    const { role } = useAuth();
    const isAdmin = role === 'admin';
    const [employeeId, setEmployeeId] = useState(1);
    const { data } = useReviews(isAdmin ? { employeeId } : { mine: true });
    const api = useReviewApi();
    type Row = Review & { employeeName?: string; authorName?: string };
    const [rows, setRows] = useState<Row[]>([]);
    const [openForm, setOpenForm] = useState(false);
    const [editing, setEditing] = useState<Row | null>(null);

    useEffect(() => {
        setRows(
            data.map((r) => ({
                ...r,
                employeeName: r.employee?.fullName,
                authorName: r.author?.name,
            })),
        );
    }, [data]);

    if (!role) return null;

    const columns: Column<Row>[] = [
        { header: 'ID', accessor: 'id' },
        { header: 'Appointment', accessor: 'appointmentId' },
        { header: 'Employee', accessor: 'employeeName' },
        { header: 'Author', accessor: 'authorName' },
        { header: 'Rating', accessor: 'rating' },
        { header: 'Comment', accessor: 'comment' },
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
                employeeName: created.employee?.fullName,
                authorName: created.author?.name,
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
                          employeeName: updated.employee?.fullName,
                          authorName: updated.author?.name,
                      }
                    : cl,
            ),
        );
        setEditing(null);
        setOpenForm(false);
    };

    const handleDelete = async (row: Row) => {
        if (!confirm(`Delete review ${row.id}?`)) return;
        await api.remove(row.id);
        setRows((c) => c.filter((cl) => cl.id !== row.id));
    };

    return (
        <RouteGuard permission="nav:reviews">
            <VersumShell role={role}>
                <div className="versum-page" data-testid="reviews-page">
                    <header className="versum-page__header">
                        <h1 className="versum-page__title">Opinie</h1>
                        <div className="flex items-center gap-4">
                            {isAdmin && (
                                <label className="versum-label">
                                    Employee
                                    <input
                                        className="versum-input versum-input--sm ml-2 w-20"
                                        value={employeeId}
                                        onChange={(e) =>
                                            setEmployeeId(
                                                Number(e.target.value),
                                            )
                                        }
                                    />
                                </label>
                            )}
                            <button
                                className="versum-btn versum-btn--primary"
                                onClick={() => {
                                    setEditing(null);
                                    setOpenForm(true);
                                }}
                            >
                                Dodaj opinię
                            </button>
                        </div>
                    </header>

                    <DataTable
                        data={rows}
                        columns={columns}
                        renderActions={(r) => (
                            <span className="space-x-2">
                                <button
                                    className="versum-btn versum-btn--sm versum-btn--light"
                                    onClick={() => {
                                        setEditing(r);
                                        setOpenForm(true);
                                    }}
                                >
                                    Edytuj
                                </button>
                                <button
                                    className="versum-btn versum-btn--sm versum-btn--danger"
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
            </VersumShell>
        </RouteGuard>
    );
}

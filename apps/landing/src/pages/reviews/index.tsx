import { useState, useEffect, type ComponentProps } from 'react';
import dynamic from 'next/dynamic';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
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
            <div className="p-4 text-sm text-gray-500">
                Loading review form…
            </div>
        ),
    },
);

export default function ReviewsPage() {
    const { role } = useAuth();
    const isAdmin = role === 'admin';
    const [employeeId, setEmployeeId] = useState(1);
    // Admin sees all reviews (filtered by employee), others see only their own
    const { data, page, total, limit, setPage, rating, setRating } = useReviews(
        isAdmin ? { employeeId } : { mine: true },
    );
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
            <DashboardLayout>
                <div className="mb-2 flex justify-between">
                    <div className="flex items-center gap-2">
                        {isAdmin && (
                            <label>
                                Employee
                                <input
                                    className="border ml-1 p-1 w-16"
                                    value={employeeId}
                                    onChange={(e) =>
                                        setEmployeeId(Number(e.target.value) || 1)
                                    }
                                />
                            </label>
                        )}
                        <label>
                            Rating
                            <input
                                className="border ml-1 p-1 w-16"
                                value={rating ?? ''}
                                onChange={(e) =>
                                    setRating(
                                        e.target.value
                                            ? Number(e.target.value)
                                            : undefined,
                                    )
                                }
                                placeholder="All"
                            />
                        </label>
                    </div>
                    <button
                        className="border px-2 py-1"
                        onClick={() => {
                            setEditing(null);
                            setOpenForm(true);
                        }}
                    >
                        Add Review
                    </button>
                </div>
                {rows && (
                    <DataTable
                        data={rows}
                        columns={columns}
                        initialSort="id"
                        pageSize={rows.length || 1}
                        renderActions={(r) => (
                            <span className="space-x-2">
                                <button
                                    className="border px-2 py-1"
                                    onClick={() => {
                                        setEditing(r);
                                        setOpenForm(true);
                                    }}
                                >
                                    Edit
                                </button>
                                <button
                                    className="border px-2 py-1"
                                    onClick={() => void handleDelete(r)}
                                >
                                    Delete
                                </button>
                            </span>
                        )}
                    />
                )}
                <div className="mt-2 flex justify-end gap-2">
                    <button
                        className="border px-2 py-1"
                        disabled={page <= 1}
                        onClick={() => setPage(page - 1)}
                    >
                        Prev
                    </button>
                    <span>
                        {page} / {Math.ceil(total / limit) || 1}
                    </span>
                    <button
                        className="border px-2 py-1"
                        disabled={page * limit >= total}
                        onClick={() => setPage(page + 1)}
                    >
                        Next
                    </button>
                </div>
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
            </DashboardLayout>
        </RouteGuard>
    );
}

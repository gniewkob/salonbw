import { useRouter } from 'next/router';
import { useReviews } from '@/hooks/useReviews';
import DashboardLayout from '@/components/DashboardLayout';
import RouteGuard from '@/components/RouteGuard';
import DataTable, { Column } from '@/components/DataTable';
import { Review } from '@/types';

export default function ClientReviewsPage() {
    const router = useRouter();
    const id = Number(router.query.id);
    const opts = isNaN(id) ? {} : { clientId: id };
    const { data, page, total, limit, setPage, rating, setRating } =
        useReviews(opts);
    type Row = Review & { employeeName?: string };
    const rows: Row[] = data.map((r) => ({
        ...r,
        employeeName: r.employee?.fullName,
    }));
    const columns: Column<Row>[] = [
        { header: 'Appointment', accessor: 'appointmentId' },
        { header: 'Employee', accessor: 'employeeName' },
        { header: 'Rating', accessor: 'rating' },
        { header: 'Comment', accessor: 'comment' },
    ];
    return (
        <RouteGuard>
            <DashboardLayout>
                <div className="mb-2 flex justify-between">
                    <div className="flex items-center gap-2">
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
                </div>
                <DataTable
                    data={rows}
                    columns={columns}
                    pageSize={rows.length || 1}
                />
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
            </DashboardLayout>
        </RouteGuard>
    );
}

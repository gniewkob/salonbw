import { useState } from 'react';
import RouteGuard from '@/components/RouteGuard';
import Layout from '@/components/Layout';
import DataTable, { Column } from '@/components/DataTable';
import Modal from '@/components/Modal';
import ReviewForm from '@/components/ReviewForm';
import { useReviews } from '@/hooks/useReviews';
import { useReviewApi } from '@/api/reviews';
import { Review } from '@/types';

export default function ReviewsPage() {
  const { data } = useReviews();
  const api = useReviewApi();
  const [rows, setRows] = useState<Review[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Review | null>(null);

  if (data && rows.length === 0) setRows(data);

  const columns: Column<Review>[] = [
    { header: 'ID', accessor: 'id' },
    { header: 'Rating', accessor: 'rating' },
    { header: 'Comment', accessor: 'comment' },
  ];

  const handleCreate = async (values: { reservationId: number; rating: number; comment?: string }) => {
    const created = await api.create(values);
    setRows((c) => [...c, created]);
    setOpenForm(false);
  };

  const handleUpdate = async (values: { reservationId: number; rating: number; comment?: string }) => {
    if (!editing) return;
    const updated = await api.update(editing.id, values);
    setRows((c) => c.map((cl) => (cl.id === editing.id ? updated : cl)));
    setEditing(null);
    setOpenForm(false);
  };

  const handleDelete = async (row: Review) => {
    if (!confirm(`Delete review ${row.id}?`)) return;
    await api.remove(row.id);
    setRows((c) => c.filter((cl) => cl.id !== row.id));
  };

  return (
    <RouteGuard>
      <Layout>
        <div className="mb-2 flex justify-end">
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
                <button className="border px-2 py-1" onClick={() => handleDelete(r)}>
                  Delete
                </button>
              </span>
            )}
          />
        )}
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
      </Layout>
    </RouteGuard>
  );
}

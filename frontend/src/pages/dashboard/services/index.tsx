import { useState } from 'react';
import RouteGuard from '@/components/RouteGuard';
import Layout from '@/components/Layout';
import DataTable, { Column } from '@/components/DataTable';
import Modal from '@/components/Modal';
import ServiceForm from '@/components/ServiceForm';
import { useServices } from '@/hooks/useServices';
import { useServiceApi } from '@/api/services';
import { Service } from '@/types';

export default function ServicesPage() {
  const { data } = useServices();
  const api = useServiceApi();
  const [rows, setRows] = useState<Service[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);

  if (data && rows.length === 0) setRows(data);

  const columns: Column<Service>[] = [
    { header: 'ID', accessor: 'id' },
    { header: 'Name', accessor: 'name' },
  ];

  const handleCreate = async (values: { name: string }) => {
    const created = await api.create(values);
    setRows((c) => [...c, created]);
    setOpenForm(false);
  };

  const handleUpdate = async (values: { name: string }) => {
    if (!editing) return;
    const updated = await api.update(editing.id, values);
    setRows((c) => c.map((cl) => (cl.id === editing.id ? updated : cl)));
    setEditing(null);
    setOpenForm(false);
  };

  const handleDelete = async (row: Service) => {
    if (!confirm(`Delete ${row.name}?`)) return;
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
              Add Service
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
                  <button className="border px-2 py-1" onClick={() => void handleDelete(r)}>
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
            <ServiceForm
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

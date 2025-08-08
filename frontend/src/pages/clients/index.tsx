import { useState } from 'react';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import DataTable, { Column } from '@/components/DataTable';
import Modal from '@/components/Modal';
import ClientForm from '@/components/ClientForm';
import { useClients } from '@/hooks/useClients';
import { useClientApi } from '@/api/clients';
import { Client } from '@/types';

export default function ClientsPage() {
  const { data } = useClients();
  const api = useClientApi();
  const [clients, setClients] = useState<Client[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);

  // sync once data loads
  if (data && clients.length === 0) setClients(data);

  const columns: Column<Client>[] = [
    { header: 'ID', accessor: 'id' },
    { header: 'Name', accessor: 'name' },
  ];

  const handleCreate = async (values: { name: string }) => {
    const created = await api.create(values);
    setClients((c) => [...c, created]);
    setOpenForm(false);
  };

  const handleUpdate = async (values: { name: string }) => {
    if (!editing) return;
    const updated = await api.update(editing.id, values);
    setClients((c) => c.map((cl) => (cl.id === editing.id ? updated : cl)));
    setEditing(null);
    setOpenForm(false);
  };

  const handleDelete = async (client: Client) => {
    if (!confirm(`Delete ${client.name}?`)) return;
    await api.remove(client.id);
    setClients((c) => c.filter((cl) => cl.id !== client.id));
  };

  return (
    <RouteGuard>
      <DashboardLayout>
        <div className="mb-2 flex justify-end">
          <button
            className="border px-2 py-1"
            onClick={() => {
              setEditing(null);
              setOpenForm(true);
            }}
          >
            Add Client
          </button>
        </div>
        {clients && (
          <DataTable
            data={clients}
            columns={columns}
            initialSort="id"
            renderActions={(c) => (
              <span className="space-x-2">
                <button
                  className="border px-2 py-1"
                  onClick={() => {
                    setEditing(c);
                    setOpenForm(true);
                  }}
                >
                  Edit
                </button>
                <button
                  className="border px-2 py-1"
                  onClick={() => void handleDelete(c)}
                >
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
          <ClientForm
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

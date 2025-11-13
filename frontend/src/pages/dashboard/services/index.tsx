import { useState, type ComponentProps } from 'react';
import dynamic from 'next/dynamic';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import type DataTableComponent from '@/components/DataTable';
import type { Column } from '@/components/DataTable';
import type ModalComponent from '@/components/Modal';
import { useServices } from '@/hooks/useServices';
import { useServiceApi } from '@/api/services';
import { Service } from '@/types';

import type ServiceFormComponent from '@/components/ServiceForm';

const ServiceForm = dynamic<ComponentProps<typeof ServiceFormComponent>>(
    () => import('@/components/ServiceForm'),
    {
        ssr: false,
        loading: () => (
            <div className="p-4 text-sm text-gray-500">
                Loading service form…
            </div>
        ),
    },
);

const DataTable = dynamic(() => import('@/components/DataTable'), {
    loading: () => (
        <div className="rounded border border-dashed p-4 text-sm text-gray-500">
            Loading table…
        </div>
    ),
}) as typeof DataTableComponent;

const Modal = dynamic(() => import('@/components/Modal'), {
    loading: () => null,
}) as typeof ModalComponent;

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
        <RouteGuard roles={['admin']} permission="nav:services">
            <DashboardLayout>
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
                        renderActions={(r: Service) => (
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
            </DashboardLayout>
        </RouteGuard>
    );
}

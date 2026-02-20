import { useEffect, useState, type ComponentProps } from 'react';
import dynamic from 'next/dynamic';
import RouteGuard from '@/components/RouteGuard';
import VersumShell from '@/components/versum/VersumShell';
import { useAuth } from '@/contexts/AuthContext';
import DataTable, { Column } from '@/components/DataTable';
import Modal from '@/components/Modal';
import { useEmployees } from '@/hooks/useEmployees';
import { useEmployeeApi } from '@/api/employees';
import { Employee } from '@/types';

import type EmployeeFormComponent from '@/components/EmployeeForm';

const EmployeeForm = dynamic<ComponentProps<typeof EmployeeFormComponent>>(
    () => import('@/components/EmployeeForm'),
    {
        ssr: false,
        loading: () => (
            <div className="versum-loading">Loading employee form…</div>
        ),
    },
);

export default function EmployeesPage() {
    const { role } = useAuth();
    const { data } = useEmployees();
    const api = useEmployeeApi();
    const [rows, setRows] = useState<Employee[]>([]);
    const [openForm, setOpenForm] = useState(false);
    const [editing, setEditing] = useState<Employee | null>(null);

    useEffect(() => {
        if (data && rows.length === 0) {
            setRows(data);
        }
    }, [data, rows.length]);

    if (!role) return null;

    const columns: Column<Employee>[] = [
        { header: 'ID', accessor: 'id' },
        { header: 'Name', accessor: 'fullName' },
    ];

    const handleCreate = async (values: {
        firstName: string;
        lastName: string;
    }) => {
        const created = await api.create(values);
        setRows((c) => [...c, created]);
        setOpenForm(false);
    };

    const handleUpdate = async (values: {
        firstName: string;
        lastName: string;
    }) => {
        if (!editing) return;
        const updated = await api.update(editing.id, values);
        setRows((c) => c.map((cl) => (cl.id === editing.id ? updated : cl)));
        setEditing(null);
        setOpenForm(false);
    };

    const handleDelete = async (row: Employee) => {
        if (!confirm(`Delete ${row.fullName}?`)) return;
        await api.remove(row.id);
        setRows((c) => c.filter((cl) => cl.id !== row.id));
    };

    return (
        <RouteGuard roles={['admin']} permission="nav:employees">
            <VersumShell role={role}>
                <div className="versum-page" data-testid="employees-page">
                    <header className="versum-page__header">
                        <h1 className="versum-page__title">Pracownicy</h1>
                        <button
                            className="versum-btn versum-btn--primary"
                            onClick={() => {
                                setEditing(null);
                                setOpenForm(true);
                            }}
                        >
                            Dodaj pracownika
                        </button>
                    </header>

                    {rows && (
                        <DataTable
                            data={rows}
                            columns={columns}
                            initialSort="id"
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
                    )}
                    <Modal
                        open={openForm || Boolean(editing)}
                        onClose={() => {
                            setOpenForm(false);
                            setEditing(null);
                        }}
                    >
                        <EmployeeForm
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

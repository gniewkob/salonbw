import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import dynamic from 'next/dynamic';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import EmployeesNav from '@/components/salon/navs/EmployeesNav';
import { useAuth } from '@/contexts/AuthContext';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
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
            <div className="salonbw-loading">
                Ładowanie formularza pracownika…
            </div>
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
    const secondaryNav = useMemo(() => <EmployeesNav />, []);

    useEffect(() => {
        if (data && rows.length === 0) {
            setRows(data);
        }
    }, [data, rows.length]);
    useSetSecondaryNav(secondaryNav);

    const columns: Column<Employee>[] = [
        { header: 'ID', accessor: 'id' },
        { header: 'Pracownik', accessor: 'fullName' },
        { header: 'Email', accessor: 'email' },
    ];

    const handleCreate = async (values: {
        firstName: string;
        lastName: string;
        email?: string;
    }) => {
        const created = await api.create(values);
        setRows((c) => [...c, created]);
        setOpenForm(false);
    };

    const handleUpdate = async (values: {
        firstName: string;
        lastName: string;
        email?: string;
    }) => {
        if (!editing) return;
        const updated = await api.update(editing.id, values);
        setRows((c) => c.map((cl) => (cl.id === editing.id ? updated : cl)));
        setEditing(null);
        setOpenForm(false);
    };

    const handleDelete = async (row: Employee) => {
        if (!confirm(`Usunąć pracownika ${row.fullName ?? row.name}?`)) return;
        await api.remove(row.id);
        setRows((c) => c.filter((cl) => cl.id !== row.id));
    };

    return (
        <RouteGuard roles={['admin']} permission="nav:employees">
            <SalonShell role={role}>
                <div className="salonbw-page" data-testid="employees-page">
                    <SalonBreadcrumbs
                        iconClass="sprite-breadcrumbs_settings"
                        items={[
                            { label: 'Ustawienia', href: '/settings' },
                            { label: 'Pracownicy' },
                        ]}
                    />
                    <div className="salonbw-page__toolbar">
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => {
                                setEditing(null);
                                setOpenForm(true);
                            }}
                        >
                            Dodaj pracownika
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
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => {
                                            setEditing(r);
                                            setOpenForm(true);
                                        }}
                                    >
                                        Edytuj
                                    </button>
                                    <button
                                        className="btn btn-sm btn-danger"
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
                        size="sm"
                    >
                        <h5 className="fw-bold mb-4">
                            {editing ? 'Edytuj pracownika' : 'Nowy pracownik'}
                        </h5>
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
            </SalonShell>
        </RouteGuard>
    );
}

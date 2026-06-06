import { useEffect, useMemo, useState, type ComponentProps } from 'react';
import dynamic from 'next/dynamic';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import EmployeesNav from '@/components/salon/navs/EmployeesNav';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import DataTable, { Column } from '@/components/DataTable';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import { useEmployees } from '@/hooks/useEmployees';
import { useEmployeeApi } from '@/api/employees';
import { Employee, StaffRole } from '@/types';

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

const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrator',
    employee: 'Pracownik',
    receptionist: 'Recepcja',
    client: 'Klient',
};

const ROLE_BADGE: Record<string, string> = {
    admin: 'badge bg-danger',
    employee: 'badge bg-primary',
    receptionist: 'badge bg-info text-dark',
    client: 'badge bg-secondary',
};

export default function EmployeesPage() {
    const { role } = useAuth();
    const toast = useToast();
    const { data } = useEmployees();
    const api = useEmployeeApi();
    const [rows, setRows] = useState<Employee[]>([]);
    const [openForm, setOpenForm] = useState(false);
    const [editing, setEditing] = useState<Employee | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<Employee | null>(null);
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
        {
            header: 'Rola',
            accessor: (r) => (
                <span
                    className={
                        ROLE_BADGE[r.role ?? 'employee'] ?? 'badge bg-secondary'
                    }
                >
                    {ROLE_LABELS[r.role ?? 'employee'] ?? r.role}
                </span>
            ),
        },
    ];

    const handleCreate = async (values: {
        firstName: string;
        lastName: string;
        email?: string;
        role?: StaffRole;
    }) => {
        try {
            const created = await api.create(values);
            setRows((c) => [...c, created]);
            setOpenForm(false);
            toast.success('Pracownik został dodany');
        } catch {
            toast.error('Nie udało się dodać pracownika');
        }
    };

    const handleUpdate = async (values: {
        firstName: string;
        lastName: string;
        email?: string;
        role?: StaffRole;
    }) => {
        if (!editing) return;
        try {
            const updated = await api.update(editing.id, values);
            if (values.role && values.role !== editing.role) {
                await api.updateRole(editing.id, values.role);
                setRows((c) =>
                    c.map((cl) =>
                        cl.id === editing.id
                            ? { ...updated, role: values.role! }
                            : cl,
                    ),
                );
            } else {
                setRows((c) =>
                    c.map((cl) => (cl.id === editing.id ? updated : cl)),
                );
            }
            setEditing(null);
            setOpenForm(false);
            toast.success('Dane pracownika zostały zapisane');
        } catch {
            toast.error('Nie udało się zapisać danych pracownika');
        }
    };

    const handleDelete = async (row: Employee) => {
        setConfirmDelete(row);
    };

    const doDelete = async () => {
        if (!confirmDelete) return;
        const row = confirmDelete;
        setConfirmDelete(null);
        try {
            await api.remove(row.id);
            setRows((c) => c.filter((cl) => cl.id !== row.id));
            toast.success('Pracownik został usunięty');
        } catch {
            toast.error('Nie udało się usunąć pracownika');
        }
    };

    return (
        <RouteGuard roles={['admin']} permission="nav:employees">
            <SalonShell role={role}>
                <div className="salonbw-page" data-testid="employees-page">
                    <SalonBreadcrumbs
                        iconClass="sprite-breadcrumbs_settings"
                        items={[{ label: 'Pracownicy' }]}
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
                    <ConfirmModal
                        open={!!confirmDelete}
                        title="Usuń pracownika"
                        message={`Czy na pewno chcesz usunąć pracownika ${confirmDelete?.fullName ?? confirmDelete?.name}? Operacja jest nieodwracalna.`}
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

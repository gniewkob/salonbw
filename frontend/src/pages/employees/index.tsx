import { useState } from 'react';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import DataTable, { Column } from '@/components/DataTable';
import Modal from '@/components/Modal';
import EmployeeForm from '@/components/EmployeeForm';
import { useEmployees } from '@/hooks/useEmployees';
import { useEmployeeApi } from '@/api/employees';
import { Employee } from '@/types';

export default function EmployeesPage() {
    const { data } = useEmployees();
    const api = useEmployeeApi();
    const [rows, setRows] = useState<Employee[]>([]);
    const [openForm, setOpenForm] = useState(false);
    const [editing, setEditing] = useState<Employee | null>(null);

    if (data && rows.length === 0) setRows(data);

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
        <RouteGuard roles={["admin"]}>
            <DashboardLayout>
                <div className="mb-2 flex justify-end">
                    <button
                        className="border px-2 py-1"
                        onClick={() => {
                            setEditing(null);
                            setOpenForm(true);
                        }}
                    >
                        Add Employee
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
                    <EmployeeForm
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

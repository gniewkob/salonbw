import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useServices } from '@/hooks/useServices';
import { useServiceApi } from '@/api/services';
import { useAuth } from '@/contexts/AuthContext';
import { Service } from '@/types';
import Modal from '@/components/Modal';
import ServiceForm from '@/components/ServiceForm';

export default function ServicesPage() {
    const { data: services, refetch } = useServices();
    const { create, update, remove } = useServiceApi();
    const { role } = useAuth();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);

    const handleCreate = async (data: any) => {
        await create(data);
        setIsModalOpen(false);
        void refetch();
    };

    const handleUpdate = async (data: any) => {
        if (!editingService) return;
        await update(editingService.id, data);
        setEditingService(null);
        setIsModalOpen(false);
        void refetch();
    };

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to delete this service?')) {
            await remove(id);
            void refetch();
        }
    };

    const openCreate = () => {
        setEditingService(null);
        setIsModalOpen(true);
    };

    const openEdit = (service: Service) => {
        setEditingService(service);
        setIsModalOpen(true);
    };

    if (role !== 'admin') {
        return (
            <DashboardLayout title="Services">
                <div className="p-4">You do not have permission to view this page.</div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="Services">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Services</h1>
                <button
                    onClick={openCreate}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                    Add Service
                </button>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {services?.map((service) => (
                            <tr key={service.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                        {service.name}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => openEdit(service)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(service.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {(!services || services.length === 0) && (
                            <tr>
                                <td
                                    colSpan={2}
                                    className="px-6 py-4 text-center text-sm text-gray-500"
                                >
                                    No services found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingService ? 'Edit Service' : 'Add Service'}
            >
                <ServiceForm
                    initialData={editingService || undefined}
                    onSubmit={editingService ? handleUpdate : handleCreate}
                    onCancel={() => setIsModalOpen(false)}
                />
            </Modal>
        </DashboardLayout>
    );
}

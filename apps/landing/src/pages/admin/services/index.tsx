'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Topbar from '@/components/Topbar';
import AdminSidebarMenu from '@/components/sidebars/AdminSidebarMenu';
import ServiceCategoryTree from '@/components/services/ServiceCategoryTree';
import ServiceList from '@/components/services/ServiceList';
import ServiceFormModal, {
    type ServiceFormData,
} from '@/components/services/ServiceFormModal';
import CategoryFormModal, {
    type CategoryFormData,
} from '@/components/services/CategoryFormModal';
import ServiceVariantsModal from '@/components/services/ServiceVariantsModal';
import type { Service, ServiceCategory } from '@/types';

import {
    useServiceCategoryTree,
    useServicesWithRelations,
    useCreateService,
    useUpdateService,
    useDeleteService,
    useCreateServiceCategory,
    useUpdateServiceCategory,
    useDeleteServiceCategory,
} from '@/hooks/useServicesAdmin';

export default function AdminServicesPage() {
    const { user } = useAuth();
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
        null,
    );

    // Service modal state
    const [serviceModalOpen, setServiceModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);

    // Category modal state
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] =
        useState<ServiceCategory | null>(null);
    const [newCategoryParentId, setNewCategoryParentId] = useState<number | null>(
        null,
    );

    // Variants modal state
    const [variantsModalOpen, setVariantsModalOpen] = useState(false);
    const [variantsService, setVariantsService] = useState<Service | null>(null);

    // Data queries
    const { data: categories = [], isLoading: categoriesLoading } =
        useServiceCategoryTree();
    const { data: services = [], isLoading: servicesLoading } =
        useServicesWithRelations();

    // Mutations
    const createService = useCreateService();
    const updateService = useUpdateService();
    const deleteService = useDeleteService();
    const createCategory = useCreateServiceCategory();
    const updateCategory = useUpdateServiceCategory();
    const deleteCategory = useDeleteServiceCategory();

    // Filter services by category
    const filteredServices = useMemo(() => {
        if (selectedCategoryId === null) {
            return services;
        }
        if (selectedCategoryId === -1) {
            return services.filter((s) => !s.categoryId);
        }
        // Include services from subcategories
        const getCategoryIds = (cats: ServiceCategory[]): number[] => {
            const ids: number[] = [];
            for (const cat of cats) {
                ids.push(cat.id);
                if (cat.children) {
                    ids.push(...getCategoryIds(cat.children));
                }
            }
            return ids;
        };
        const findCategoryAndDescendants = (
            cats: ServiceCategory[],
            targetId: number,
        ): number[] => {
            for (const cat of cats) {
                if (cat.id === targetId) {
                    return getCategoryIds([cat]);
                }
                if (cat.children) {
                    const result = findCategoryAndDescendants(cat.children, targetId);
                    if (result.length > 0) return result;
                }
            }
            return [];
        };
        const categoryIds = findCategoryAndDescendants(
            categories,
            selectedCategoryId,
        );
        return services.filter(
            (s) => s.categoryId && categoryIds.includes(s.categoryId),
        );
    }, [services, selectedCategoryId, categories]);

    // Service handlers
    const handleOpenServiceModal = (service?: Service) => {
        setEditingService(service || null);
        setServiceModalOpen(true);
    };

    const handleSaveService = async (data: ServiceFormData) => {
        if (editingService) {
            await updateService.mutateAsync({ id: editingService.id, data });
        } else {
            await createService.mutateAsync(data);
        }
        setServiceModalOpen(false);
        setEditingService(null);
    };

    const handleDeleteService = async (id: number) => {
        await deleteService.mutateAsync(id);
    };

    const handleToggleServiceActive = async (id: number, isActive: boolean) => {
        await updateService.mutateAsync({ id, data: { isActive } });
    };

    // Category handlers
    const handleOpenCategoryModal = (
        category?: ServiceCategory,
        parentId?: number,
    ) => {
        setEditingCategory(category || null);
        setNewCategoryParentId(parentId || null);
        setCategoryModalOpen(true);
    };

    const handleSaveCategory = async (data: CategoryFormData) => {
        if (editingCategory) {
            await updateCategory.mutateAsync({ id: editingCategory.id, data });
        } else {
            await createCategory.mutateAsync(data);
        }
        setCategoryModalOpen(false);
        setEditingCategory(null);
        setNewCategoryParentId(null);
    };

    const handleDeleteCategory = async (id: number) => {
        await deleteCategory.mutateAsync(id);
        if (selectedCategoryId === id) {
            setSelectedCategoryId(null);
        }
    };

    const isLoading = categoriesLoading || servicesLoading;

    if (!user || user.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        Brak dostępu
                    </h1>
                    <p className="text-gray-600">
                        Ta strona jest dostępna tylko dla administratorów.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Topbar />
            <div className="flex">
                <AdminSidebarMenu />

                <main className="flex-1 p-6">
                    {/* Header */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">
                                    Usługi
                                </h1>
                                <p className="text-gray-600 mt-1">
                                    Zarządzaj usługami i kategoriami salonu
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleOpenServiceModal()}
                                className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                    />
                                </svg>
                                Dodaj usługę
                            </button>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                            <span className="ml-3 text-gray-600">Ładowanie...</span>
                        </div>
                    ) : (
                        <div className="flex gap-6">
                            {/* Sidebar with categories */}
                            <div className="w-72 flex-shrink-0">
                                <ServiceCategoryTree
                                    categories={categories}
                                    selectedCategoryId={selectedCategoryId}
                                    onSelectCategory={setSelectedCategoryId}
                                    onEditCategory={(cat) =>
                                        handleOpenCategoryModal(cat)
                                    }
                                    onDeleteCategory={handleDeleteCategory}
                                    onAddCategory={(parentId) =>
                                        handleOpenCategoryModal(undefined, parentId)
                                    }
                                />
                            </div>

                            {/* Main content - services list */}
                            <div className="flex-1">
                                <div className="mb-4 flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-gray-800">
                                        {selectedCategoryId === null
                                            ? 'Wszystkie usługi'
                                            : selectedCategoryId === -1
                                              ? 'Usługi bez kategorii'
                                              : `Usługi w kategorii`}
                                        <span className="ml-2 text-sm font-normal text-gray-500">
                                            ({filteredServices.length})
                                        </span>
                                    </h2>
                                </div>

                                <ServiceList
                                    services={filteredServices}
                                    categories={categories}
                                    onEdit={handleOpenServiceModal}
                                    onDelete={handleDeleteService}
                                    onToggleActive={handleToggleServiceActive}
                                    onManageVariants={(service) => {
                                        setVariantsService(service);
                                        setVariantsModalOpen(true);
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Service Modal */}
            <ServiceFormModal
                isOpen={serviceModalOpen}
                service={editingService}
                categories={categories}
                onClose={() => {
                    setServiceModalOpen(false);
                    setEditingService(null);
                }}
                onSave={handleSaveService}
            />

            {/* Category Modal */}
            <CategoryFormModal
                isOpen={categoryModalOpen}
                category={editingCategory}
                parentId={newCategoryParentId}
                categories={categories}
                onClose={() => {
                    setCategoryModalOpen(false);
                    setEditingCategory(null);
                    setNewCategoryParentId(null);
                }}
                onSave={handleSaveCategory}
            />

            {/* Variants Modal */}
            <ServiceVariantsModal
                isOpen={variantsModalOpen}
                service={variantsService}
                onClose={() => {
                    setVariantsModalOpen(false);
                    setVariantsService(null);
                }}
            />
        </div>
    );
}

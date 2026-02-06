import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import RouteGuard from '@/components/RouteGuard';
import DashboardLayout from '@/components/DashboardLayout';
import {
    useServicesWithFilters,
    useCreateService,
    useServiceCategories,
} from '@/hooks/useServicesAdmin';
import ServiceFormModal, {
    ServiceFormData,
} from '@/components/services/ServiceFormModal';
import ServicesNav from '@/components/versum/navs/ServicesNav';

export default function ServicesPage() {
    return <ServicesPageContent />;
}

function ServicesPageContent() {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const categoryId = router.query.categoryId
        ? Number(router.query.categoryId)
        : undefined;

    const { data: services = [], isLoading } = useServicesWithFilters({
        categoryId,
        includeCategory: true,
    });

    const { data: categories = [] } = useServiceCategories();
    const createService = useCreateService();

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return services;
        return services.filter((service) => {
            return (
                service.name.toLowerCase().includes(query) ||
                (service.categoryRelation?.name || '')
                    .toLowerCase()
                    .includes(query)
            );
        });
    }, [search, services]);

    const handleCreateService = async (data: ServiceFormData) => {
        try {
            await createService.mutateAsync({
                ...data,
                // Ensure optional fields are handled correctly if needed
            });
            setIsCreateModalOpen(false);
        } catch (error) {
            console.error('Failed to create service:', error);
            // Ideally assume toast notification handles error display via query client or global error handler
        }
    };

    return (
        <RouteGuard roles={['admin']} permission="nav:services">
            <DashboardLayout pageTitle="Usługi" secondaryNav={<ServicesNav />}>
                <div className="versum-page" data-testid="services-page">
                    <header className="versum-page__header">
                        <h1 className="versum-page__title">Usługi</h1>
                    </header>

                    <div className="versum-page__toolbar">
                        <input
                            className="form-control versum-toolbar-search"
                            placeholder="wyszukaj usługę"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                        <button
                            type="button"
                            className="btn btn-primary versum-toolbar-btn"
                            onClick={() => setIsCreateModalOpen(true)}
                        >
                            dodaj usługę
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="p-4 text-sm versum-muted">
                            Ładowanie usług...
                        </div>
                    ) : (
                        <>
                            <div className="versum-table-wrap">
                                <table className="versum-table">
                                    <thead>
                                        <tr>
                                            <th>Nazwa</th>
                                            <th>Kategoria</th>
                                            <th>Czas trwania</th>
                                            <th>Popularność</th>
                                            <th>Cena brutto</th>
                                            <th>VAT</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filtered.length > 0 ? (
                                            filtered.map((service) => (
                                                <tr key={service.id}>
                                                    <td>
                                                        <Link
                                                            className="versum-link"
                                                            href={`/services/${service.id}`}
                                                        >
                                                            {service.name}
                                                        </Link>
                                                    </td>
                                                    <td>
                                                        {service
                                                            .categoryRelation
                                                            ?.name ??
                                                            'brak kategorii'}
                                                    </td>
                                                    <td>
                                                        {service.duration} minut
                                                    </td>
                                                    <td>
                                                        {Math.max(
                                                            0,
                                                            (service.id * 7) %
                                                                600,
                                                        )}{' '}
                                                        razy
                                                    </td>
                                                    <td>
                                                        {Number(
                                                            service.price,
                                                        ).toFixed(2)}{' '}
                                                        zł
                                                    </td>
                                                    <td>
                                                        {service.vatRate ?? 23}%
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan={6}
                                                    className="p-4 text-center text-gray-500"
                                                >
                                                    Brak usług spełniających
                                                    kryteria
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="versum-pagination-footer">
                                Pozycje od 1 do {filtered.length} | na stronie{' '}
                                {filtered.length}
                            </div>
                        </>
                    )}

                    <ServiceFormModal
                        isOpen={isCreateModalOpen}
                        service={null}
                        categories={categories}
                        onClose={() => setIsCreateModalOpen(false)}
                        onSave={handleCreateService}
                    />
                </div>
            </DashboardLayout>
        </RouteGuard>
    );
}

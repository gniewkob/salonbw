import Link from 'next/link';
import { useState } from 'react';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import ConfirmModal from '@/components/ConfirmModal';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import {
    useServiceCategoryTree,
    useDeleteServiceCategory,
} from '@/hooks/useServicesAdmin';
import type { ServiceCategory } from '@/types';

const NAV = (
    <div className="sidenav" id="sidenav">
        <div className="column_row tree other_settings">
            <h4>Ustawienia usług</h4>
            <ul>
                <li>
                    <Link href="/settings/trades" className="active">
                        <div className="icon_box">
                            <span className="icon sprite-settings_services_nav" />
                        </div>
                        Branże
                    </Link>
                </li>
            </ul>
        </div>
    </div>
);

function CategoryRow({
    category,
    depth,
    onDelete,
}: {
    category: ServiceCategory;
    depth: number;
    onDelete: (id: number, name: string) => void;
}) {
    return (
        <>
            <tr>
                <td style={{ paddingLeft: depth * 24 + 12 }}>
                    {category.color && (
                        <span
                            className="me-2 d-inline-block rounded-circle"
                            style={{
                                width: 12,
                                height: 12,
                                background: category.color,
                                verticalAlign: 'middle',
                            }}
                        />
                    )}
                    {category.name}
                </td>
                <td>
                    {category.isActive !== false ? (
                        <span className="badge bg-success">Aktywna</span>
                    ) : (
                        <span className="badge bg-secondary">Nieaktywna</span>
                    )}
                </td>
                <td className="text-end">
                    <Link
                        href={`/settings/trades/new?parent_id=${category.id}`}
                        className="btn btn-sm btn-outline-secondary me-1"
                    >
                        + Podkategoria
                    </Link>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => onDelete(category.id, category.name)}
                    >
                        Usuń
                    </button>
                </td>
            </tr>
            {category.children?.map((child) => (
                <CategoryRow
                    key={child.id}
                    category={child}
                    depth={depth + 1}
                    onDelete={onDelete}
                />
            ))}
        </>
    );
}

export default function SettingsTradesPage() {
    const { role } = useAuth();
    const toast = useToast();
    const {
        data: tree = [],
        isLoading,
        error,
        refetch,
    } = useServiceCategoryTree();
    const del = useDeleteServiceCategory();
    const [confirmDelete, setConfirmDelete] = useState<{
        id: number;
        name: string;
    } | null>(null);

    useSetSecondaryNav(NAV);

    const handleDelete = (id: number, name: string) => {
        setConfirmDelete({ id, name });
    };

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <SalonShell role={role}>
                <div
                    className="settings-detail-layout"
                    data-testid="settings-trades-page"
                >
                    <aside className="settings-detail-layout__sidebar">
                        {NAV}
                    </aside>
                    <div className="settings-detail-layout__main">
                        <SalonBreadcrumbs
                            iconClass="sprite-breadcrumbs_settings"
                            items={[
                                { label: 'Ustawienia', href: '/settings' },
                                { label: 'Branże' },
                            ]}
                        />

                        <div className="d-flex justify-content-end mb-3">
                            <Link
                                href="/settings/trades/new"
                                className="btn btn-primary"
                            >
                                + Dodaj branżę
                            </Link>
                        </div>

                        {isLoading ? (
                            <div className="text-muted p-3">Ładowanie...</div>
                        ) : error ? (
                            <div className="d-flex flex-column gap-2 p-3">
                                <div className="text-danger">
                                    Nie udało się pobrać branż.
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => void refetch()}
                                >
                                    Odśwież
                                </button>
                            </div>
                        ) : (
                            <div className="salonbw-table-wrap">
                                <table className="salonbw-table">
                                    <thead>
                                        <tr>
                                            <th>Nazwa</th>
                                            <th>Status</th>
                                            <th />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tree.length === 0 ? (
                                            <tr>
                                                <td
                                                    colSpan={3}
                                                    className="text-muted text-center py-4"
                                                >
                                                    Brak branż. Kliknij &ldquo;+
                                                    Dodaj branżę&rdquo; aby
                                                    dodać pierwszą.
                                                </td>
                                            </tr>
                                        ) : (
                                            tree.map((category) => (
                                                <CategoryRow
                                                    key={category.id}
                                                    category={category}
                                                    depth={0}
                                                    onDelete={handleDelete}
                                                />
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
                <ConfirmModal
                    open={!!confirmDelete}
                    title="Usuń branżę"
                    message={`Czy na pewno chcesz usunąć branżę "${confirmDelete?.name}"? Operacja jest nieodwracalna.`}
                    confirmLabel="Usuń"
                    confirmVariant="danger"
                    onConfirm={() => {
                        if (!confirmDelete) return;
                        const { id } = confirmDelete;
                        setConfirmDelete(null);
                        void del.mutateAsync(id).catch(() => {
                            toast.error(
                                'Nie udało się usunąć branży. Spróbuj ponownie.',
                            );
                        });
                    }}
                    onCancel={() => setConfirmDelete(null)}
                />
            </SalonShell>
        </RouteGuard>
    );
}

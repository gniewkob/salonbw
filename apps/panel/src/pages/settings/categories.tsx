import Link from 'next/link';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProductCategories } from '@/hooks/useProducts';
import PanelSection from '@/components/ui/PanelSection';
import PanelTable from '@/components/ui/PanelTable';
import type { ProductCategory } from '@/types';

const WAREHOUSE_NAV = (
    <div className="sidenav secondarynav" id="sidenav">
        <div className="column_row tree other_settings">
            <h4>Ustawienia magazynu</h4>
            <ul>
                <li>
                    <Link href="/settings/categories" className="active">
                        <div className="icon_box">
                            <span className="icon sprite-settings_product_categories_nav" />
                        </div>
                        Kategorie produktów
                    </Link>
                </li>
            </ul>
        </div>
    </div>
);

function CategoryRow({
    category,
    depth = 0,
    onDelete,
    deletingId,
}: {
    category: ProductCategory & { children?: ProductCategory[] };
    depth?: number;
    onDelete: (category: ProductCategory) => void;
    deletingId: number | null;
}) {
    return (
        <>
            <tr className="even">
                <td style={{ paddingLeft: `${8 + depth * 20}px` }}>
                    {category.name}
                </td>
                <td className="actions" style={{ textAlign: 'right' }}>
                    <span className="btn-group">
                        <Link
                            href={`/settings/categories/${category.id}/edit`}
                            className="btn btn-xs btn-default"
                        >
                            edytuj
                        </Link>
                        <Link
                            href={`/settings/categories/new?parent_id=${category.id}`}
                            className="btn btn-xs btn-default"
                        >
                            dodaj podkategorię
                        </Link>
                        <button
                            type="button"
                            className="btn btn-xs btn-default"
                            disabled={deletingId === category.id}
                            onClick={() => onDelete(category)}
                        >
                            usuń
                        </button>
                    </span>
                </td>
            </tr>
            {category.children?.map((child) => (
                <CategoryRow
                    key={child.id}
                    category={child}
                    depth={depth + 1}
                    onDelete={onDelete}
                    deletingId={deletingId}
                />
            ))}
        </>
    );
}

export default function SettingsCategoriesPage() {
    useSetSecondaryNav(WAREHOUSE_NAV);

    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    const { data: categories = [], isLoading } = useProductCategories();
    const deleteCategory = useMutation({
        mutationFn: async (id: number) =>
            apiFetch(`/product-categories/${id}`, { method: 'DELETE' }),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: ['product-categories'],
                }),
                queryClient.invalidateQueries({
                    queryKey: ['product-categories-tree'],
                }),
            ]);
        },
    });

    const handleDelete = (category: ProductCategory) => {
        if (
            !window.confirm(
                `Operacji nie można cofnąć. Czy na pewno chcesz usunąć kategorię "${category.name}"?`,
            )
        ) {
            return;
        }

        void deleteCategory.mutateAsync(category.id);
    };

    return (
        <div className="settings-detail-layout" data-testid="settings-detail">
            <aside className="settings-detail-layout__sidebar">
                {WAREHOUSE_NAV}
            </aside>
            <div className="settings-detail-layout__main">
                <div className="breadcrumbs" e2e-breadcrumbs="">
                    <ul>
                        <li>
                            <div className="icon sprite-breadcrumbs_settings" />
                            <Link href="/settings">Ustawienia</Link>
                        </li>
                        <li>
                            <span> / </span>
                            Ustawienia magazynu
                        </li>
                        <li>
                            <span> / </span>
                            Kategorie produktów
                        </li>
                    </ul>
                </div>
                <PanelSection title="Kategorie produktów">
                    <div className="actions mb-m">
                        <Link
                            href="/products"
                            className="btn btn-default"
                            style={{ marginRight: 8 }}
                        >
                            lista produktów
                        </Link>
                        <Link
                            href="/settings/categories/new"
                            className="btn button-blue"
                        >
                            + dodaj kategorię produktów
                        </Link>
                    </div>
                    {isLoading ? (
                        <p>Ładowanie...</p>
                    ) : (
                        <PanelTable
                            columns={[{ label: 'Nazwa' }, { label: 'Akcje' }]}
                            isEmpty={categories.length === 0}
                            emptyMessage="Brak kategorii"
                        >
                            {categories.map((cat) => (
                                <CategoryRow
                                    key={cat.id}
                                    category={cat}
                                    deletingId={
                                        deleteCategory.isPending
                                            ? (deleteCategory.variables ?? null)
                                            : null
                                    }
                                    onDelete={handleDelete}
                                />
                            ))}
                        </PanelTable>
                    )}
                </PanelSection>
            </div>
        </div>
    );
}

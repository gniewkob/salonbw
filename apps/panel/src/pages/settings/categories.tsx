import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import { useAuth } from '@/contexts/AuthContext';
import {
    useDeleteProductCategory,
    useProductCategories,
    useReorderProductCategories,
} from '@/hooks/useWarehouseViews';
import PanelSection from '@/components/ui/PanelSection';
import type { ProductCategory } from '@/types';

const WAREHOUSE_NAV = (
    <div className="sidenav" id="sidenav">
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

type CategoryNode = ProductCategory & { children: CategoryNode[] };

function toCategoryNodes(categories: ProductCategory[]): CategoryNode[] {
    return categories.map((category) => ({
        ...category,
        children: toCategoryNodes(category.children ?? []),
    }));
}

function cloneTree(nodes: CategoryNode[]): CategoryNode[] {
    return nodes.map((node) => ({
        ...node,
        children: cloneTree(node.children),
    }));
}

function flattenTree(
    nodes: CategoryNode[],
    parentId: number | null = null,
): Array<{ id: number; parentId: number | null; sortOrder: number }> {
    return nodes.flatMap((node, index) => [
        { id: node.id, parentId, sortOrder: index },
        ...flattenTree(node.children, node.id),
    ]);
}

function moveNode(
    tree: CategoryNode[],
    categoryId: number,
    direction: 'up' | 'down',
) {
    const moveWithin = (nodes: CategoryNode[]): boolean => {
        const index = nodes.findIndex((node) => node.id === categoryId);
        if (index >= 0) {
            const target = direction === 'up' ? index - 1 : index + 1;
            if (target < 0 || target >= nodes.length) {
                return true;
            }
            const [item] = nodes.splice(index, 1);
            nodes.splice(target, 0, item);
            return true;
        }
        return nodes.some((node) => moveWithin(node.children));
    };

    moveWithin(tree);
    return tree;
}

function renderCategoryRows(
    nodes: CategoryNode[],
    options: {
        deletingId: number | null;
        isReorderMode: boolean;
        onDelete: (category: ProductCategory) => void;
        onMove: (categoryId: number, direction: 'up' | 'down') => void;
    },
    depth = 0,
): ReactNode[] {
    return nodes.flatMap((category, index) => {
        const siblings = nodes.length;
        const row = (
            <tr key={category.id} className={index % 2 === 0 ? 'even' : 'odd'}>
                <td style={{ paddingLeft: `${8 + depth * 20}px` }}>
                    {category.name}
                </td>
                <td className="actions" style={{ textAlign: 'right' }}>
                    {options.isReorderMode ? (
                        <span className="btn-group">
                            <button
                                type="button"
                                className="btn btn-xs btn-default"
                                disabled={index === 0}
                                onClick={() =>
                                    options.onMove(category.id, 'up')
                                }
                            >
                                ↑
                            </button>
                            <button
                                type="button"
                                className="btn btn-xs btn-default"
                                disabled={index === siblings - 1}
                                onClick={() =>
                                    options.onMove(category.id, 'down')
                                }
                            >
                                ↓
                            </button>
                        </span>
                    ) : (
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
                                disabled={options.deletingId === category.id}
                                onClick={() => options.onDelete(category)}
                            >
                                usuń
                            </button>
                        </span>
                    )}
                </td>
            </tr>
        );

        return [
            row,
            ...renderCategoryRows(category.children, options, depth + 1),
        ];
    });
}

export default function SettingsCategoriesPage() {
    const { role } = useAuth();
    useSetSecondaryNav(WAREHOUSE_NAV);

    const queryClient = useQueryClient();
    const { data: categories = [], isLoading } = useProductCategories();
    const deleteCategory = useDeleteProductCategory();
    const reorderCategories = useReorderProductCategories();
    const [reorderMode, setReorderMode] = useState(false);
    const [draftTree, setDraftTree] = useState<CategoryNode[]>([]);

    const tree = useMemo<CategoryNode[]>(
        () => toCategoryNodes(categories),
        [categories],
    );

    const visibleTree = reorderMode ? draftTree : tree;

    const beginReorder = () => {
        setDraftTree(cloneTree(tree));
        setReorderMode(true);
    };

    const cancelReorder = () => {
        setDraftTree([]);
        setReorderMode(false);
    };

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

    const handleMove = (categoryId: number, direction: 'up' | 'down') => {
        setDraftTree((current) =>
            moveNode(cloneTree(current), categoryId, direction),
        );
    };

    const handleSaveOrder = async () => {
        await reorderCategories.mutateAsync(flattenTree(draftTree));
        setReorderMode(false);
        setDraftTree([]);
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ['product-categories'] }),
            queryClient.invalidateQueries({
                queryKey: ['product-categories-tree'],
            }),
        ]);
    };

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <SalonShell role={role}>
                <div
                    className="settings-detail-layout"
                    data-testid="settings-detail"
                >
                    <aside className="settings-detail-layout__sidebar">
                        {WAREHOUSE_NAV}
                    </aside>
                    <div className="settings-detail-layout__main">
                        <SalonBreadcrumbs
                            iconClass="sprite-breadcrumbs_settings"
                            items={[
                                { label: 'Ustawienia', href: '/settings' },
                                { label: 'Ustawienia magazynu' },
                                { label: 'Kategorie produktów' },
                            ]}
                        />
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
                                    style={{ marginRight: 8 }}
                                >
                                    + dodaj kategorię produktów
                                </Link>
                                {reorderMode ? (
                                    <>
                                        <button
                                            type="button"
                                            className="btn button-blue"
                                            disabled={
                                                reorderCategories.isPending
                                            }
                                            onClick={() =>
                                                void handleSaveOrder()
                                            }
                                        >
                                            {reorderCategories.isPending
                                                ? 'zapisywanie...'
                                                : 'zapisz nowy układ'}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-default"
                                            style={{ marginLeft: 8 }}
                                            onClick={cancelReorder}
                                        >
                                            anuluj
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        className="btn btn-default"
                                        onClick={beginReorder}
                                    >
                                        zmień układ
                                    </button>
                                )}
                            </div>
                            {isLoading ? (
                                <p>Ładowanie...</p>
                            ) : (
                                <table className="table table-striped table-bordered">
                                    <thead>
                                        <tr>
                                            <th>Nazwa</th>
                                            <th style={{ width: 260 }}>
                                                Akcje
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visibleTree.length === 0 ? (
                                            <tr>
                                                <td colSpan={2}>
                                                    Brak kategorii
                                                </td>
                                            </tr>
                                        ) : (
                                            renderCategoryRows(visibleTree, {
                                                deletingId:
                                                    deleteCategory.isPending
                                                        ? (deleteCategory.variables ??
                                                          null)
                                                        : null,
                                                isReorderMode: reorderMode,
                                                onDelete: handleDelete,
                                                onMove: handleMove,
                                            })
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </PanelSection>
                    </div>
                </div>
            </SalonShell>
        </RouteGuard>
    );
}

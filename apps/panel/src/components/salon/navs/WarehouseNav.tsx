import { useRouter } from 'next/router';
import { useProductCategories } from '@/hooks/useWarehouseViews';
import ManageCategoriesModal from '../modals/ManageCategoriesModal';
import { useState } from 'react';
import type { ProductCategory } from '@/types';
import { useStockSummary } from '@/hooks/useStockAlerts';
import { useStocktakings } from '@/hooks/useWarehouse';

function buildExpandedCategoryPath(
    nodes: ProductCategory[],
    targetId?: number,
): Set<number> {
    if (!targetId) return new Set<number>();

    const path: number[] = [];

    const visit = (items: ProductCategory[]) => {
        for (const item of items) {
            path.push(item.id);
            if (item.id === targetId) {
                return true;
            }
            if (item.children?.length && visit(item.children)) {
                return true;
            }
            path.pop();
        }
        return false;
    };

    return visit(nodes) ? new Set(path) : new Set<number>();
}

export default function WarehouseNav() {
    const router = useRouter();
    const path = router.pathname;
    const inventoryNavActive = path.startsWith('/inventory');
    const stockAlertsNavActive = path.startsWith('/stock-alerts');
    const usageNavActive = path.startsWith('/use') || path.startsWith('/usage');
    const { data: categories } = useProductCategories();
    const { data: stockSummary } = useStockSummary(stockAlertsNavActive);
    const { data: draftStocktakings = [] } = useStocktakings(
        {
            status: 'draft',
        },
        inventoryNavActive,
    );
    const { data: inProgressStocktakings = [] } = useStocktakings(
        {
            status: 'in_progress',
        },
        inventoryNavActive,
    );
    const { data: completedStocktakings = [] } = useStocktakings(
        {
            status: 'completed',
        },
        inventoryNavActive,
    );
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const lowStockCount = stockSummary?.lowStockCount ?? 0;

    const currentCategoryId = router.query.categoryId
        ? Number(router.query.categoryId)
        : undefined;
    const expandedCategoryPath = buildExpandedCategoryPath(
        categories ?? [],
        currentCategoryId,
    );

    const updateFilters = (
        categoryId: number | undefined,
        uncategorized?: boolean,
    ) => {
        const query = { ...router.query };
        if (categoryId === undefined) {
            delete query.categoryId;
        } else {
            query.categoryId = String(categoryId);
        }
        if (uncategorized) {
            query.uncategorized = 'true';
        } else {
            delete query.uncategorized;
        }
        // Remove page on filter change
        delete query.page;

        void router.push({ pathname: router.pathname, query }, undefined, {
            shallow: true,
        });
    };

    const renderCategoryNodes = (nodes: ProductCategory[], depth = 0) =>
        nodes.map((category) => (
            <li
                key={category.id}
                className={
                    currentCategoryId === category.id ? 'active' : undefined
                }
            >
                <button
                    type="button"
                    aria-current={
                        currentCategoryId === category.id ? 'true' : undefined
                    }
                    onClick={() => updateFilters(category.id, false)}
                >
                    {category.name}
                </button>
                {category.children?.length &&
                depth < 1 &&
                expandedCategoryPath.has(category.id) ? (
                    <ul>{renderCategoryNodes(category.children, depth + 1)}</ul>
                ) : null}
            </li>
        ));

    const isSubmodulePath = (prefix: string) => path.startsWith(prefix);
    const renderModuleNav = (
        header: string,
        items: Array<{
            label: string;
            href: string;
            query?: Record<string, string>;
        }>,
    ) => (
        <div className="column_row">
            <div className="nav-header">{header}</div>
            <ul className="nav nav-list">
                {items.map((item) => {
                    const queryMatches = item.query
                        ? Object.entries(item.query).every(
                              ([key, value]) => router.query[key] === value,
                          )
                        : true;
                    const hasStatusFilter =
                        typeof router.query.status === 'string';
                    const plainHistoryItem =
                        !item.query && item.href.endsWith('/history');
                    const plainHistoryBlocked =
                        plainHistoryItem && hasStatusFilter;
                    const isActive =
                        (path === item.href &&
                            queryMatches &&
                            !plainHistoryBlocked) ||
                        path.startsWith(`${item.href}/`) ||
                        (item.href.endsWith('/history') &&
                            path.startsWith(
                                `${item.href.replace('/history', '/history/')}`,
                            ));
                    return (
                        <li
                            key={`${item.href}:${item.query ? JSON.stringify(item.query) : ''}`}
                            className={isActive ? 'active' : undefined}
                        >
                            <a
                                href={
                                    item.query
                                        ? `${item.href}?${new URLSearchParams(item.query).toString()}`
                                        : item.href
                                }
                                aria-current={isActive ? 'page' : undefined}
                            >
                                {item.label}
                            </a>
                        </li>
                    );
                })}
            </ul>
        </div>
    );

    if (isSubmodulePath('/sales')) {
        return renderModuleNav('SPRZEDAŻ', [
            { label: 'dodaj sprzedaż', href: '/sales/new' },
            { label: 'historia sprzedaży', href: '/sales/history' },
        ]);
    }

    if (usageNavActive) {
        return renderModuleNav('ZUŻYCIE', [
            { label: 'dodaj zużycie', href: '/use/new' },
            { label: 'historia zużycia', href: '/use/history' },
            { label: 'planowane zużycie', href: '/use/planned' },
        ]);
    }

    // Niski stan magazynowy — pozostaje dostępne jako narzędzie, mimo że
    // dostawcy/zamówienia/dostawy są poza panelem (zamówienia telefoniczne).
    if (isSubmodulePath('/stock-alerts')) {
        return renderModuleNav('ALERTY MAGAZYNOWE', [
            {
                label: `niski stan (${lowStockCount})`,
                href: '/stock-alerts',
            },
        ]);
    }

    if (isSubmodulePath('/inventory')) {
        return renderModuleNav('INWENTARYZACJA', [
            { label: 'nowa inwentaryzacja', href: '/inventory/new' },
            { label: 'historia inwentaryzacji', href: '/inventory' },
            {
                label: `wersje robocze (${draftStocktakings.length})`,
                href: '/inventory',
                query: { status: 'draft' },
            },
            {
                label: `w toku (${inProgressStocktakings.length})`,
                href: '/inventory',
                query: { status: 'in_progress' },
            },
            {
                label: `zakończone (${completedStocktakings.length})`,
                href: '/inventory',
                query: { status: 'completed' },
            },
        ]);
    }

    if (isSubmodulePath('/suppliers')) {
        return renderModuleNav('DOSTAWCY', [
            { label: 'lista dostawców', href: '/suppliers' },
        ]);
    }

    if (isSubmodulePath('/deliveries')) {
        return renderModuleNav('DOSTAWY', [
            { label: 'nowa dostawa', href: '/deliveries/new' },
            { label: 'historia dostaw', href: '/deliveries/history' },
        ]);
    }

    if (isSubmodulePath('/orders')) {
        return renderModuleNav('ZAMÓWIENIA', [
            { label: 'nowe zamówienie', href: '/orders/new' },
            { label: 'historia zamówień', href: '/orders/history' },
        ]);
    }

    if (isSubmodulePath('/manufacturers')) {
        return renderModuleNav('PRODUCENCI', [
            { label: 'lista producentów', href: '/manufacturers' },
        ]);
    }

    return (
        <div className="column_row">
            <div data-product-categories-menu="">
                <div className="tree">
                    <button
                        type="button"
                        className={
                            !currentCategoryId &&
                            router.query.uncategorized !== 'true'
                                ? 'root active'
                                : 'root'
                        }
                        data-menu-item-name="root"
                        aria-current={
                            !currentCategoryId &&
                            router.query.uncategorized !== 'true'
                                ? 'true'
                                : undefined
                        }
                        onClick={() => updateFilters(undefined)}
                    >
                        <div className="icon_box">
                            <i
                                className="icon sprite-stock_products"
                                aria-hidden="true"
                            />
                        </div>
                        Wszystkie produkty
                    </button>

                    <ul>
                        {categories?.length
                            ? renderCategoryNodes(categories)
                            : null}

                        <li
                            className={
                                router.query.uncategorized === 'true'
                                    ? 'active'
                                    : undefined
                            }
                        >
                            <button
                                type="button"
                                aria-current={
                                    router.query.uncategorized === 'true'
                                        ? 'true'
                                        : undefined
                                }
                                onClick={() => updateFilters(undefined, true)}
                            >
                                produkty bez kategorii
                            </button>
                        </li>
                    </ul>
                </div>

                <div className="tree_options">
                    <button
                        type="button"
                        onClick={() => setIsManageModalOpen(true)}
                    >
                        dodaj/edytuj/usuń
                    </button>
                </div>
            </div>

            {isManageModalOpen && (
                <ManageCategoriesModal
                    type="product"
                    onClose={() => setIsManageModalOpen(false)}
                />
            )}
        </div>
    );
}

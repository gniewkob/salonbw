import { useRouter } from 'next/router';
import Link from 'next/link';
import { useProductCategories } from '@/hooks/useWarehouseViews';
import ManageCategoriesModal from '../modals/ManageCategoriesModal';
import { useState } from 'react';
import type { ProductCategory } from '@/types';
import { useDeliveries } from '@/hooks/useWarehouse';
import { useWarehouseOrders } from '@/hooks/useWarehouseViews';
import { useStockSummary } from '@/hooks/useStockAlerts';
import { useStocktakings } from '@/hooks/useWarehouse';

export default function WarehouseNav() {
    const router = useRouter();
    const path = router.pathname;
    const productsNavActive = path.startsWith('/products');
    const inventoryNavActive = path.startsWith('/inventory');
    const deliveriesNavActive =
        path.startsWith('/deliveries') ||
        path.startsWith('/suppliers') ||
        path.startsWith('/stock-alerts') ||
        path.startsWith('/manufacturers');
    const ordersNavActive = path.startsWith('/orders');
    const usageNavActive = path.startsWith('/use') || path.startsWith('/usage');
    const { data: categories } = useProductCategories(productsNavActive);
    const { data: draftDeliveries = [] } = useDeliveries(
        { status: 'draft' },
        deliveriesNavActive,
    );
    const { data: pendingDeliveries = [] } = useDeliveries(
        { status: 'pending' },
        deliveriesNavActive,
    );
    const { data: orders = [] } = useWarehouseOrders(ordersNavActive);
    const { data: stockSummary } = useStockSummary(deliveriesNavActive);
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
    const draftOrdersCount = orders.filter(
        (order) => order.status === 'draft',
    ).length;
    const lowStockCount = stockSummary?.lowStockCount ?? 0;

    const currentCategoryId = router.query.categoryId
        ? Number(router.query.categoryId)
        : undefined;

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

    const renderCategoryNodes = (nodes: ProductCategory[]) =>
        nodes.map((category) => (
            <li
                key={category.id}
                className={
                    currentCategoryId === category.id ? 'active' : undefined
                }
            >
                <a
                    href="javascript:;"
                    onClick={() => updateFilters(category.id, false)}
                >
                    {category.name}
                </a>
                {category.children?.length ? (
                    <ul>{renderCategoryNodes(category.children)}</ul>
                ) : null}
            </li>
        ));

    const isSubmodulePath = (prefix: string) => path.startsWith(prefix);
    const isNavItemActive = (href: string, query?: Record<string, string>) => {
        const queryMatches = query
            ? Object.entries(query).every(([key, value]) => {
                  const queryValue = router.query[key];
                  return Array.isArray(queryValue)
                      ? queryValue[0] === value
                      : queryValue === value;
              })
            : true;
        const hasStatusFilter = typeof router.query.status === 'string';
        const plainHistoryItem = !query && href.endsWith('/history');
        const plainHistoryBlocked = plainHistoryItem && hasStatusFilter;

        return (
            ((path === href && queryMatches && !plainHistoryBlocked) ||
                path.startsWith(`${href}/`) ||
                (href.endsWith('/history') &&
                    path.startsWith(
                        `${href.replace('/history', '/history/')}`,
                    ))) &&
            queryMatches
        );
    };
    const renderModuleNav = (
        header: string,
        items: Array<{
            label: string;
            href: string;
            query?: Record<string, string>;
        }>,
    ) => (
        <>
            <div className="nav-header">{header}</div>
            <ul className="nav nav-list">
                {items.map((item) => (
                    <li
                        key={`${item.href}:${item.query ? JSON.stringify(item.query) : ''}`}
                        className={
                            isNavItemActive(item.href, item.query)
                                ? 'active'
                                : undefined
                        }
                    >
                        <a
                            href={
                                item.query
                                    ? `${item.href}?${new URLSearchParams(item.query).toString()}`
                                    : item.href
                            }
                        >
                            {item.label}
                        </a>
                    </li>
                ))}
            </ul>
        </>
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

    if (
        isSubmodulePath('/deliveries') ||
        isSubmodulePath('/suppliers') ||
        isSubmodulePath('/stock-alerts') ||
        isSubmodulePath('/manufacturers')
    ) {
        return (
            <>
                <div className="nav-header">DOSTAWY</div>
                <ul className="nav nav-list tree">
                    <li
                        className={
                            isNavItemActive('/deliveries/new')
                                ? 'active'
                                : undefined
                        }
                    >
                        <Link href="/deliveries/new">dodaj dostawę</Link>
                    </li>
                    <li
                        className={
                            isNavItemActive('/deliveries/history')
                                ? 'active'
                                : undefined
                        }
                    >
                        <Link href="/deliveries/history">historia dostaw</Link>
                    </li>
                    <li
                        className={
                            isNavItemActive('/deliveries/history', {
                                status: 'draft',
                            })
                                ? 'active'
                                : undefined
                        }
                    >
                        <Link href="/deliveries/history?status=draft">
                            wersje robocze ({draftDeliveries.length})
                        </Link>
                    </li>
                    <li
                        className={
                            isNavItemActive('/deliveries/history', {
                                status: 'pending',
                            })
                                ? 'active'
                                : undefined
                        }
                    >
                        <Link href="/deliveries/history?status=pending">
                            oczekujące ({pendingDeliveries.length})
                        </Link>
                    </li>
                    <li
                        className={
                            isNavItemActive('/stock-alerts')
                                ? 'active'
                                : undefined
                        }
                    >
                        <Link href="/stock-alerts">
                            niski stan magazynowy ({lowStockCount})
                        </Link>
                        <ul>
                            <li
                                className={
                                    isNavItemActive('/suppliers')
                                        ? 'active'
                                        : undefined
                                }
                            >
                                <Link href="/suppliers">dostawcy</Link>
                            </li>
                            <li
                                className={
                                    isNavItemActive('/manufacturers')
                                        ? 'active'
                                        : undefined
                                }
                            >
                                <Link href="/manufacturers">producenci</Link>
                            </li>
                        </ul>
                    </li>
                </ul>
            </>
        );
    }

    if (isSubmodulePath('/orders')) {
        return renderModuleNav('ZAMÓWIENIA', [
            { label: 'dodaj zamówienie', href: '/orders/new' },
            { label: 'historia zamówień', href: '/orders/history' },
            {
                label: `wersje robocze (${draftOrdersCount})`,
                href: '/orders/history',
                query: { status: 'draft' },
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

    return (
        <>
            <div className="nav-header">KATEGORIE PRODUKTÓW</div>
            <ul className="nav nav-list tree">
                <li
                    className={
                        !currentCategoryId &&
                        router.query.uncategorized !== 'true'
                            ? 'active'
                            : undefined
                    }
                >
                    <a
                        href="javascript:;"
                        onClick={() => updateFilters(undefined)}
                    >
                        Wszystkie produkty
                    </a>
                </li>

                {categories?.length ? renderCategoryNodes(categories) : null}

                <li
                    className={
                        router.query.uncategorized === 'true'
                            ? 'active'
                            : undefined
                    }
                >
                    <a
                        href="javascript:;"
                        onClick={() => updateFilters(undefined, true)}
                    >
                        produkty bez kategorii
                    </a>
                </li>

                <li className="divider" />
                <li>
                    <a
                        href="javascript:;"
                        onClick={() => setIsManageModalOpen(true)}
                    >
                        <div className="icon_box">
                            <i className="icon sprite-icon_plus" />
                        </div>
                        dodaj/edytuj/usuń
                    </a>
                </li>
            </ul>

            {isManageModalOpen && (
                <ManageCategoriesModal
                    type="product"
                    onClose={() => setIsManageModalOpen(false)}
                />
            )}
        </>
    );
}

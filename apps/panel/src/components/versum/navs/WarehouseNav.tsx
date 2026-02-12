import { useRouter } from 'next/router';
import { useProductCategories } from '@/hooks/useWarehouseViews';
import ManageCategoriesModal from '../modals/ManageCategoriesModal';
import { useState } from 'react';
import type { ProductCategory } from '@/types';

export default function WarehouseNav() {
    const router = useRouter();
    const { data: categories } = useProductCategories();
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const path = router.pathname;

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
                        className={(() => {
                            const queryMatches = item.query
                                ? Object.entries(item.query).every(
                                      ([key, value]) =>
                                          router.query[key] === value,
                                  )
                                : true;
                            const hasStatusFilter =
                                typeof router.query.status === 'string';
                            const plainHistoryItem =
                                !item.query && item.href.endsWith('/history');
                            const plainHistoryBlocked =
                                plainHistoryItem && hasStatusFilter;

                            return (path === item.href &&
                                queryMatches &&
                                !plainHistoryBlocked) ||
                                path.startsWith(`${item.href}/`) ||
                                (item.href.endsWith('/history') &&
                                    path.startsWith(
                                        `${item.href.replace('/history', '/history/')}`,
                                    ))
                                ? 'active'
                                : undefined;
                        })()}
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

    if (isSubmodulePath('/use')) {
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
        return renderModuleNav('DOSTAWY', [
            { label: 'dodaj dostawę', href: '/deliveries/new' },
            { label: 'historia dostaw', href: '/deliveries/history' },
            {
                label: 'wersje robocze',
                href: '/deliveries/history',
                query: { status: 'draft' },
            },
            { label: 'niski stan magazynowy', href: '/stock-alerts' },
            { label: 'dostawcy', href: '/suppliers' },
            { label: 'producenci', href: '/manufacturers' },
        ]);
    }

    if (isSubmodulePath('/orders')) {
        return renderModuleNav('ZAMÓWIENIA', [
            { label: 'dodaj zamówienie', href: '/orders/new' },
            { label: 'historia zamówień', href: '/orders/history' },
            {
                label: 'wersje robocze',
                href: '/orders/history',
                query: { status: 'draft' },
            },
        ]);
    }

    if (isSubmodulePath('/inventory')) {
        return renderModuleNav('INWENTARYZACJA', [
            { label: 'nowa inwentaryzacja', href: '/inventory/new' },
            { label: 'historia inwentaryzacji', href: '/inventory' },
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

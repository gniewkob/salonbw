import { useRouter } from 'next/router';
import { useProductCategories } from '@/hooks/useWarehouseViews';
import ManageCategoriesModal from '../modals/ManageCategoriesModal';
import { useState } from 'react';
import type { ProductCategory } from '@/types';

export default function WarehouseNav() {
    const router = useRouter();
    const { data: categories } = useProductCategories();
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);

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

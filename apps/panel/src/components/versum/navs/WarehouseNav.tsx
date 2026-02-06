import { useRouter } from 'next/router';
import { useProductCategories } from '@/hooks/useProducts';
import ManageCategoriesModal from '../modals/ManageCategoriesModal';
import { useState } from 'react';

export default function WarehouseNav() {
    const router = useRouter();
    const { data: categories } = useProductCategories();
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);

    const currentCategoryId = router.query.categoryId
        ? Number(router.query.categoryId)
        : undefined;

    const updateFilters = (categoryId: number | undefined) => {
        const query = { ...router.query };
        if (categoryId === undefined) {
            delete query.categoryId;
        } else {
            query.categoryId = String(categoryId);
        }
        // Remove page on filter change
        delete query.page;

        void router.push({ pathname: router.pathname, query }, undefined, {
            shallow: true,
        });
    };

    return (
        <>
            <div className="nav-header">KATEGORIE PRODUKTÓW</div>
            <ul className="nav nav-list">
                <li className={!currentCategoryId ? 'active' : undefined}>
                    <a
                        href="javascript:;"
                        onClick={() => updateFilters(undefined)}
                    >
                        Wszystkie produkty
                    </a>
                </li>
                {categories?.map((category) => (
                    <li
                        key={category.id}
                        className={
                            currentCategoryId === category.id
                                ? 'active'
                                : undefined
                        }
                    >
                        <a
                            href="javascript:;"
                            onClick={() => updateFilters(category.id)}
                        >
                            {category.name}
                        </a>
                    </li>
                ))}
                <li className="divider"></li>
                <li>
                    <a
                        href="javascript:;"
                        onClick={() => setIsManageModalOpen(true)}
                        className="text-blue-600"
                    >
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

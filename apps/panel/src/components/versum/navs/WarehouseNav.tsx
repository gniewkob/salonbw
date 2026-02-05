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
            <section className="versum-secondarynav__section">
                <h4>KATEGORIE PRODUKTÓW</h4>
                <ul>
                    <li
                        className={!currentCategoryId ? 'is-active' : undefined}
                    >
                        <button
                            onClick={() => updateFilters(undefined)}
                            className="versum-secondarynav__item-btn"
                        >
                            Wszystkie produkty
                        </button>
                    </li>
                    {categories?.map((category) => (
                        <li
                            key={category.id}
                            className={
                                currentCategoryId === category.id
                                    ? 'is-active'
                                    : undefined
                            }
                        >
                            <button
                                onClick={() => updateFilters(category.id)}
                                className="versum-secondarynav__item-btn"
                            >
                                {category.name}
                            </button>
                        </li>
                    ))}
                    <li>
                        <button
                            onClick={() => setIsManageModalOpen(true)}
                            className="versum-secondarynav__item-btn text-blue-600"
                        >
                            dodaj/edytuj/usuń
                        </button>
                    </li>
                </ul>
            </section>

            {isManageModalOpen && (
                <ManageCategoriesModal
                    type="product"
                    onClose={() => setIsManageModalOpen(false)}
                />
            )}
        </>
    );
}

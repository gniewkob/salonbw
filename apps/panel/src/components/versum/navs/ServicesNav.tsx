import { useRouter } from 'next/router';
import { useState } from 'react';
import { useServiceCategories } from '@/hooks/useServicesAdmin';
import ManageCategoriesModal from '@/components/services/ManageCategoriesModal';

export default function ServicesNav() {
    const router = useRouter();
    const { data: categories = [] } = useServiceCategories();
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

        // Reset page
        query.page = '1';

        void router.push({ pathname: router.pathname, query }, undefined, {
            shallow: true,
        });
    };

    return (
        <div className="sidebar-inner nav-scroll-container">
            {/* All Services */}
            <ul className="nav nav-list">
                <li className={!currentCategoryId ? 'active' : undefined}>
                    <a
                        href="javascript:;"
                        onClick={() => updateFilters(undefined)}
                    >
                        Wszystkie usługi
                    </a>
                </li>
            </ul>

            {/* Category List */}
            <ul className="nav nav-list">
                {categories.map((category) => (
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
                {/* Uncategorized services */}
                <li className={currentCategoryId === 0 ? 'active' : undefined}>
                    <a href="javascript:;" onClick={() => updateFilters(0)}>
                        usługi bez kategorii
                    </a>
                </li>
            </ul>

            {/* Manage Categories Link */}
            <div className="versum-secondarynav__manage-groups">
                <a
                    href="javascript:;"
                    onClick={() => setIsManageModalOpen(true)}
                    className="versum-secondarynav__link"
                >
                    dodaj/edytuj/usuń
                </a>
            </div>

            <ManageCategoriesModal
                isOpen={isManageModalOpen}
                categories={categories}
                onClose={() => setIsManageModalOpen(false)}
            />
        </div>
    );
}

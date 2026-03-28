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
        <div className="column_row">
            <div className="tree">
                <a
                    className={
                        !currentCategoryId
                            ? 'item root with_icon active'
                            : 'item root with_icon'
                    }
                    href="#"
                    onClick={(event) => {
                        event.preventDefault();
                        updateFilters(undefined);
                    }}
                >
                    <span className="icon_box">
                        <i className="icon sprite-settings_services" />
                    </span>
                    Wszystkie usługi
                </a>
                <ul>
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
                                href="#"
                                onClick={(event) => {
                                    event.preventDefault();
                                    updateFilters(category.id);
                                }}
                            >
                                {category.name}
                            </a>
                        </li>
                    ))}
                    <li
                        className={
                            currentCategoryId === 0 ? 'active' : undefined
                        }
                    >
                        <a
                            href="#"
                            onClick={(event) => {
                                event.preventDefault();
                                updateFilters(0);
                            }}
                        >
                            usługi bez kategorii
                        </a>
                    </li>
                </ul>
            </div>

            <div className="tree_options">
                <a
                    href="#"
                    onClick={(event) => {
                        event.preventDefault();
                        setIsManageModalOpen(true);
                    }}
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

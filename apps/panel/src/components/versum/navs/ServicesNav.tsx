import { useRouter } from 'next/router';
import { useServiceCategories } from '@/hooks/useServicesAdmin';

export default function ServicesNav() {
    const router = useRouter();
    const { data: categories } = useServiceCategories();

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
        <section className="versum-secondarynav__section">
            <h4>
                KATEGORIE
                {/* Placeholder for managing categories */}
                <button
                    className="versum-secondarynav__add-btn"
                    title="Zarządzaj kategoriami"
                    onClick={() => {
                        /* TODO: Manage categories modal/page */
                    }}
                >
                    ⚙️
                </button>
            </h4>
            <ul>
                <li className={!currentCategoryId ? 'is-active' : undefined}>
                    <button
                        onClick={() => updateFilters(undefined)}
                        className="versum-secondarynav__item-btn"
                    >
                        Wszystkie usługi
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
                            {category.color && (
                                <span
                                    className="versum-chip"
                                    style={{ backgroundColor: category.color }}
                                />
                            )}
                            {category.name}
                        </button>
                    </li>
                ))}
            </ul>
        </section>
    );
}

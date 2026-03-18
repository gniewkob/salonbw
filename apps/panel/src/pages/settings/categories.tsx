import Link from 'next/link';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import { useProductCategories } from '@/hooks/useProducts';
import PanelSection from '@/components/ui/PanelSection';
import PanelTable from '@/components/ui/PanelTable';
import type { ProductCategory } from '@/types';

const WAREHOUSE_NAV = (
    <div className="sidenav secondarynav" id="sidenav">
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

function CategoryRow({
    category,
    depth = 0,
}: {
    category: ProductCategory & { children?: ProductCategory[] };
    depth?: number;
}) {
    return (
        <>
            <tr className="even">
                <td style={{ paddingLeft: `${8 + depth * 20}px` }}>
                    {category.name}
                </td>
                <td className="actions" style={{ textAlign: 'right' }}>
                    <span className="btn-group">
                        <button
                            type="button"
                            className="btn btn-xs btn-default"
                            disabled
                        >
                            edytuj
                        </button>
                        <button
                            type="button"
                            className="btn btn-xs btn-default"
                            disabled
                        >
                            usuń
                        </button>
                    </span>
                </td>
            </tr>
            {category.children?.map((child) => (
                <CategoryRow
                    key={child.id}
                    category={child}
                    depth={depth + 1}
                />
            ))}
        </>
    );
}

export default function SettingsCategoriesPage() {
    useSetSecondaryNav(WAREHOUSE_NAV);

    const { data: categories = [], isLoading } = useProductCategories();

    return (
        <div className="settings-detail-layout" data-testid="settings-detail">
            <aside className="settings-detail-layout__sidebar">
                {WAREHOUSE_NAV}
            </aside>
            <div className="settings-detail-layout__main">
                <div className="breadcrumbs" e2e-breadcrumbs="">
                    <ul>
                        <li>
                            <div className="icon sprite-breadcrumbs_settings" />
                            <Link href="/settings">Ustawienia</Link>
                        </li>
                        <li>
                            <span> / </span>
                            Ustawienia magazynu
                        </li>
                        <li>
                            <span> / </span>
                            Kategorie produktów
                        </li>
                    </ul>
                </div>
                <PanelSection
                    title="Kategorie produktów"
                    action={
                        <Link
                            href="/settings/categories/new"
                            className="btn button-blue pull-right"
                        >
                            + dodaj kategorię
                        </Link>
                    }
                >
                    {isLoading ? (
                        <p>Ładowanie...</p>
                    ) : (
                        <PanelTable
                            columns={[{ label: 'Nazwa' }, { label: 'Akcje' }]}
                            isEmpty={categories.length === 0}
                            emptyMessage="Brak kategorii"
                        >
                            {categories.map((cat) => (
                                <CategoryRow key={cat.id} category={cat} />
                            ))}
                        </PanelTable>
                    )}
                </PanelSection>
            </div>
        </div>
    );
}

import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProductCategories } from '@/hooks/useProducts';
import PanelSection from '@/components/ui/PanelSection';
import type { ProductCategory } from '@/types';

const NAV = (
    <div className="sidenav" id="sidenav">
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

function flattenCategories(
    categories: ProductCategory[],
    depth = 0,
): Array<ProductCategory & { depth: number }> {
    return categories.flatMap((category) => [
        { ...category, depth },
        ...flattenCategories(category.children ?? [], depth + 1),
    ]);
}

export default function SettingsCategoriesEditPage() {
    const router = useRouter();
    const { role } = useAuth();
    useSetSecondaryNav(NAV);

    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    const categoryId = Number(router.query.id);
    const { data: categories = [], isLoading } = useProductCategories();
    const flatCategories = useMemo(
        () => flattenCategories(categories),
        [categories],
    );
    const category = useMemo(
        () => flatCategories.find((entry) => entry.id === categoryId) ?? null,
        [categoryId, flatCategories],
    );
    const selectableParents = useMemo(
        () => flatCategories.filter((entry) => entry.id !== categoryId),
        [categoryId, flatCategories],
    );

    const [name, setName] = useState('');
    const [parentId, setParentId] = useState('');

    const updateCategory = useMutation({
        mutationFn: async (payload: {
            name: string;
            parentId?: number | null;
        }) =>
            apiFetch<ProductCategory>(`/product-categories/${categoryId}`, {
                method: 'PATCH',
                body: JSON.stringify(payload),
            }),
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({
                    queryKey: ['product-categories'],
                }),
                queryClient.invalidateQueries({
                    queryKey: ['product-categories-tree'],
                }),
            ]);
        },
    });

    useEffect(() => {
        if (!category) return;
        setName((current) => current || category.name);
        setParentId(
            (current) =>
                current || (category.parentId ? String(category.parentId) : ''),
        );
    }, [category]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!categoryId) return;

        await updateCategory.mutateAsync({
            name,
            parentId: parentId ? Number(parentId) : null,
        });
        void router.push('/settings/categories');
    };

    if (!role) return null;

    if (isLoading) {
        return (
            <RouteGuard roles={['admin']} permission="nav:settings">
                <SalonShell role={role}>
                    <div
                        className="settings-detail-layout"
                        data-testid="settings-detail"
                    >
                        <aside className="settings-detail-layout__sidebar">
                            {NAV}
                        </aside>
                        <div className="settings-detail-layout__main">
                            <PanelSection>
                                <p>Ładowanie...</p>
                            </PanelSection>
                        </div>
                    </div>
                </SalonShell>
            </RouteGuard>
        );
    }

    if (!category) {
        return (
            <RouteGuard roles={['admin']} permission="nav:settings">
                <SalonShell role={role}>
                    <div
                        className="settings-detail-layout"
                        data-testid="settings-detail"
                    >
                        <aside className="settings-detail-layout__sidebar">
                            {NAV}
                        </aside>
                        <div className="settings-detail-layout__main">
                            <PanelSection>
                                <p>Nie znaleziono kategorii.</p>
                            </PanelSection>
                        </div>
                    </div>
                </SalonShell>
            </RouteGuard>
        );
    }

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <SalonShell role={role}>
                <div
                    className="settings-detail-layout"
                    data-testid="settings-detail"
                >
                    <aside className="settings-detail-layout__sidebar">
                        {NAV}
                    </aside>
                    <div className="settings-detail-layout__main">
                        <SalonBreadcrumbs
                            iconClass="sprite-breadcrumbs_settings"
                            items={[
                                { label: 'Ustawienia', href: '/settings' },
                                {
                                    label: 'Kategorie produktów',
                                    href: '/settings/categories',
                                },
                                { label: 'Edycja kategorii' },
                            ]}
                        />
                        <PanelSection>
                            <form
                                onSubmit={(event) => void handleSubmit(event)}
                            >
                                <h2>Edytuj kategorię produktów</h2>
                                <div className="form-group">
                                    <label
                                        htmlFor="name"
                                        className="control-label"
                                    >
                                        Nazwa
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        className="form-control"
                                        value={name}
                                        onChange={(event) =>
                                            setName(event.target.value)
                                        }
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label
                                        htmlFor="parentId"
                                        className="control-label"
                                    >
                                        Kategoria nadrzędna (opcjonalnie)
                                    </label>
                                    <select
                                        id="parentId"
                                        className="form-control"
                                        value={parentId}
                                        onChange={(event) =>
                                            setParentId(event.target.value)
                                        }
                                    >
                                        <option value="">— brak —</option>
                                        {selectableParents.map((entry) => (
                                            <option
                                                key={entry.id}
                                                value={entry.id}
                                            >
                                                {'-'.repeat(entry.depth)}{' '}
                                                {entry.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <button
                                        type="submit"
                                        className="btn button-blue"
                                        disabled={updateCategory.isPending}
                                    >
                                        {updateCategory.isPending
                                            ? 'Zapisywanie...'
                                            : 'Zapisz kategorię'}
                                    </button>
                                    <Link
                                        href="/settings/categories"
                                        className="btn btn-default"
                                        style={{ marginLeft: 8 }}
                                    >
                                        Anuluj
                                    </Link>
                                </div>
                            </form>
                        </PanelSection>
                    </div>
                </div>
            </SalonShell>
        </RouteGuard>
    );
}

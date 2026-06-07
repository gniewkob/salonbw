import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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

function useCreateProductCategory() {
    const { apiFetch } = useAuth();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { name: string; parentId?: number }) =>
            apiFetch<ProductCategory>('/product-categories', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ['product-categories'],
            });
        },
    });
}

export default function SettingsCategoriesNewPage() {
    const router = useRouter();
    const { role } = useAuth();
    useSetSecondaryNav(NAV);

    const createCategory = useCreateProductCategory();
    const { data: categories = [] } = useProductCategories();
    const [name, setName] = useState('');
    const [submitError, setSubmitError] = useState('');
    const initialParentId = useMemo(() => {
        const queryValue = router.query.parent_id;
        return typeof queryValue === 'string' ? queryValue : '';
    }, [router.query.parent_id]);
    const [parentId, setParentId] = useState(initialParentId);

    useEffect(() => {
        if (initialParentId && !parentId) {
            setParentId(initialParentId);
        }
    }, [initialParentId, parentId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setSubmitError('Nazwa kategorii jest wymagana');
            return;
        }
        setSubmitError('');
        try {
            await createCategory.mutateAsync({
                name: name.trim(),
                ...(parentId ? { parentId: Number(parentId) } : {}),
            });
            void router.push('/settings/categories');
        } catch {
            setSubmitError(
                'Nie udało się zapisać kategorii. Spróbuj ponownie.',
            );
        }
    };

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <Head>
                <title>Nowa kategoria usług — Salon Black &amp; White</title>
            </Head>
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
                                { label: 'Nowa kategoria' },
                            ]}
                        />
                        <PanelSection>
                            <form onSubmit={(e) => void handleSubmit(e)}>
                                {submitError && (
                                    <div
                                        className="alert alert-danger py-2 small mb-3"
                                        role="alert"
                                    >
                                        {submitError}
                                    </div>
                                )}
                                <h2>Dodaj kategorię produktów</h2>
                                <div className="mb-3">
                                    <label
                                        htmlFor="name"
                                        className="form-label"
                                    >
                                        Nazwa
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        className="form-control"
                                        value={name}
                                        onChange={(e) =>
                                            setName(e.target.value)
                                        }
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label
                                        htmlFor="parentId"
                                        className="form-label"
                                    >
                                        Kategoria nadrzędna (opcjonalnie)
                                    </label>
                                    <select
                                        id="parentId"
                                        className="form-control"
                                        value={parentId}
                                        onChange={(e) =>
                                            setParentId(e.target.value)
                                        }
                                    >
                                        <option value="">— brak —</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={createCategory.isPending}
                                    >
                                        {createCategory.isPending
                                            ? 'Zapisywanie...'
                                            : 'Dodaj kategorię'}
                                    </button>
                                    <Link
                                        href="/settings/categories"
                                        className="btn btn-outline-secondary"
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

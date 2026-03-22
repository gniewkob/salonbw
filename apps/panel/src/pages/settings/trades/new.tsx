'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import PanelSection from '@/components/ui/PanelSection';
import {
    useCreateServiceCategory,
    useServiceCategoryTree,
} from '@/hooks/useServicesAdmin';
import type { ServiceCategory } from '@/types';

const NAV = (
    <div className="sidenav" id="sidenav">
        <div className="column_row tree other_settings">
            <h4>Ustawienia usług</h4>
            <ul>
                <li>
                    <Link href="/settings/trades/new" className="active">
                        <div className="icon_box">
                            <span className="icon sprite-settings_services_nav" />
                        </div>
                        Branże
                    </Link>
                </li>
            </ul>
        </div>
    </div>
);

type CategoryOption = {
    id: number;
    depth: number;
    name: string;
};

function flattenCategories(
    categories: ServiceCategory[],
    depth = 0,
): CategoryOption[] {
    const result: CategoryOption[] = [];

    for (const category of categories) {
        result.push({
            id: category.id,
            depth,
            name: category.name,
        });

        if (category.children?.length) {
            result.push(...flattenCategories(category.children, depth + 1));
        }
    }

    return result;
}

function formatCategoryLabel(option: CategoryOption) {
    return `${'\u00A0'.repeat(option.depth * 4)}${option.name}`;
}

export default function SettingsTradesNewPage() {
    const router = useRouter();
    useSetSecondaryNav(NAV);

    const createCategory = useCreateServiceCategory();
    const { data: categoryTree = [] } = useServiceCategoryTree();

    const parentOptions = useMemo(
        () => flattenCategories(categoryTree),
        [categoryTree],
    );

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#25B4C1');
    const [parentId, setParentId] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);

        try {
            const created = await createCategory.mutateAsync({
                name: name.trim(),
                description: description.trim() || undefined,
                color: color || undefined,
                parentId: parentId ? Number(parentId) : undefined,
                isActive,
            });

            await router.push(`/services?categoryId=${created.id}`);
        } catch (err) {
            console.error('Error creating service category:', err);
            setError(
                'Nie udało się zapisać branży. Sprawdź dane i spróbuj ponownie.',
            );
        }
    };

    return (
        <div className="settings-detail-layout" data-testid="settings-detail">
            <aside className="settings-detail-layout__sidebar">{NAV}</aside>
            <div className="settings-detail-layout__main">
                <div className="breadcrumbs" e2e-breadcrumbs="">
                    <ul>
                        <li>
                            <div className="icon sprite-breadcrumbs_settings" />
                            <Link href="/settings">Ustawienia</Link>
                        </li>
                        <li>
                            <span> / </span>
                            Ustawienia usług
                        </li>
                        <li>
                            <span> / </span>
                            Branże
                        </li>
                        <li>
                            <span> / </span>
                            Nowa branża
                        </li>
                    </ul>
                </div>
                <PanelSection>
                    <form onSubmit={(event) => void handleSubmit(event)}>
                        <h2>Dodaj branżę</h2>

                        {error && (
                            <div className="alert alert-danger">{error}</div>
                        )}

                        <div className="form-group">
                            <label htmlFor="name" className="control-label">
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
                            <label htmlFor="parentId" className="control-label">
                                Branża nadrzędna
                            </label>
                            <select
                                id="parentId"
                                className="form-control"
                                value={parentId}
                                onChange={(event) =>
                                    setParentId(event.target.value)
                                }
                            >
                                <option value="">Brak</option>
                                {parentOptions.map((option) => (
                                    <option key={option.id} value={option.id}>
                                        {formatCategoryLabel(option)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label
                                htmlFor="description"
                                className="control-label"
                            >
                                Opis
                            </label>
                            <textarea
                                id="description"
                                className="form-control"
                                rows={4}
                                value={description}
                                onChange={(event) =>
                                    setDescription(event.target.value)
                                }
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="color" className="control-label">
                                Kolor
                            </label>
                            <input
                                id="color"
                                type="color"
                                className="form-control"
                                value={color}
                                onChange={(event) =>
                                    setColor(event.target.value)
                                }
                            />
                        </div>

                        <div className="checkbox">
                            <label>
                                <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(event) =>
                                        setIsActive(event.target.checked)
                                    }
                                />
                                Aktywna branża
                            </label>
                        </div>

                        <div className="form-group" style={{ marginTop: 16 }}>
                            <button
                                type="submit"
                                className="btn button-blue"
                                disabled={createCategory.isPending}
                            >
                                {createCategory.isPending
                                    ? 'Zapisywanie...'
                                    : 'Dodaj branżę'}
                            </button>
                            <Link
                                href="/services"
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
    );
}

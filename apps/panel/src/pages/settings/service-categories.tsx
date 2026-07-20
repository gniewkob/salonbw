import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import ConfirmModal from '@/components/ConfirmModal';
import PanelSection from '@/components/ui/PanelSection';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useServices } from '@/hooks/useServices';
import {
    useServiceCategories,
    useCreateServiceCategory,
    useUpdateServiceCategory,
    useDeleteServiceCategory,
} from '@/hooks/useServicesAdmin';
import type { ServiceCategory } from '@/types';

const SERVICE_SETTINGS_NAV = (
    <div className="sidenav" id="sidenav">
        <div className="column_row tree other_settings">
            <h4>Ustawienia usług</h4>
            <ul>
                <li>
                    <Link
                        href="/settings/service-categories"
                        className="active"
                    >
                        <div className="icon_box">
                            <span className="icon sprite-settings_services" />
                        </div>
                        Kategorie usług
                    </Link>
                </li>
                <li>
                    <Link href="/services">
                        <div className="icon_box">
                            <span className="icon sprite-settings_services" />
                        </div>
                        Katalog usług
                    </Link>
                </li>
            </ul>
        </div>
    </div>
);

interface CategoryFormState {
    name: string;
    description: string;
}

const EMPTY_FORM: CategoryFormState = { name: '', description: '' };

/** Add / edit category dialog. */
function CategoryFormModal({
    open,
    editing,
    saving,
    onClose,
    onSubmit,
}: {
    open: boolean;
    editing: ServiceCategory | null;
    saving: boolean;
    onClose: () => void;
    onSubmit: (data: CategoryFormState) => void;
}) {
    const [form, setForm] = useState<CategoryFormState>(EMPTY_FORM);
    const firstFieldRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (open) {
            setForm(
                editing
                    ? {
                          name: editing.name,
                          description: editing.description ?? '',
                      }
                    : EMPTY_FORM,
            );
        }
    }, [open, editing]);

    useEffect(() => {
        if (!open) return;
        firstFieldRef.current?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;

    const canSubmit = form.name.trim().length > 0 && !saving;

    return (
        <div
            className="position-fixed top-0 start-0 bottom-0 end-0 d-flex align-items-center justify-content-center p-3"
            style={{
                zIndex: 2100,
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(4px)',
            }}
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="service-category-modal-title"
                className="bg-white rounded-4 overflow-hidden"
                style={{
                    width: 'min(460px, 100%)',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
                    border: '1px solid rgba(0,0,0,0.08)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        if (canSubmit) onSubmit(form);
                    }}
                >
                    <div className="px-4 pt-4 pb-3">
                        <h6
                            id="service-category-modal-title"
                            className="fw-semibold mb-3"
                        >
                            {editing
                                ? 'Edytuj kategorię'
                                : 'Nowa kategoria usług'}
                        </h6>
                        <div className="mb-3">
                            <label
                                htmlFor="service-category-name"
                                className="form-label small"
                            >
                                Nazwa kategorii
                            </label>
                            <input
                                ref={firstFieldRef}
                                id="service-category-name"
                                type="text"
                                className="form-control"
                                value={form.name}
                                maxLength={100}
                                required
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        name: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="service-category-description"
                                className="form-label small"
                            >
                                Opis (opcjonalnie)
                            </label>
                            <textarea
                                id="service-category-description"
                                className="form-control"
                                rows={2}
                                value={form.description}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        description: e.target.value,
                                    }))
                                }
                            />
                        </div>
                    </div>
                    <div className="px-4 pb-4 d-flex justify-content-end gap-2">
                        <button
                            type="button"
                            className="btn btn-outline-secondary btn-sm"
                            onClick={onClose}
                        >
                            Anuluj
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary btn-sm"
                            disabled={!canSubmit}
                        >
                            {saving
                                ? 'Zapisywanie...'
                                : editing
                                  ? 'Zapisz zmiany'
                                  : 'Dodaj kategorię'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ServiceCategoriesPage() {
    const { role } = useAuth();
    const toast = useToast();
    useSetSecondaryNav(SERVICE_SETTINGS_NAV);

    const { data: categories = [], isLoading } = useServiceCategories();
    const { data: servicesData } = useServices();
    const services = useMemo(() => servicesData ?? [], [servicesData]);
    const createCategory = useCreateServiceCategory();
    const updateCategory = useUpdateServiceCategory();
    const deleteCategory = useDeleteServiceCategory();

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<ServiceCategory | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<ServiceCategory | null>(
        null,
    );

    // Count active-catalogue services per category to surface assignments.
    const countByCategory = useMemo(() => {
        const map = new Map<number, number>();
        for (const s of services) {
            if (s.isActive === false) continue;
            if (s.categoryId != null) {
                map.set(s.categoryId, (map.get(s.categoryId) ?? 0) + 1);
            }
        }
        return map;
    }, [services]);

    const sorted = useMemo(
        () =>
            [...categories].sort(
                (a, b) =>
                    (a.sortOrder ?? 0) - (b.sortOrder ?? 0) ||
                    a.name.localeCompare(b.name),
            ),
        [categories],
    );

    const openAdd = () => {
        setEditing(null);
        setModalOpen(true);
    };
    const openEdit = (category: ServiceCategory) => {
        setEditing(category);
        setModalOpen(true);
    };

    const handleSubmit = (data: CategoryFormState) => {
        const payload = {
            name: data.name.trim(),
            description: data.description.trim() || undefined,
        };
        if (editing) {
            updateCategory.mutate(
                { id: editing.id, data: payload },
                {
                    onSuccess: () => {
                        toast.success('Kategoria zapisana');
                        setModalOpen(false);
                    },
                },
            );
        } else {
            createCategory.mutate(payload, {
                onSuccess: () => {
                    toast.success('Kategoria dodana');
                    setModalOpen(false);
                },
            });
        }
    };

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <Head>
                <title>Kategorie usług — Salon Black &amp; White</title>
            </Head>
            <SalonShell role={role}>
                <div
                    className="settings-detail-layout"
                    data-testid="settings-detail"
                >
                    <aside className="settings-detail-layout__sidebar">
                        {SERVICE_SETTINGS_NAV}
                    </aside>
                    <div className="settings-detail-layout__main">
                        <SalonBreadcrumbs
                            iconClass="sprite-breadcrumbs_settings"
                            items={[
                                { label: 'Ustawienia', href: '/settings' },
                                { label: 'Kategorie usług' },
                            ]}
                        />
                        <PanelSection title="Kategorie usług">
                            <p className="text-muted" style={{ marginTop: -4 }}>
                                Kategorie grupują usługi w panelu rezerwacji, w
                                katalogu na stronie i na liście usług. Usługi
                                przypisujesz do kategorii w edycji usługi.
                            </p>
                            <div className="actions mb-2">
                                <Link
                                    href="/services"
                                    className="btn btn-outline-secondary"
                                    style={{ marginRight: 8 }}
                                >
                                    katalog usług
                                </Link>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={openAdd}
                                >
                                    + dodaj kategorię
                                </button>
                            </div>
                            {isLoading ? (
                                <p>Ładowanie...</p>
                            ) : (
                                <table className="table table-striped table-bordered">
                                    <thead>
                                        <tr>
                                            <th scope="col">Nazwa</th>
                                            <th
                                                scope="col"
                                                style={{ width: 120 }}
                                            >
                                                Liczba usług
                                            </th>
                                            <th
                                                scope="col"
                                                style={{ width: 180 }}
                                            >
                                                Akcje
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sorted.length === 0 ? (
                                            <tr>
                                                <td colSpan={3}>
                                                    Brak kategorii. Dodaj
                                                    pierwszą, aby pogrupować
                                                    usługi.
                                                </td>
                                            </tr>
                                        ) : (
                                            sorted.map((category) => (
                                                <tr key={category.id}>
                                                    <td>{category.name}</td>
                                                    <td>
                                                        {countByCategory.get(
                                                            category.id,
                                                        ) ?? 0}
                                                    </td>
                                                    <td
                                                        className="actions"
                                                        style={{
                                                            textAlign: 'right',
                                                        }}
                                                    >
                                                        <span className="btn-group">
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-secondary"
                                                                onClick={() =>
                                                                    openEdit(
                                                                        category,
                                                                    )
                                                                }
                                                            >
                                                                edytuj
                                                            </button>
                                                            <button
                                                                type="button"
                                                                className="btn btn-sm btn-outline-secondary"
                                                                disabled={
                                                                    deleteCategory.isPending
                                                                }
                                                                onClick={() =>
                                                                    setConfirmDelete(
                                                                        category,
                                                                    )
                                                                }
                                                            >
                                                                usuń
                                                            </button>
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </PanelSection>
                    </div>
                </div>

                <CategoryFormModal
                    open={modalOpen}
                    editing={editing}
                    saving={
                        createCategory.isPending || updateCategory.isPending
                    }
                    onClose={() => setModalOpen(false)}
                    onSubmit={handleSubmit}
                />

                <ConfirmModal
                    open={!!confirmDelete}
                    title="Usuń kategorię"
                    message={
                        confirmDelete
                            ? `Czy na pewno usunąć kategorię "${confirmDelete.name}"? Przypisane usługi pozostaną, ale stracą kategorię.`
                            : ''
                    }
                    confirmLabel="Usuń"
                    confirmVariant="danger"
                    onConfirm={() => {
                        if (!confirmDelete) return;
                        const id = confirmDelete.id;
                        setConfirmDelete(null);
                        deleteCategory.mutate(id, {
                            onSuccess: () =>
                                toast.success('Kategoria usunięta'),
                        });
                    }}
                    onCancel={() => setConfirmDelete(null)}
                />
            </SalonShell>
        </RouteGuard>
    );
}

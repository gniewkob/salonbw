import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import CustomerGroupsListPage from '@/components/settings/CustomerGroupsListPage';
import PanelSection from '@/components/ui/PanelSection';
import PanelTable from '@/components/ui/PanelTable';
import { useAuth } from '@/contexts/AuthContext';
import type { CustomerExtraField, ExtraFieldType } from '@/types';
import {
    useCustomerOrigins,
    useCreateCustomerOrigin,
    useUpdateCustomerOrigin,
    useDeleteCustomerOrigin,
    useCustomerExtraFields,
    useCreateCustomerExtraField,
    useUpdateCustomerExtraField,
    useDeleteCustomerExtraField,
} from '@/hooks/useCustomers';

type Tab = 'groups' | 'extra-fields' | 'origins';

// --- extra-fields helpers ---

const TYPE_LABELS: Record<ExtraFieldType, string> = {
    text: 'Tekst',
    number: 'Liczba',
    date: 'Data',
    checkbox: 'Pole wyboru',
    select: 'Lista',
};

const TYPE_OPTIONS: ExtraFieldType[] = [
    'text',
    'number',
    'date',
    'checkbox',
    'select',
];

function parseOptions(value: string) {
    return value
        .split('\n')
        .map((o) => o.trim())
        .filter(Boolean);
}

function formatOptions(options?: string[] | null) {
    return (options ?? []).join('\n');
}

interface AddFormState {
    label: string;
    type: ExtraFieldType;
    required: boolean;
    optionsText: string;
}

interface EditFormState {
    id: number;
    label: string;
    type: ExtraFieldType;
    required: boolean;
    optionsText: string;
}

function needsOptions(type: ExtraFieldType) {
    return type === 'select';
}

function toMutationPayload(form: {
    label: string;
    type: ExtraFieldType;
    required: boolean;
    optionsText: string;
}) {
    return {
        label: form.label.trim(),
        type: form.type,
        required: form.required,
        ...(needsOptions(form.type)
            ? { options: parseOptions(form.optionsText) }
            : {}),
    };
}

// --- ExtraFieldsTab ---

function ExtraFieldsTab() {
    const { data: fields, isLoading, isError } = useCustomerExtraFields();
    const createField = useCreateCustomerExtraField();
    const updateField = useUpdateCustomerExtraField();
    const deleteField = useDeleteCustomerExtraField();

    const [isAdding, setIsAdding] = useState(false);
    const [addForm, setAddForm] = useState<AddFormState>({
        label: '',
        type: 'text',
        required: false,
        optionsText: '',
    });
    const [editForm, setEditForm] = useState<EditFormState | null>(null);

    const handleAdd = () => {
        if (!addForm.label.trim()) return;
        if (
            needsOptions(addForm.type) &&
            parseOptions(addForm.optionsText).length === 0
        )
            return;
        createField.mutate(toMutationPayload(addForm), {
            onSuccess: () => {
                setIsAdding(false);
                setAddForm({
                    label: '',
                    type: 'text',
                    required: false,
                    optionsText: '',
                });
            },
        });
    };

    const handleEditSave = () => {
        if (!editForm || !editForm.label.trim()) return;
        if (
            needsOptions(editForm.type) &&
            parseOptions(editForm.optionsText).length === 0
        )
            return;
        updateField.mutate(
            { id: editForm.id, data: toMutationPayload(editForm) },
            { onSuccess: () => setEditForm(null) },
        );
    };

    const openEditForm = (field: CustomerExtraField) => {
        setEditForm({
            id: field.id,
            label: field.label,
            type: field.type,
            required: field.required,
            optionsText: formatOptions(field.options),
        });
    };

    return (
        <PanelSection
            action={
                <button
                    type="button"
                    className="btn btn-primary float-end"
                    onClick={() => setIsAdding(true)}
                >
                    + dodaj pole
                </button>
            }
        >
            <div className="extra-fields-description">
                <div className="description">
                    <p>
                        System umożliwia dostosowanie karty klienta do
                        indywidualnych potrzeb salonu.
                        <br />
                        Istnieje możliwość dodania własnych pól.
                    </p>
                </div>
            </div>

            {isAdding && (
                <div className="card extra-fields-add-panel">
                    <div className="card-body">
                        <div className="d-flex flex-wrap gap-2 align-items-center extra-fields-add-form">
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Etykieta pola"
                                title="Etykieta pola"
                                value={addForm.label}
                                onChange={(e) =>
                                    setAddForm((f) => ({
                                        ...f,
                                        label: e.target.value,
                                    }))
                                }
                                // eslint-disable-next-line jsx-a11y/no-autofocus
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAdd();
                                    if (e.key === 'Escape') setIsAdding(false);
                                }}
                            />
                            <select
                                className="form-control"
                                title="Typ pola"
                                aria-label="Typ pola"
                                value={addForm.type}
                                onChange={(e) =>
                                    setAddForm((f) => ({
                                        ...f,
                                        type: e.target.value as ExtraFieldType,
                                    }))
                                }
                            >
                                {TYPE_OPTIONS.map((t) => (
                                    <option key={t} value={t}>
                                        {TYPE_LABELS[t]}
                                    </option>
                                ))}
                            </select>
                            {needsOptions(addForm.type) && (
                                <textarea
                                    className="form-control"
                                    placeholder="Jedna opcja w linii"
                                    title="Opcje listy"
                                    value={addForm.optionsText}
                                    onChange={(e) =>
                                        setAddForm((f) => ({
                                            ...f,
                                            optionsText: e.target.value,
                                        }))
                                    }
                                    rows={4}
                                />
                            )}
                            <label className="checkbox-inline">
                                <input
                                    type="checkbox"
                                    checked={addForm.required}
                                    onChange={(e) =>
                                        setAddForm((f) => ({
                                            ...f,
                                            required: e.target.checked,
                                        }))
                                    }
                                />{' '}
                                Wymagane
                            </label>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleAdd}
                                disabled={
                                    createField.isPending ||
                                    (needsOptions(addForm.type) &&
                                        parseOptions(addForm.optionsText)
                                            .length === 0)
                                }
                            >
                                Zapisz
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => setIsAdding(false)}
                            >
                                Anuluj
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isLoading && <p>Ładowanie...</p>}
            {isError && (
                <div className="alert alert-danger" role="alert">
                    Nie udało się załadować pól.
                </div>
            )}

            {!isLoading && !isError && (fields ?? []).length > 0 && (
                <PanelTable
                    className="extra-fields-table"
                    columns={[
                        { label: 'Etykieta' },
                        { label: 'Typ' },
                        { label: 'Opcje' },
                        { label: 'Wymagane' },
                        { ariaLabel: 'Akcje' },
                    ]}
                >
                    {(fields ?? []).map((field, i) => (
                        <tr
                            key={field.id}
                            className={i % 2 === 0 ? 'even' : 'odd'}
                        >
                            {editForm?.id === field.id ? (
                                <>
                                    <td>
                                        <input
                                            type="text"
                                            className="form-control input-sm"
                                            value={editForm.label}
                                            title="Etykieta pola"
                                            onChange={(e) =>
                                                setEditForm((f) =>
                                                    f
                                                        ? {
                                                              ...f,
                                                              label: e.target
                                                                  .value,
                                                          }
                                                        : f,
                                                )
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter')
                                                    handleEditSave();
                                                if (e.key === 'Escape')
                                                    setEditForm(null);
                                            }}
                                            // eslint-disable-next-line jsx-a11y/no-autofocus
                                            autoFocus
                                        />
                                    </td>
                                    <td>
                                        <select
                                            className="form-control input-sm"
                                            title="Typ pola"
                                            aria-label="Typ pola"
                                            value={editForm.type}
                                            onChange={(e) =>
                                                setEditForm((f) =>
                                                    f
                                                        ? {
                                                              ...f,
                                                              type: e.target
                                                                  .value as ExtraFieldType,
                                                          }
                                                        : f,
                                                )
                                            }
                                        >
                                            {TYPE_OPTIONS.map((t) => (
                                                <option key={t} value={t}>
                                                    {TYPE_LABELS[t]}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>
                                        {needsOptions(editForm.type) ? (
                                            <textarea
                                                className="form-control input-sm"
                                                title="Opcje listy"
                                                value={editForm.optionsText}
                                                onChange={(e) =>
                                                    setEditForm((f) =>
                                                        f
                                                            ? {
                                                                  ...f,
                                                                  optionsText:
                                                                      e.target
                                                                          .value,
                                                              }
                                                            : f,
                                                    )
                                                }
                                                rows={4}
                                            />
                                        ) : (
                                            <span className="text-muted">
                                                -
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <input
                                            type="checkbox"
                                            title="Wymagane"
                                            checked={editForm.required}
                                            onChange={(e) =>
                                                setEditForm((f) =>
                                                    f
                                                        ? {
                                                              ...f,
                                                              required:
                                                                  e.target
                                                                      .checked,
                                                          }
                                                        : f,
                                                )
                                            }
                                        />
                                    </td>
                                    <td className="col-actions">
                                        <span className="btn-group">
                                            <button
                                                type="button"
                                                className="btn btn-primary btn-sm"
                                                onClick={handleEditSave}
                                                disabled={
                                                    updateField.isPending ||
                                                    (needsOptions(
                                                        editForm.type,
                                                    ) &&
                                                        parseOptions(
                                                            editForm.optionsText,
                                                        ).length === 0)
                                                }
                                            >
                                                zapisz
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={() =>
                                                    setEditForm(null)
                                                }
                                            >
                                                anuluj
                                            </button>
                                        </span>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td>{field.label}</td>
                                    <td>{TYPE_LABELS[field.type]}</td>
                                    <td>
                                        {field.type === 'select'
                                            ? (field.options ?? []).join(
                                                  ', ',
                                              ) || '-'
                                            : '-'}
                                    </td>
                                    <td>{field.required ? 'Tak' : 'Nie'}</td>
                                    <td className="col-actions">
                                        <span className="btn-group">
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={() =>
                                                    openEditForm(field)
                                                }
                                            >
                                                edytuj
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={() =>
                                                    deleteField.mutate(field.id)
                                                }
                                                disabled={deleteField.isPending}
                                            >
                                                usuń
                                            </button>
                                        </span>
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}
                </PanelTable>
            )}
            {deleteField.isError && (
                <div className="text-danger small mt-2">
                    Nie udało się usunąć pola. Spróbuj ponownie.
                </div>
            )}
        </PanelSection>
    );
}

// --- OriginsTab ---

function OriginsTab() {
    const { data: origins, isLoading, isError } = useCustomerOrigins();
    const createOrigin = useCreateCustomerOrigin();
    const updateOrigin = useUpdateCustomerOrigin();
    const deleteOrigin = useDeleteCustomerOrigin();

    const [addingName, setAddingName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingName, setEditingName] = useState('');

    const systemOrigins = (origins ?? []).filter((o) => o.isSystem);
    const customOrigins = (origins ?? []).filter((o) => !o.isSystem);

    const handleAdd = () => {
        const name = addingName.trim();
        if (!name) return;
        createOrigin.mutate(name, {
            onSuccess: () => {
                setAddingName('');
                setIsAdding(false);
            },
        });
    };

    const handleEditSave = (id: number) => {
        const name = editingName.trim();
        if (!name) return;
        updateOrigin.mutate(
            { id, name },
            { onSuccess: () => setEditingId(null) },
        );
    };

    return (
        <PanelSection
            action={
                <button
                    type="button"
                    className="btn btn-primary float-end"
                    onClick={() => setIsAdding(true)}
                >
                    + Dodaj nowe źródło
                </button>
            }
        >
            {isAdding && (
                <div className="mb-3">
                    <label className="form-label" htmlFor="origin-name">
                        Nazwa źródła
                    </label>
                    <div className="input-group">
                        <input
                            id="origin-name"
                            type="text"
                            className="form-control"
                            value={addingName}
                            onChange={(e) => setAddingName(e.target.value)}
                            placeholder="np. Instagram"
                            title="Nazwa nowego źródła"
                            // eslint-disable-next-line jsx-a11y/no-autofocus
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAdd();
                                if (e.key === 'Escape') {
                                    setIsAdding(false);
                                    setAddingName('');
                                }
                            }}
                        />
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleAdd}
                            disabled={createOrigin.isPending}
                        >
                            Zapisz
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => {
                                setIsAdding(false);
                                setAddingName('');
                            }}
                        >
                            Anuluj
                        </button>
                    </div>
                </div>
            )}

            {isLoading && <p>Ładowanie...</p>}
            {isError && (
                <div className="alert alert-danger" role="alert">
                    Nie udało się załadować źródeł.
                </div>
            )}

            {!isLoading && !isError && (
                <>
                    <div className="column_row">
                        <h2>Zdefiniowane przez salon</h2>
                        {customOrigins.length === 0 ? (
                            <h3>
                                W salonie nie zdefiniowano żadnych źródeł
                                pochodzenia klienta.
                            </h3>
                        ) : (
                            <PanelTable
                                columns={[
                                    { label: 'Nazwa' },
                                    { ariaLabel: 'Akcje' },
                                ]}
                            >
                                {customOrigins.map((origin, i) => (
                                    <tr
                                        key={origin.id}
                                        className={i % 2 === 0 ? 'even' : 'odd'}
                                    >
                                        <td>
                                            {editingId === origin.id ? (
                                                <input
                                                    type="text"
                                                    className="form-control input-sm"
                                                    value={editingName}
                                                    title="Edytuj nazwę źródła"
                                                    onChange={(e) =>
                                                        setEditingName(
                                                            e.target.value,
                                                        )
                                                    }
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter')
                                                            handleEditSave(
                                                                origin.id,
                                                            );
                                                        if (e.key === 'Escape')
                                                            setEditingId(null);
                                                    }}
                                                    // eslint-disable-next-line jsx-a11y/no-autofocus
                                                    autoFocus
                                                />
                                            ) : (
                                                origin.name
                                            )}
                                        </td>
                                        <td className="col-actions">
                                            {editingId === origin.id ? (
                                                <span className="btn-group">
                                                    <button
                                                        type="button"
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() =>
                                                            handleEditSave(
                                                                origin.id,
                                                            )
                                                        }
                                                        disabled={
                                                            updateOrigin.isPending
                                                        }
                                                    >
                                                        zapisz
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-secondary"
                                                        onClick={() =>
                                                            setEditingId(null)
                                                        }
                                                    >
                                                        anuluj
                                                    </button>
                                                </span>
                                            ) : (
                                                <span className="btn-group">
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-secondary"
                                                        onClick={() => {
                                                            setEditingId(
                                                                origin.id,
                                                            );
                                                            setEditingName(
                                                                origin.name,
                                                            );
                                                        }}
                                                    >
                                                        edytuj
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-secondary"
                                                        onClick={() =>
                                                            deleteOrigin.mutate(
                                                                origin.id,
                                                            )
                                                        }
                                                        disabled={
                                                            deleteOrigin.isPending
                                                        }
                                                    >
                                                        usuń
                                                    </button>
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </PanelTable>
                        )}
                        {deleteOrigin.isError && (
                            <div className="text-danger small mt-2">
                                Nie udało się usunąć źródła. Spróbuj ponownie.
                            </div>
                        )}
                    </div>

                    <div className="column_row">
                        <h2>Zdefiniowane w systemie</h2>
                        <PanelTable columns={[{ label: 'Nazwa' }]}>
                            {systemOrigins.map((origin, i) => (
                                <tr
                                    key={origin.id}
                                    className={i % 2 === 0 ? 'odd' : 'even'}
                                >
                                    <td>{origin.name}</td>
                                </tr>
                            ))}
                        </PanelTable>
                    </div>
                </>
            )}
        </PanelSection>
    );
}

// --- Page ---

export default function SettingsCustomersPage() {
    const router = useRouter();
    const { role } = useAuth();
    const tab: Tab = (router.query.tab as Tab) ?? 'groups';

    useSetSecondaryNav(null);

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <Head>
                <title>Ustawienia klientów — Salon Black &amp; White</title>
            </Head>
            <SalonShell role={role}>
                <div
                    className="settings-detail-layout"
                    data-testid="settings-detail"
                >
                    <div
                        className="settings-detail-layout__main"
                        style={{ gridColumn: '1 / -1' }}
                    >
                        <SalonBreadcrumbs
                            iconClass="sprite-breadcrumbs_settings"
                            items={[
                                { label: 'Ustawienia', href: '/settings' },
                                { label: 'Klienci' },
                            ]}
                        />

                        <ul className="nav nav-tabs mb-3">
                            <li className="nav-item">
                                <Link
                                    href="/settings/customers"
                                    className={`nav-link${tab === 'groups' ? ' active' : ''}`}
                                >
                                    Grupy klientów
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link
                                    href="/settings/customers?tab=extra-fields"
                                    className={`nav-link${tab === 'extra-fields' ? ' active' : ''}`}
                                >
                                    Pola dodatkowe
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link
                                    href="/settings/customers?tab=origins"
                                    className={`nav-link${tab === 'origins' ? ' active' : ''}`}
                                >
                                    Pochodzenie
                                </Link>
                            </li>
                        </ul>

                        {tab === 'groups' && <CustomerGroupsListPage />}
                        {tab === 'extra-fields' && <ExtraFieldsTab />}
                        {tab === 'origins' && <OriginsTab />}
                    </div>
                </div>
            </SalonShell>
        </RouteGuard>
    );
}

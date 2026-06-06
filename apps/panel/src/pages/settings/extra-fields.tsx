import { useLayoutEffect, useState } from 'react';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import CustomerSettingsNav from '@/components/settings/CustomerSettingsNav';
import {
    useCustomerExtraFields,
    useCreateCustomerExtraField,
    useUpdateCustomerExtraField,
    useDeleteCustomerExtraField,
} from '@/hooks/useCustomers';
import type { CustomerExtraField, ExtraFieldType } from '@/types';

const CUSTOMER_SETTINGS_NAV = <CustomerSettingsNav />;

const FIELD_TYPE_LABELS: Record<ExtraFieldType, string> = {
    text: 'Tekst',
    number: 'Liczba',
    date: 'Data',
    checkbox: 'Pole wyboru',
    select: 'Lista wyboru',
};

interface FieldFormState {
    label: string;
    type: ExtraFieldType;
    required: boolean;
    options: string;
}

const EMPTY_FORM: FieldFormState = {
    label: '',
    type: 'text',
    required: false,
    options: '',
};

function parseOptions(raw: string): string[] {
    return raw
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);
}

export default function ExtraFieldsPage() {
    const { role } = useAuth();
    const {
        data: fields = [],
        isLoading,
        error,
        refetch,
    } = useCustomerExtraFields();
    const create = useCreateCustomerExtraField();
    const update = useUpdateCustomerExtraField();
    const del = useDeleteCustomerExtraField();

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<FieldFormState>(EMPTY_FORM);
    const [editingField, setEditingField] = useState<CustomerExtraField | null>(
        null,
    );
    const [editForm, setEditForm] = useState<FieldFormState>(EMPTY_FORM);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useLayoutEffect(() => {
        // no-op — secondary nav set before any early return
    }, []);
    useSetSecondaryNav(CUSTOMER_SETTINGS_NAV);

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);
        const payload = {
            label: form.label.trim(),
            type: form.type,
            required: form.required,
            ...(form.type === 'select'
                ? { options: parseOptions(form.options) }
                : {}),
        };
        void create
            .mutateAsync(payload)
            .then(() => {
                setForm(EMPTY_FORM);
                setShowForm(false);
            })
            .catch(() => setSubmitError('Nie udało się dodać pola.'));
    };

    const beginEdit = (field: CustomerExtraField) => {
        setEditingField(field);
        setEditForm({
            label: field.label,
            type: field.type,
            required: field.required,
            options: field.options?.join('\n') ?? '',
        });
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingField) return;
        const payload = {
            label: editForm.label.trim(),
            type: editForm.type,
            required: editForm.required,
            ...(editForm.type === 'select'
                ? { options: parseOptions(editForm.options) }
                : {}),
        };
        void update
            .mutateAsync({ id: editingField.id, data: payload })
            .then(() => setEditingField(null));
    };

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <SalonShell role={role}>
                <div className="salonbw-page" data-testid="extra-fields-page">
                    <SalonBreadcrumbs
                        iconClass="sprite-breadcrumbs_settings"
                        items={[
                            { label: 'Ustawienia', href: '/settings' },
                            { label: 'Pola klientów' },
                        ]}
                    />

                    <div className="salonbw-page__toolbar mb-4">
                        <div />
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => {
                                setForm(EMPTY_FORM);
                                setShowForm(true);
                            }}
                        >
                            + Dodaj pole
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="text-muted p-3">Ładowanie...</div>
                    ) : error ? (
                        <div className="d-flex flex-column gap-2 p-3">
                            <div className="text-danger">
                                Nie udało się pobrać pól klientów.
                            </div>
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => void refetch()}
                            >
                                Odśwież
                            </button>
                        </div>
                    ) : (
                        <div className="salonbw-table-wrap">
                            <table className="salonbw-table">
                                <thead>
                                    <tr>
                                        <th>Nazwa pola</th>
                                        <th>Typ</th>
                                        <th>Wymagane</th>
                                        <th>Opcje (dla lista wyboru)</th>
                                        <th />
                                    </tr>
                                </thead>
                                <tbody>
                                    {fields.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="text-muted text-center py-4"
                                            >
                                                Brak dodatkowych pól klientów.
                                                Kliknij &ldquo;+ Dodaj
                                                pole&rdquo; aby dodać pierwsze.
                                            </td>
                                        </tr>
                                    ) : (
                                        fields.map((field) => (
                                            <tr key={field.id}>
                                                <td className="fw-medium">
                                                    {field.label}
                                                </td>
                                                <td>
                                                    {
                                                        FIELD_TYPE_LABELS[
                                                            field.type
                                                        ]
                                                    }
                                                </td>
                                                <td>
                                                    {field.required ? (
                                                        <span className="badge bg-primary">
                                                            Tak
                                                        </span>
                                                    ) : (
                                                        <span className="badge bg-secondary">
                                                            Nie
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    {field.type === 'select' &&
                                                    field.options
                                                        ? field.options.join(
                                                              ', ',
                                                          )
                                                        : '—'}
                                                </td>
                                                <td className="text-end">
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-secondary me-1"
                                                        onClick={() =>
                                                            beginEdit(field)
                                                        }
                                                    >
                                                        Edytuj
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => {
                                                            if (
                                                                window.confirm(
                                                                    `Usunąć pole "${field.label}"?`,
                                                                )
                                                            ) {
                                                                void del.mutateAsync(
                                                                    field.id,
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        Usuń
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Add field modal */}
                    {showForm && (
                        <div
                            className="modal d-block"
                            style={{ background: 'rgba(0,0,0,.5)' }}
                        >
                            <div className="modal-dialog">
                                <form
                                    className="modal-content"
                                    onSubmit={handleCreate}
                                >
                                    <div className="modal-header">
                                        <h5 className="modal-title">
                                            Dodaj pole klienta
                                        </h5>
                                        <button
                                            type="button"
                                            className="btn-close"
                                            onClick={() => setShowForm(false)}
                                        />
                                    </div>
                                    <div className="modal-body">
                                        <FieldFormFields
                                            form={form}
                                            onChange={setForm}
                                        />
                                        {submitError && (
                                            <div className="alert alert-danger mt-2">
                                                {submitError}
                                            </div>
                                        )}
                                    </div>
                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() => setShowForm(false)}
                                        >
                                            Anuluj
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={
                                                create.isPending ||
                                                !form.label.trim()
                                            }
                                        >
                                            {create.isPending
                                                ? 'Dodawanie...'
                                                : 'Dodaj pole'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Edit field modal */}
                    {editingField && (
                        <div
                            className="modal d-block"
                            style={{ background: 'rgba(0,0,0,.5)' }}
                        >
                            <div className="modal-dialog">
                                <form
                                    className="modal-content"
                                    onSubmit={handleUpdate}
                                >
                                    <div className="modal-header">
                                        <h5 className="modal-title">
                                            Edytuj pole klienta
                                        </h5>
                                        <button
                                            type="button"
                                            className="btn-close"
                                            onClick={() =>
                                                setEditingField(null)
                                            }
                                        />
                                    </div>
                                    <div className="modal-body">
                                        <FieldFormFields
                                            form={editForm}
                                            onChange={setEditForm}
                                        />
                                    </div>
                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() =>
                                                setEditingField(null)
                                            }
                                        >
                                            Anuluj
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={
                                                update.isPending ||
                                                !editForm.label.trim()
                                            }
                                        >
                                            {update.isPending
                                                ? 'Zapisywanie...'
                                                : 'Zapisz'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </SalonShell>
        </RouteGuard>
    );
}

function FieldFormFields({
    form,
    onChange,
}: {
    form: FieldFormState;
    onChange: (f: FieldFormState) => void;
}) {
    return (
        <>
            <div className="mb-3">
                <label className="form-label" htmlFor="extra-field-label">
                    Nazwa pola <span className="text-danger">*</span>
                </label>
                <input
                    id="extra-field-label"
                    className="form-control"
                    value={form.label}
                    onChange={(e) =>
                        onChange({ ...form, label: e.target.value })
                    }
                    required
                />
            </div>
            <div className="mb-3">
                <label className="form-label" htmlFor="extra-field-type">
                    Typ pola
                </label>
                <select
                    id="extra-field-type"
                    className="form-control"
                    value={form.type}
                    onChange={(e) =>
                        onChange({
                            ...form,
                            type: e.target.value as ExtraFieldType,
                        })
                    }
                >
                    {(Object.keys(FIELD_TYPE_LABELS) as ExtraFieldType[]).map(
                        (t) => (
                            <option key={t} value={t}>
                                {FIELD_TYPE_LABELS[t]}
                            </option>
                        ),
                    )}
                </select>
            </div>
            {form.type === 'select' && (
                <div className="mb-3">
                    <label className="form-label" htmlFor="extra-field-options">
                        Opcje (jedna na linię)
                    </label>
                    <textarea
                        id="extra-field-options"
                        className="form-control"
                        rows={4}
                        value={form.options}
                        onChange={(e) =>
                            onChange({ ...form, options: e.target.value })
                        }
                        placeholder="Opcja 1&#10;Opcja 2&#10;Opcja 3"
                    />
                </div>
            )}
            <div className="form-check">
                <input
                    id="extra-field-required"
                    className="form-check-input"
                    type="checkbox"
                    checked={form.required}
                    onChange={(e) =>
                        onChange({ ...form, required: e.target.checked })
                    }
                />
                <label
                    className="form-check-label"
                    htmlFor="extra-field-required"
                >
                    Pole wymagane
                </label>
            </div>
        </>
    );
}

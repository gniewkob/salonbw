import Link from 'next/link';
import { useState } from 'react';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import CustomerSettingsNav from '@/components/settings/CustomerSettingsNav';
import type { ExtraFieldType } from '@/types';
import {
    useCustomerExtraFields,
    useCreateCustomerExtraField,
    useUpdateCustomerExtraField,
    useDeleteCustomerExtraField,
} from '@/hooks/useCustomers';

const NAV = <CustomerSettingsNav />;

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

interface AddFormState {
    label: string;
    type: ExtraFieldType;
    required: boolean;
}

interface EditFormState {
    id: number;
    label: string;
    type: ExtraFieldType;
    required: boolean;
}

export default function SettingsExtraFieldsPage() {
    useSetSecondaryNav(NAV);

    const { data: fields, isLoading, isError } = useCustomerExtraFields();
    const createField = useCreateCustomerExtraField();
    const updateField = useUpdateCustomerExtraField();
    const deleteField = useDeleteCustomerExtraField();

    const [isAdding, setIsAdding] = useState(false);
    const [addForm, setAddForm] = useState<AddFormState>({
        label: '',
        type: 'text',
        required: false,
    });
    const [editForm, setEditForm] = useState<EditFormState | null>(null);

    const handleAdd = () => {
        if (!addForm.label.trim()) return;
        createField.mutate(
            {
                label: addForm.label.trim(),
                type: addForm.type,
                required: addForm.required,
            },
            {
                onSuccess: () => {
                    setIsAdding(false);
                    setAddForm({ label: '', type: 'text', required: false });
                },
            },
        );
    };

    const handleEditSave = () => {
        if (!editForm || !editForm.label.trim()) return;
        updateField.mutate(
            {
                id: editForm.id,
                data: {
                    label: editForm.label.trim(),
                    type: editForm.type,
                    required: editForm.required,
                },
            },
            { onSuccess: () => setEditForm(null) },
        );
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
                            Klienci
                        </li>
                        <li>
                            <span> / </span>
                            Dodatkowe pola
                        </li>
                    </ul>
                </div>

                <div className="inner edit_branch_form">
                    <div className="actions">
                        <button
                            type="button"
                            className="btn button-blue pull-right"
                            onClick={() => setIsAdding(true)}
                        >
                            + dodaj pole
                        </button>
                    </div>

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
                        <div className="panel panel-default extra-fields-add-panel">
                            <div className="panel-body">
                                <div className="form-inline extra-fields-add-form">
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
                                            if (e.key === 'Escape')
                                                setIsAdding(false);
                                        }}
                                    />
                                    <select
                                        className="form-control"
                                        title="Typ pola"
                                        value={addForm.type}
                                        onChange={(e) =>
                                            setAddForm((f) => ({
                                                ...f,
                                                type: e.target
                                                    .value as ExtraFieldType,
                                            }))
                                        }
                                    >
                                        {TYPE_OPTIONS.map((t) => (
                                            <option key={t} value={t}>
                                                {TYPE_LABELS[t]}
                                            </option>
                                        ))}
                                    </select>
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
                                        className="btn button-blue"
                                        onClick={handleAdd}
                                        disabled={createField.isPending}
                                    >
                                        Zapisz
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-default"
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
                        <div className="alert alert-danger">
                            Nie udało się załadować pól.
                        </div>
                    )}

                    {!isLoading && !isError && (fields ?? []).length > 0 && (
                        <table className="table table-bordered extra-fields-table">
                            <thead>
                                <tr>
                                    <th>
                                        <div>Etykieta</div>
                                    </th>
                                    <th>
                                        <div>Typ</div>
                                    </th>
                                    <th>
                                        <div>Wymagane</div>
                                    </th>
                                    <th scope="col" aria-label="Akcje" />
                                </tr>
                            </thead>
                            <tbody>
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
                                                                          label: e
                                                                              .target
                                                                              .value,
                                                                      }
                                                                    : f,
                                                            )
                                                        }
                                                        onKeyDown={(e) => {
                                                            if (
                                                                e.key ===
                                                                'Enter'
                                                            )
                                                                handleEditSave();
                                                            if (
                                                                e.key ===
                                                                'Escape'
                                                            )
                                                                setEditForm(
                                                                    null,
                                                                );
                                                        }}
                                                        // eslint-disable-next-line jsx-a11y/no-autofocus
                                                        autoFocus
                                                    />
                                                </td>
                                                <td>
                                                    <select
                                                        className="form-control input-sm"
                                                        title="Typ pola"
                                                        value={editForm.type}
                                                        onChange={(e) =>
                                                            setEditForm((f) =>
                                                                f
                                                                    ? {
                                                                          ...f,
                                                                          type: e
                                                                              .target
                                                                              .value as ExtraFieldType,
                                                                      }
                                                                    : f,
                                                            )
                                                        }
                                                    >
                                                        {TYPE_OPTIONS.map(
                                                            (t) => (
                                                                <option
                                                                    key={t}
                                                                    value={t}
                                                                >
                                                                    {
                                                                        TYPE_LABELS[
                                                                            t
                                                                        ]
                                                                    }
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                </td>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        title="Wymagane"
                                                        checked={
                                                            editForm.required
                                                        }
                                                        onChange={(e) =>
                                                            setEditForm((f) =>
                                                                f
                                                                    ? {
                                                                          ...f,
                                                                          required:
                                                                              e
                                                                                  .target
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
                                                            className="btn btn-xs button-blue"
                                                            onClick={
                                                                handleEditSave
                                                            }
                                                            disabled={
                                                                updateField.isPending
                                                            }
                                                        >
                                                            zapisz
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-xs btn-default"
                                                            onClick={() =>
                                                                setEditForm(
                                                                    null,
                                                                )
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
                                                <td>
                                                    {TYPE_LABELS[field.type]}
                                                </td>
                                                <td>
                                                    {field.required
                                                        ? 'Tak'
                                                        : 'Nie'}
                                                </td>
                                                <td className="col-actions">
                                                    <span className="btn-group">
                                                        <button
                                                            type="button"
                                                            className="btn btn-xs btn-default"
                                                            onClick={() =>
                                                                setEditForm({
                                                                    id: field.id,
                                                                    label: field.label,
                                                                    type: field.type,
                                                                    required:
                                                                        field.required,
                                                                })
                                                            }
                                                        >
                                                            edytuj
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn btn-xs btn-default"
                                                            onClick={() =>
                                                                deleteField.mutate(
                                                                    field.id,
                                                                )
                                                            }
                                                            disabled={
                                                                deleteField.isPending
                                                            }
                                                        >
                                                            usuń
                                                        </button>
                                                    </span>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

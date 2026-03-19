import Link from 'next/link';
import { useState } from 'react';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import CustomerSettingsNav from '@/components/settings/CustomerSettingsNav';
import PanelSection from '@/components/ui/PanelSection';
import PanelTable from '@/components/ui/PanelTable';
import type { CustomerExtraField, ExtraFieldType } from '@/types';
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

function parseOptions(value: string) {
    return value
        .split('\n')
        .map((option) => option.trim())
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
        optionsText: '',
    });
    const [editForm, setEditForm] = useState<EditFormState | null>(null);

    const handleAdd = () => {
        if (!addForm.label.trim()) return;
        if (
            needsOptions(addForm.type) &&
            parseOptions(addForm.optionsText).length === 0
        ) {
            return;
        }
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
        ) {
            return;
        }
        updateField.mutate(
            {
                id: editForm.id,
                data: toMutationPayload(editForm),
            },
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

                <PanelSection
                    action={
                        <button
                            type="button"
                            className="btn button-blue pull-right"
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
                                        className="btn button-blue"
                                        onClick={handleAdd}
                                        disabled={
                                            createField.isPending ||
                                            (needsOptions(addForm.type) &&
                                                parseOptions(
                                                    addForm.optionsText,
                                                ).length === 0)
                                        }
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
                                                                      label: e
                                                                          .target
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
                                                    {TYPE_OPTIONS.map((t) => (
                                                        <option
                                                            key={t}
                                                            value={t}
                                                        >
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
                                                        value={
                                                            editForm.optionsText
                                                        }
                                                        onChange={(e) =>
                                                            setEditForm((f) =>
                                                                f
                                                                    ? {
                                                                          ...f,
                                                                          optionsText:
                                                                              e
                                                                                  .target
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
                                                        className="btn btn-xs btn-default"
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
                                                    ? (
                                                          field.options ?? []
                                                      ).join(', ') || '-'
                                                    : '-'}
                                            </td>
                                            <td>
                                                {field.required ? 'Tak' : 'Nie'}
                                            </td>
                                            <td className="col-actions">
                                                <span className="btn-group">
                                                    <button
                                                        type="button"
                                                        className="btn btn-xs btn-default"
                                                        onClick={() =>
                                                            openEditForm(field)
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
                        </PanelTable>
                    )}
                </PanelSection>
            </div>
        </div>
    );
}

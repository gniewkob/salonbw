import { useState } from 'react';
import VersumBreadcrumbs from '@/components/salonbw/VersumBreadcrumbs';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import CustomerSettingsNav from '@/components/settings/CustomerSettingsNav';
import PanelSection from '@/components/ui/PanelSection';
import PanelTable from '@/components/ui/PanelTable';
import {
    useCustomerOrigins,
    useCreateCustomerOrigin,
    useUpdateCustomerOrigin,
    useDeleteCustomerOrigin,
} from '@/hooks/useCustomers';

const NAV = <CustomerSettingsNav />;

export default function SettingsCustomerOriginsPage() {
    useSetSecondaryNav(NAV);

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
        <div className="settings-detail-layout" data-testid="settings-detail">
            <aside className="settings-detail-layout__sidebar">{NAV}</aside>
            <div className="settings-detail-layout__main">
                <VersumBreadcrumbs
                    iconClass="sprite-breadcrumbs_settings"
                    items={[
                        { label: 'Ustawienia', href: '/settings' },
                        { label: 'Klienci' },
                        { label: 'Pochodzenie klientów' },
                    ]}
                />

                <PanelSection
                    action={
                        <button
                            type="button"
                            className="btn button-blue pull-right"
                            onClick={() => setIsAdding(true)}
                        >
                            + Dodaj nowe źródło
                        </button>
                    }
                >
                    {isAdding && (
                        <div className="form-group">
                            <label className="control-label">
                                Nazwa źródła
                            </label>
                            <div className="input-group">
                                <input
                                    type="text"
                                    className="form-control"
                                    value={addingName}
                                    onChange={(e) =>
                                        setAddingName(e.target.value)
                                    }
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
                                <span className="input-group-btn">
                                    <button
                                        type="button"
                                        className="btn button-blue"
                                        onClick={handleAdd}
                                        disabled={createOrigin.isPending}
                                    >
                                        Zapisz
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-default"
                                        onClick={() => {
                                            setIsAdding(false);
                                            setAddingName('');
                                        }}
                                    >
                                        Anuluj
                                    </button>
                                </span>
                            </div>
                        </div>
                    )}

                    {isLoading && <p>Ładowanie...</p>}
                    {isError && (
                        <div className="alert alert-danger">
                            Nie udało się załadować źródeł.
                        </div>
                    )}

                    {!isLoading && !isError && (
                        <>
                            <div className="column_row">
                                <h2>Zdefiniowane przez salon</h2>
                                {customOrigins.length === 0 ? (
                                    <h3>
                                        W salonie nie zdefiniowano żadnych
                                        źródeł pochodzenia klienta.
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
                                                className={
                                                    i % 2 === 0 ? 'even' : 'odd'
                                                }
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
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            onKeyDown={(e) => {
                                                                if (
                                                                    e.key ===
                                                                    'Enter'
                                                                )
                                                                    handleEditSave(
                                                                        origin.id,
                                                                    );
                                                                if (
                                                                    e.key ===
                                                                    'Escape'
                                                                )
                                                                    setEditingId(
                                                                        null,
                                                                    );
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
                                                                className="btn btn-xs button-blue"
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
                                                                className="btn btn-xs btn-default"
                                                                onClick={() =>
                                                                    setEditingId(
                                                                        null,
                                                                    )
                                                                }
                                                            >
                                                                anuluj
                                                            </button>
                                                        </span>
                                                    ) : (
                                                        <span className="btn-group">
                                                            <button
                                                                type="button"
                                                                className="btn btn-xs btn-default"
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
                                                                className="btn btn-xs btn-default"
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
                            </div>

                            <div className="column_row">
                                <h2>Zdefiniowane w systemie</h2>
                                <PanelTable columns={[{ label: 'Nazwa' }]}>
                                    {systemOrigins.map((origin, i) => (
                                        <tr
                                            key={origin.id}
                                            className={
                                                i % 2 === 0 ? 'odd' : 'even'
                                            }
                                        >
                                            <td>{origin.name}</td>
                                        </tr>
                                    ))}
                                </PanelTable>
                            </div>
                        </>
                    )}
                </PanelSection>
            </div>
        </div>
    );
}

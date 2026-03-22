import Link from 'next/link';
import { useState, useEffect } from 'react';
import VersumBreadcrumbs from '@/components/salonbw/VersumBreadcrumbs';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import CustomerSettingsNav from '@/components/settings/CustomerSettingsNav';
import PanelActionBar from '@/components/ui/PanelActionBar';
import {
    useDataProtectionEmployeeLimits,
    useDataProtectionSettings,
    useSettingsMutations,
} from '@/hooks/useSettings';

const NAV = <CustomerSettingsNav />;

export default function SettingsDataProtectionPage() {
    useSetSecondaryNav(NAV);

    const { data, isLoading, isError } = useDataProtectionSettings();
    const employeeLimits = useDataProtectionEmployeeLimits();
    const { updateDataProtection, updateDataProtectionEmployeeLimit } =
        useSettingsMutations();

    const [paranoiaMode, setParanoiaMode] = useState(false);
    const [paranoiaLimit, setParanoiaLimit] = useState(20);
    const [paranoiaEmail, setParanoiaEmail] = useState('');
    const [saved, setSaved] = useState(false);
    const [editingEmployeeId, setEditingEmployeeId] = useState<number | null>(
        null,
    );
    const [employeeLimitDraft, setEmployeeLimitDraft] = useState('');

    useEffect(() => {
        if (data) {
            setParanoiaMode(data.paranoiaMode);
            setParanoiaLimit(data.paranoiaLimit);
            setParanoiaEmail(data.paranoiaEmail ?? '');
        }
    }, [data]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateDataProtection.mutate(
            {
                paranoiaMode,
                paranoiaLimit,
                paranoiaEmail: paranoiaEmail || undefined,
            },
            {
                onSuccess: () => {
                    setSaved(true);
                    setTimeout(() => setSaved(false), 3000);
                },
            },
        );
    };

    const startEmployeeLimitEdit = (id: number, limit: number) => {
        setEditingEmployeeId(id);
        setEmployeeLimitDraft(String(limit));
    };

    const cancelEmployeeLimitEdit = () => {
        setEditingEmployeeId(null);
        setEmployeeLimitDraft('');
    };

    const saveEmployeeLimit = (id: number) => {
        const nextLimit = Number(employeeLimitDraft);
        if (!Number.isFinite(nextLimit) || nextLimit < 1) {
            return;
        }

        updateDataProtectionEmployeeLimit.mutate(
            { id, data: { paranoiaLimit: nextLimit } },
            {
                onSuccess: () => {
                    cancelEmployeeLimitEdit();
                },
            },
        );
    };

    const clearEmployeeLimit = (id: number) => {
        updateDataProtectionEmployeeLimit.mutate(
            { id, data: { paranoiaLimit: null } },
            {
                onSuccess: () => {
                    if (editingEmployeeId === id) {
                        cancelEmployeeLimitEdit();
                    }
                },
            },
        );
    };

    const formatEmployeeRole = (role: string) => {
        switch (role) {
            case 'admin':
                return 'Administrator';
            case 'receptionist':
                return 'Recepcjonista';
            case 'employee':
                return 'Pracownik';
            default:
                return role;
        }
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
                        { label: 'Tryb ochrony danych' },
                    ]}
                />

                {isLoading && (
                    <div className="edit_branch_form">
                        <p>Ładowanie...</p>
                    </div>
                )}

                {isError && (
                    <div className="edit_branch_form">
                        <div className="alert alert-danger">
                            Nie udało się załadować ustawień.
                        </div>
                    </div>
                )}

                {!isLoading && !isError && (
                    <form className="edit_branch_form" onSubmit={handleSubmit}>
                        <div className="actions">
                            <Link
                                className="button"
                                href="/settings/data-protection/logs"
                            >
                                Rejestr aktywności pracowników
                            </Link>
                        </div>

                        <h2>Tryb ochrony danych</h2>

                        {saved && (
                            <div className="alert alert-success">
                                Ustawienia zostały zapisane.
                            </div>
                        )}

                        {updateDataProtection.isError && (
                            <div className="alert alert-danger">
                                Wystąpił błąd podczas zapisywania ustawień.
                            </div>
                        )}

                        <div className="form-group">
                            <label className="control-label">
                                Tryb ochrony danych
                            </label>
                            <div>
                                <label className="checkbox-inline">
                                    <input
                                        type="checkbox"
                                        checked={paranoiaMode}
                                        onChange={(e) =>
                                            setParanoiaMode(e.target.checked)
                                        }
                                    />{' '}
                                    Włącz tryb ochrony danych
                                </label>
                            </div>
                        </div>

                        {paranoiaMode && (
                            <>
                                <div className="form-group">
                                    <label className="control-label">
                                        Limit kontaktów
                                    </label>
                                    <div className="input-group input-group--narrow">
                                        <input
                                            type="number"
                                            className="form-control"
                                            min={1}
                                            title="Limit kontaktów"
                                            placeholder="20"
                                            value={paranoiaLimit}
                                            onChange={(e) =>
                                                setParanoiaLimit(
                                                    Number(e.target.value),
                                                )
                                            }
                                        />
                                        <span className="input-group-addon">
                                            kontakty
                                        </span>
                                    </div>
                                    <p className="help-block">
                                        Pracownik może wyświetlić dane
                                        kontaktowe maksymalnie tylu klientów
                                        dziennie.
                                    </p>
                                </div>

                                <div className="form-group">
                                    <label className="control-label">
                                        E-mail powiadomień
                                    </label>
                                    <input
                                        type="email"
                                        className="form-control"
                                        value={paranoiaEmail}
                                        onChange={(e) =>
                                            setParanoiaEmail(e.target.value)
                                        }
                                        placeholder="np. admin@salon.pl"
                                    />
                                    <p className="help-block">
                                        Na ten adres będą wysyłane powiadomienia
                                        o przekroczeniu limitu.
                                    </p>
                                </div>

                                <div className="form-group">
                                    <h2>Indywidualne limity dla pracowników</h2>
                                    <p className="help-block">
                                        Ustal indywidualnie liczbę klientów,
                                        których dane kontaktowe mogą przeglądać
                                        poszczególni pracownicy w ciągu jednego
                                        dnia.
                                    </p>
                                    {employeeLimits.isLoading && (
                                        <p className="help-block">
                                            Ładowanie listy pracowników...
                                        </p>
                                    )}
                                    {employeeLimits.isError && (
                                        <div className="alert alert-danger">
                                            Nie udało się załadować limitów
                                            pracowników.
                                        </div>
                                    )}
                                    {updateDataProtectionEmployeeLimit.isError && (
                                        <div className="alert alert-danger">
                                            Nie udało się zapisać limitu
                                            pracownika.
                                        </div>
                                    )}
                                    {!employeeLimits.isLoading &&
                                        !employeeLimits.isError && (
                                            <ul className="data-protection-limits">
                                                {(
                                                    employeeLimits.data ?? []
                                                ).map((employee) => {
                                                    const effectiveLimit =
                                                        employee.paranoiaLimitOverride ??
                                                        paranoiaLimit;
                                                    const isAdmin =
                                                        employee.role ===
                                                        'admin';
                                                    const isEditing =
                                                        editingEmployeeId ===
                                                        employee.id;
                                                    const isSavingThisRow =
                                                        updateDataProtectionEmployeeLimit.isPending &&
                                                        updateDataProtectionEmployeeLimit
                                                            .variables?.id ===
                                                            employee.id;

                                                    return (
                                                        <li key={employee.id}>
                                                            <label>
                                                                {employee.name}{' '}
                                                                <span className="data-protection-limits__role">
                                                                    (
                                                                    {formatEmployeeRole(
                                                                        employee.role,
                                                                    )}
                                                                    )
                                                                </span>
                                                            </label>
                                                            <br className="c" />
                                                            {isAdmin ? (
                                                                <span>
                                                                    Tryb ochrony
                                                                    danych
                                                                    kontaktowych
                                                                    klientów nie
                                                                    dotyczy
                                                                    administratorów
                                                                    konta w
                                                                    systemie.
                                                                    Moga oni
                                                                    przegladac
                                                                    karty
                                                                    klientow bez
                                                                    ograniczen.
                                                                </span>
                                                            ) : isEditing ? (
                                                                <div className="data-protection-limits__editor">
                                                                    <span>
                                                                        Limit
                                                                    </span>
                                                                    <input
                                                                        className="form-control data-protection-limits__input"
                                                                        min={1}
                                                                        type="number"
                                                                        value={
                                                                            employeeLimitDraft
                                                                        }
                                                                        onChange={(
                                                                            event,
                                                                        ) =>
                                                                            setEmployeeLimitDraft(
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                            )
                                                                        }
                                                                    />
                                                                    <button
                                                                        className="btn button-blue btn_small"
                                                                        disabled={
                                                                            isSavingThisRow
                                                                        }
                                                                        type="button"
                                                                        onClick={() =>
                                                                            saveEmployeeLimit(
                                                                                employee.id,
                                                                            )
                                                                        }
                                                                    >
                                                                        zapisz
                                                                    </button>
                                                                    <button
                                                                        className="button-link"
                                                                        disabled={
                                                                            isSavingThisRow
                                                                        }
                                                                        type="button"
                                                                        onClick={
                                                                            cancelEmployeeLimitEdit
                                                                        }
                                                                    >
                                                                        anuluj
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="data-protection-limits__summary">
                                                                    <span>
                                                                        Limit:{' '}
                                                                        <strong>
                                                                            {
                                                                                effectiveLimit
                                                                            }
                                                                        </strong>{' '}
                                                                        klientow
                                                                    </span>
                                                                    <button
                                                                        className="button-link"
                                                                        type="button"
                                                                        onClick={() =>
                                                                            startEmployeeLimitEdit(
                                                                                employee.id,
                                                                                effectiveLimit,
                                                                            )
                                                                        }
                                                                    >
                                                                        Zmien
                                                                        limit
                                                                    </button>
                                                                    {employee.paranoiaLimitOverride !==
                                                                        null && (
                                                                        <button
                                                                            className="button-link"
                                                                            disabled={
                                                                                isSavingThisRow
                                                                            }
                                                                            type="button"
                                                                            onClick={() =>
                                                                                clearEmployeeLimit(
                                                                                    employee.id,
                                                                                )
                                                                            }
                                                                        >
                                                                            Uzyj
                                                                            limitu
                                                                            domyslnego
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                </div>
                            </>
                        )}

                        <PanelActionBar
                            primary={
                                <button
                                    type="submit"
                                    className="btn button-blue"
                                    disabled={updateDataProtection.isPending}
                                >
                                    {updateDataProtection.isPending
                                        ? 'Zapisywanie...'
                                        : 'Zapisz ustawienia'}
                                </button>
                            }
                        />
                    </form>
                )}
            </div>
        </div>
    );
}

import Link from 'next/link';
import { useMemo, useState } from 'react';
import RouteGuard from '@/components/RouteGuard';
import SalonBWShell from '@/components/salonbw/SalonBWShell';
import VersumBreadcrumbs from '@/components/salonbw/VersumBreadcrumbs';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import { useAuth } from '@/contexts/AuthContext';
import { useEmployees } from '@/hooks/useEmployees';
import { useTimetables, useTimetableMutations } from '@/hooks/useTimetables';
import type { Timetable } from '@/types';
import PanelSection from '@/components/ui/PanelSection';

const NAV = (
    <div className="sidenav" id="sidenav">
        <div className="column_row tree other_settings">
            <h4>Grafiki pracy</h4>
            <ul>
                <li>
                    <Link
                        href="/settings/timetable/employees"
                        className="active"
                    >
                        <div className="icon_box">
                            <span className="icon sprite-settings_timetable_nav" />
                        </div>
                        Pracownicy
                    </Link>
                </li>
                <li>
                    <Link href="/settings/timetable/branch">
                        <div className="icon_box">
                            <span className="icon sprite-settings_timetable_nav" />
                        </div>
                        Salon
                    </Link>
                </li>
                <li>
                    <Link href="/settings/timetable/templates">
                        <div className="icon_box">
                            <span className="icon sprite-settings_timetable_nav" />
                        </div>
                        Szablony
                    </Link>
                </li>
            </ul>
        </div>
    </div>
);

function toIsoDate(date: Date) {
    return date.toISOString().slice(0, 10);
}

function startOfIsoWeek(date: Date) {
    const copy = new Date(date);
    copy.setHours(12, 0, 0, 0);
    const day = (copy.getDay() + 6) % 7;
    copy.setDate(copy.getDate() - day);
    return copy;
}

function addDays(date: Date, days: number) {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
}

function isWithinRange(timetable: Timetable, date: string) {
    if (timetable.validFrom && date < timetable.validFrom) {
        return false;
    }
    if (timetable.validTo && date > timetable.validTo) {
        return false;
    }
    return timetable.isActive;
}

export default function SettingsTimetableEmployeesCopyPage() {
    const { role } = useAuth();
    useSetSecondaryNav(NAV);

    const { data: employeesRaw, loading } = useEmployees();
    const { data: timetables, loading: timetablesLoading } = useTimetables();
    const { createTimetable } = useTimetableMutations();

    const employees = employeesRaw ?? [];
    const weekStart = useMemo(() => startOfIsoWeek(new Date()), []);
    const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

    const [fromId, setFromId] = useState('');
    const [targetIds, setTargetIds] = useState<string[]>([]);
    const [copyFrom, setCopyFrom] = useState(toIsoDate(weekStart));
    const [copyTo, setCopyTo] = useState(toIsoDate(weekEnd));
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const availableTargets = employees.filter(
        (employee) => String(employee.id) !== fromId,
    );

    const sourceTimetable = useMemo(() => {
        if (!fromId) return null;
        const sourceDate = copyFrom || toIsoDate(weekStart);

        return (
            [...(timetables ?? [])]
                .filter((timetable) => timetable.employeeId === Number(fromId))
                .sort((a, b) => b.validFrom.localeCompare(a.validFrom))
                .find((timetable) => isWithinRange(timetable, sourceDate)) ??
            null
        );
    }, [copyFrom, fromId, timetables, weekStart]);

    const handleTargetChange = (
        event: React.ChangeEvent<HTMLSelectElement>,
    ) => {
        const values = Array.from(
            event.target.selectedOptions,
            (option) => option.value,
        );
        setTargetIds(values);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setSuccessMessage('');
        setErrorMessage('');

        if (!fromId || targetIds.length === 0 || !copyFrom || !copyTo) {
            setErrorMessage(
                'Wybierz pracownika źródłowego, zakres dat i pracowników docelowych.',
            );
            return;
        }

        if (copyFrom > copyTo) {
            setErrorMessage(
                'Data początkowa nie może być późniejsza niż data końcowa.',
            );
            return;
        }

        if (!sourceTimetable) {
            setErrorMessage(
                'Nie znaleziono aktywnego grafiku źródłowego dla wybranego tygodnia początkowego.',
            );
            return;
        }

        try {
            for (const targetId of targetIds) {
                await createTimetable.mutateAsync({
                    employeeId: Number(targetId),
                    name: `${sourceTimetable.name} (kopia)`,
                    description: sourceTimetable.description,
                    validFrom: copyFrom,
                    validTo: copyTo,
                    slots: sourceTimetable.slots.map((slot) => ({
                        dayOfWeek: slot.dayOfWeek,
                        startTime: slot.startTime.slice(0, 5),
                        endTime: slot.endTime.slice(0, 5),
                        isBreak: slot.isBreak,
                        notes: slot.notes ?? undefined,
                    })),
                });
            }

            const copiedNames = employees
                .filter((employee) => targetIds.includes(String(employee.id)))
                .map((employee) => employee.name)
                .join(', ');

            setSuccessMessage(`Skopiowano grafik do: ${copiedNames}.`);
            setTargetIds([]);
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Nie udało się skopiować grafików pracy.';
            setErrorMessage(message);
        }
    };

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <SalonBWShell role={role}>
                <div
                    className="settings-detail-layout"
                    data-testid="settings-detail"
                >
                    <aside className="settings-detail-layout__sidebar">
                        {NAV}
                    </aside>
                    <div className="settings-detail-layout__main">
                        <VersumBreadcrumbs
                            iconClass="sprite-breadcrumbs_settings"
                            items={[
                                { label: 'Ustawienia', href: '/settings' },
                                {
                                    label: 'Grafiki pracy',
                                    href: '/settings/timetable/employees',
                                },
                                { label: 'Kopiuj grafiki pracy' },
                            ]}
                        />
                        <PanelSection title="Kopiuj grafiki pracy">
                            {loading || timetablesLoading ? (
                                <p>Ładowanie...</p>
                            ) : (
                                <div className="row">
                                    <div className="col-md-8">
                                        {successMessage ? (
                                            <div className="alert alert-success">
                                                {successMessage}
                                            </div>
                                        ) : null}
                                        {errorMessage ? (
                                            <div className="alert alert-danger">
                                                {errorMessage}
                                            </div>
                                        ) : null}
                                        <form
                                            onSubmit={(event) => {
                                                void handleSubmit(event);
                                            }}
                                        >
                                            <fieldset>
                                                <legend>Dane kopiowania</legend>
                                                <div className="form-group">
                                                    <label
                                                        className="control-label"
                                                        htmlFor="copy-from-employee"
                                                    >
                                                        Kopiuj od pracownika
                                                    </label>
                                                    <select
                                                        id="copy-from-employee"
                                                        className="form-control"
                                                        value={fromId}
                                                        onChange={(event) => {
                                                            setFromId(
                                                                event.target
                                                                    .value,
                                                            );
                                                            setTargetIds([]);
                                                        }}
                                                    >
                                                        <option value="">
                                                            Wpisz imię i
                                                            nazwisko lub wybierz
                                                            z listy
                                                        </option>
                                                        {employees.map(
                                                            (employee) => (
                                                                <option
                                                                    key={
                                                                        employee.id
                                                                    }
                                                                    value={
                                                                        employee.id
                                                                    }
                                                                >
                                                                    {
                                                                        employee.name
                                                                    }
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                </div>

                                                <div className="form-group">
                                                    <label className="control-label">
                                                        Kopiowany okres
                                                    </label>
                                                    <div className="data-protection-limits__editor">
                                                        <span>od</span>
                                                        <input
                                                            className="form-control"
                                                            type="date"
                                                            value={copyFrom}
                                                            onChange={(event) =>
                                                                setCopyFrom(
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                        <span>do</span>
                                                        <input
                                                            className="form-control"
                                                            type="date"
                                                            value={copyTo}
                                                            onChange={(event) =>
                                                                setCopyTo(
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                    </div>
                                                    {sourceTimetable ? (
                                                        <p className="help-block">
                                                            Zostanie użyty
                                                            grafik:{' '}
                                                            <strong>
                                                                {
                                                                    sourceTimetable.name
                                                                }
                                                            </strong>
                                                            {sourceTimetable.validFrom
                                                                ? ` (${sourceTimetable.validFrom}`
                                                                : ''}
                                                            {sourceTimetable.validTo
                                                                ? ` - ${sourceTimetable.validTo})`
                                                                : sourceTimetable.validFrom
                                                                  ? ')'
                                                                  : ''}
                                                        </p>
                                                    ) : null}
                                                </div>

                                                <div className="form-group">
                                                    <label
                                                        className="control-label"
                                                        htmlFor="copy-target-employees"
                                                    >
                                                        Wklej pracownikom
                                                    </label>
                                                    <select
                                                        id="copy-target-employees"
                                                        className="form-control"
                                                        multiple
                                                        size={Math.max(
                                                            3,
                                                            Math.min(
                                                                6,
                                                                availableTargets.length ||
                                                                    3,
                                                            ),
                                                        )}
                                                        value={targetIds}
                                                        onChange={
                                                            handleTargetChange
                                                        }
                                                    >
                                                        {availableTargets.map(
                                                            (employee) => (
                                                                <option
                                                                    key={
                                                                        employee.id
                                                                    }
                                                                    value={
                                                                        employee.id
                                                                    }
                                                                >
                                                                    {
                                                                        employee.name
                                                                    }
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                    <p className="help-block">
                                                        Przytrzymaj Ctrl lub
                                                        Cmd, aby wybrać wielu
                                                        pracowników.
                                                    </p>
                                                </div>

                                                <div className="form-group">
                                                    <button
                                                        type="submit"
                                                        className="btn button-blue"
                                                        disabled={
                                                            createTimetable.isPending
                                                        }
                                                    >
                                                        {createTimetable.isPending
                                                            ? 'Kopiowanie...'
                                                            : 'Skopiuj'}
                                                    </button>
                                                    <Link
                                                        href="/settings/timetable/employees"
                                                        className="btn btn-default"
                                                        style={{
                                                            marginLeft: 8,
                                                        }}
                                                    >
                                                        Anuluj
                                                    </Link>
                                                </div>
                                            </fieldset>
                                        </form>
                                    </div>
                                    <div className="col-md-4">
                                        <fieldset>
                                            <legend>
                                                Funkcja pozwala na szybkie
                                                skopiowanie grafiku pracy
                                                ustalonego dla danego pracownika
                                                innym pracownikom.
                                            </legend>
                                            <p className="light_text">
                                                Wybierz pracownika źródłowego,
                                                zakres dat kopiowanego okresu
                                                oraz pracowników docelowych. Dla
                                                każdego odbiorcy zostanie
                                                zapisany nowy grafik z
                                                identycznym układem tygodnia.
                                            </p>
                                        </fieldset>
                                    </div>
                                </div>
                            )}
                        </PanelSection>
                    </div>
                </div>
            </SalonBWShell>
        </RouteGuard>
    );
}

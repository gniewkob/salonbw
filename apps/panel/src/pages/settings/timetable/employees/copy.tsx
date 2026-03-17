import Link from 'next/link';
import { useState } from 'react';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import { useEmployees } from '@/hooks/useEmployees';

const NAV = (
    <div className="sidenav secondarynav" id="sidenav">
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

export default function SettingsTimetableEmployeesCopyPage() {
    useSetSecondaryNav(NAV);

    const { data: employeesRaw, loading } = useEmployees();
    const employees = employeesRaw ?? [];
    const [fromId, setFromId] = useState('');
    const [toId, setToId] = useState('');

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
                            <Link href="/settings/timetable/employees">
                                Grafiki pracy
                            </Link>
                        </li>
                        <li>
                            <span> / </span>
                            Kopiuj grafik
                        </li>
                    </ul>
                </div>
                <div className="inner edit_branch_form">
                    <h2>Kopiuj grafik pracownika</h2>
                    {loading ? (
                        <p>Ładowanie...</p>
                    ) : (
                        <>
                            <div className="alert alert-info">
                                Funkcja kopiowania grafiku została odtworzona
                                jako ekran referencyjny z dumpa Versum, ale nie
                                jest jeszcze aktywna backendowo w architekturze
                                salonbw. Wybór pracowników jest zachowany dla
                                parity UX, jednak zapis nie jest wykonywany.
                            </div>
                            <form>
                                <div className="form-group">
                                    <label
                                        htmlFor="fromId"
                                        className="control-label"
                                    >
                                        Kopiuj od pracownika
                                    </label>
                                    <select
                                        id="fromId"
                                        className="form-control"
                                        value={fromId}
                                        onChange={(e) =>
                                            setFromId(e.target.value)
                                        }
                                    >
                                        <option value="">— wybierz —</option>
                                        {employees.map((emp) => (
                                            <option key={emp.id} value={emp.id}>
                                                {emp.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label
                                        htmlFor="toId"
                                        className="control-label"
                                    >
                                        Kopiuj do pracownika
                                    </label>
                                    <select
                                        id="toId"
                                        className="form-control"
                                        value={toId}
                                        onChange={(e) =>
                                            setToId(e.target.value)
                                        }
                                    >
                                        <option value="">— wybierz —</option>
                                        {employees
                                            .filter(
                                                (emp) =>
                                                    String(emp.id) !== fromId,
                                            )
                                            .map((emp) => (
                                                <option
                                                    key={emp.id}
                                                    value={emp.id}
                                                >
                                                    {emp.name}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <button
                                        type="button"
                                        className="btn button-blue"
                                        disabled
                                        title="Kopiowanie grafiku nie jest jeszcze aktywne backendowo."
                                    >
                                        Kopiowanie backendowe w przygotowaniu
                                    </button>
                                    <Link
                                        href="/settings/timetable/employees"
                                        className="btn btn-default"
                                        style={{ marginLeft: 8 }}
                                    >
                                        Anuluj
                                    </Link>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

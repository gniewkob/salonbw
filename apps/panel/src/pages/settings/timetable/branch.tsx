import Link from 'next/link';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';

const TIMETABLE_NAV = (
    <div className="sidenav secondarynav" id="sidenav">
        <div className="column_row tree other_settings">
            <h4>Grafiki pracy</h4>
            <ul>
                <li>
                    <Link href="/settings/timetable/employees">
                        <div className="icon_box">
                            <span className="icon sprite-settings_timetable_nav" />
                        </div>
                        Pracownicy
                    </Link>
                </li>
                <li>
                    <Link href="/settings/timetable/branch" className="active">
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

const DAYS = [
    'Poniedziałek',
    'Wtorek',
    'Środa',
    'Czwartek',
    'Piątek',
    'Sobota',
    'Niedziela',
];

export default function SettingsTimetableBranchPage() {
    useSetSecondaryNav(TIMETABLE_NAV);

    return (
        <div className="settings-detail-layout" data-testid="settings-detail">
            <aside className="settings-detail-layout__sidebar">
                {TIMETABLE_NAV}
            </aside>
            <div className="settings-detail-layout__main">
                <div className="breadcrumbs" e2e-breadcrumbs="">
                    <ul>
                        <li>
                            <div className="icon sprite-breadcrumbs_settings" />
                            <Link href="/settings">Ustawienia</Link>
                        </li>
                        <li>
                            <span> / </span>
                            Grafiki pracy
                        </li>
                        <li>
                            <span> / </span>
                            Salon
                        </li>
                    </ul>
                </div>
                <div className="inner edit_branch_form">
                    <div className="actions">
                        <button
                            type="button"
                            className="btn button-blue pull-right"
                            disabled
                        >
                            edytuj
                        </button>
                    </div>
                    <h2>Godziny pracy salonu</h2>
                    <table className="table table-bordered">
                        <thead>
                            <tr>
                                <th>
                                    <div>Dzień</div>
                                </th>
                                <th>
                                    <div>Od</div>
                                </th>
                                <th>
                                    <div>Do</div>
                                </th>
                                <th>
                                    <div>Czynny</div>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {DAYS.map((day, i) => (
                                <tr
                                    key={day}
                                    className={i % 2 === 0 ? 'even' : 'odd'}
                                >
                                    <td>{day}</td>
                                    <td>
                                        {i < 5
                                            ? '09:00'
                                            : i === 5
                                              ? '10:00'
                                              : '—'}
                                    </td>
                                    <td>
                                        {i < 5
                                            ? '20:00'
                                            : i === 5
                                              ? '18:00'
                                              : '—'}
                                    </td>
                                    <td>{i < 6 ? 'Tak' : 'Nie'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

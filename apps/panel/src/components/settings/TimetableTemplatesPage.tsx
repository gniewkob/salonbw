import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useStaffOptions } from '@/hooks/useEmployees';
import { useTimetables } from '@/hooks/useTimetables';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import type { DayOfWeek, Timetable } from '@/types';

type TemplateDayState =
    | { kind: 'open'; startTime: string; endTime: string }
    | { kind: 'dayoff' }
    | { kind: 'closed' };

type TimetableTemplate = {
    id: number;
    name: string;
    colorClass: 'color1' | 'color2' | 'color3' | 'color4' | 'color5';
    days: Record<DayOfWeek, TemplateDayState>;
};

const STORAGE_KEY = 'salonbw:timetable-templates';

const DEFAULT_TEMPLATES: TimetableTemplate[] = [
    {
        id: 4978,
        name: 'Poniedziałek Środa wolne',
        colorClass: 'color1',
        days: {
            0: { kind: 'dayoff' },
            1: { kind: 'open', startTime: '10:00', endTime: '19:00' },
            2: { kind: 'dayoff' },
            3: { kind: 'open', startTime: '10:00', endTime: '15:00' },
            4: { kind: 'open', startTime: '10:00', endTime: '19:00' },
            5: { kind: 'open', startTime: '09:00', endTime: '15:00' },
            6: { kind: 'closed' },
        },
    },
    {
        id: 4979,
        name: 'Recepcja',
        colorClass: 'color2',
        days: {
            0: { kind: 'open', startTime: '10:00', endTime: '19:00' },
            1: { kind: 'open', startTime: '10:00', endTime: '18:00' },
            2: { kind: 'open', startTime: '10:00', endTime: '19:00' },
            3: { kind: 'dayoff' },
            4: { kind: 'open', startTime: '10:00', endTime: '18:00' },
            5: { kind: 'open', startTime: '09:00', endTime: '15:00' },
            6: { kind: 'closed' },
        },
    },
    {
        id: 5013,
        name: 'Stylistka paznokci',
        colorClass: 'color3',
        days: {
            0: { kind: 'dayoff' },
            1: { kind: 'open', startTime: '10:00', endTime: '19:00' },
            2: { kind: 'open', startTime: '10:00', endTime: '18:00' },
            3: { kind: 'open', startTime: '10:00', endTime: '18:00' },
            4: { kind: 'open', startTime: '10:00', endTime: '19:00' },
            5: { kind: 'open', startTime: '09:00', endTime: '15:00' },
            6: { kind: 'closed' },
        },
    },
    {
        id: 4976,
        name: 'Wolny piątek',
        colorClass: 'color4',
        days: {
            0: { kind: 'open', startTime: '10:00', endTime: '18:00' },
            1: { kind: 'open', startTime: '10:00', endTime: '19:00' },
            2: { kind: 'open', startTime: '11:00', endTime: '19:00' },
            3: { kind: 'open', startTime: '10:00', endTime: '19:00' },
            4: { kind: 'dayoff' },
            5: { kind: 'open', startTime: '09:00', endTime: '15:00' },
            6: { kind: 'closed' },
        },
    },
    {
        id: 4977,
        name: 'Wolny wtorek',
        colorClass: 'color5',
        days: {
            0: { kind: 'open', startTime: '10:00', endTime: '19:00' },
            1: { kind: 'dayoff' },
            2: { kind: 'open', startTime: '10:00', endTime: '18:00' },
            3: { kind: 'open', startTime: '10:00', endTime: '18:00' },
            4: { kind: 'open', startTime: '10:00', endTime: '19:00' },
            5: { kind: 'open', startTime: '09:00', endTime: '15:00' },
            6: { kind: 'closed' },
        },
    },
];

const DAY_LABELS = [
    'poniedziałek',
    'wtorek',
    'środa',
    'czwartek',
    'piątek',
    'sobota',
    'niedziela',
] as const;

function timeToMinutes(value: string) {
    const [hours, minutes] = value.split(':').map(Number);
    return hours * 60 + minutes;
}

function formatHours(minutes: number) {
    if (minutes <= 0) return '0h';
    const hours = minutes / 60;
    return Number.isInteger(hours)
        ? `${hours}h`
        : `${hours.toFixed(1).replace('.', ',')}h`;
}

function getTemplateMinutes(template: TimetableTemplate) {
    return ([0, 1, 2, 3, 4, 5, 6] as DayOfWeek[]).reduce<number>((sum, day) => {
        const entry = template.days[day];
        if (entry.kind !== 'open') return sum;
        return (
            sum +
            (timeToMinutes(entry.endTime) - timeToMinutes(entry.startTime))
        );
    }, 0);
}

function getDefaultTemplate(
    name: string,
    colorClass: TimetableTemplate['colorClass'],
): TimetableTemplate {
    return {
        id: Date.now(),
        name,
        colorClass,
        days: {
            0: { kind: 'open', startTime: '10:00', endTime: '18:00' },
            1: { kind: 'open', startTime: '10:00', endTime: '18:00' },
            2: { kind: 'open', startTime: '10:00', endTime: '18:00' },
            3: { kind: 'open', startTime: '10:00', endTime: '18:00' },
            4: { kind: 'open', startTime: '10:00', endTime: '18:00' },
            5: { kind: 'dayoff' },
            6: { kind: 'closed' },
        },
    };
}

function loadTemplates() {
    if (typeof window === 'undefined') return DEFAULT_TEMPLATES;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_TEMPLATES;
    try {
        const parsed = JSON.parse(raw) as TimetableTemplate[];
        return parsed.length > 0 ? parsed : DEFAULT_TEMPLATES;
    } catch {
        return DEFAULT_TEMPLATES;
    }
}

export default function TimetableTemplatesPage() {
    const [templates, setTemplates] = useState<TimetableTemplate[]>([]);
    const [notice, setNotice] = useState<string | null>(null);
    const { data: staffOptions } = useStaffOptions();
    const { data: timetables } = useTimetables({ isActive: true });

    useEffect(() => {
        setTemplates(loadTemplates());
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined' || templates.length === 0) return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
    }, [templates]);

    const secondaryNav = useMemo(() => {
        const timetableMap = new Map<number, Timetable>(
            timetables.map((timetable) => [timetable.employeeId, timetable]),
        );

        return (
            <div className="sidenav secondarynav" id="sidenav">
                <div className="column_row">
                    <h4>Grafiki pracowników</h4>
                    <div className="tree users-list">
                        <Link
                            className="root"
                            href="/settings/timetable/employees"
                        >
                            <div className="icon_box">
                                <i className="icon sprite-filter_handled_employees " />
                            </div>
                            Wszyscy pracownicy
                        </Link>
                        <ul>
                            {(staffOptions ?? []).map((option) => {
                                const timetable = timetableMap.get(option.id);
                                return (
                                    <li key={option.id}>
                                        <Link
                                            href={{
                                                pathname:
                                                    '/settings/timetable/employees',
                                                query: {
                                                    employeeId: option.id,
                                                },
                                            }}
                                        >
                                            <span className="employee-name">
                                                {option.name}
                                            </span>
                                            <span className="schedule-to">
                                                {timetable?.validTo
                                                    ? `Grafik do ${new Date(
                                                          `${timetable.validTo}T12:00:00`,
                                                      )
                                                          .toLocaleDateString(
                                                              'pl-PL',
                                                          )
                                                          .replace(/\//g, '.')}`
                                                    : 'Brak daty końcowej'}
                                            </span>
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    <h4>Inne</h4>
                    <div className="list_container">
                        <ul className="simple-list">
                            <li>
                                <span className="settings-detail-layout__nav-disabled">
                                    <div className="icon_box">
                                        <i className="icon sprite-schedule_report mr-xs " />
                                    </div>
                                    Raport czasu pracy
                                </span>
                            </li>
                            <li>
                                <Link
                                    href="/settings/timetable/templates"
                                    className="active"
                                >
                                    <div className="icon_box">
                                        <i className="icon sprite-schedule_template mr-xs " />
                                    </div>
                                    Szablony
                                </Link>
                            </li>
                            <li>
                                <span className="settings-detail-layout__nav-disabled">
                                    <div className="icon_box">
                                        <i className="icon sprite-schedule_copy mr-xs " />
                                    </div>
                                    Kopiuj grafiki pracy
                                </span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }, [staffOptions, timetables]);

    useSetSecondaryNav(secondaryNav);

    const handleAdd = () => {
        const name = window.prompt('Nazwa szablonu', 'Nowy szablon');
        if (!name) return;
        const colorClass = `color${(
            (templates.length % 5) +
            1
        ).toString()}` as TimetableTemplate['colorClass'];
        setTemplates((current) => [
            ...current,
            getDefaultTemplate(name, colorClass),
        ]);
        setNotice('Dodano lokalny szablon grafiku.');
    };

    const handleRename = (id: number) => {
        const current = templates.find((template) => template.id === id);
        const nextName = window.prompt('Edytuj nazwę szablonu', current?.name);
        if (!nextName) return;
        setTemplates((items) =>
            items.map((item) =>
                item.id === id ? { ...item, name: nextName } : item,
            ),
        );
        setNotice('Zmieniono nazwę szablonu.');
    };

    const handleDelete = (id: number) => {
        if (!window.confirm('Czy na pewno chcesz usunąć szablon?')) return;
        setTemplates((items) => items.filter((item) => item.id !== id));
        setNotice('Usunięto lokalny szablon grafiku.');
    };

    return (
        <div className="timetable-templates-page">
            <div className="breadcrumbs" e2e-breadcrumbs="">
                <ul>
                    <li>
                        <div className="icon sprite-breadcrumbs_settings" />
                        <Link href="/settings">Ustawienia</Link>
                    </li>
                    <li>
                        <span> / </span>
                        <Link href="/settings/timetable/employees">
                            Grafiki pracowników
                        </Link>
                    </li>
                    <li>
                        <span> / </span>
                        Szablony
                    </li>
                </ul>
            </div>

            <div className="inner">
                <div className="column_row top_row">
                    <div className="buttons">
                        <button
                            type="button"
                            className="button button-blue"
                            onClick={handleAdd}
                        >
                            Dodaj szablon
                        </button>
                    </div>
                    <div className="c" />
                </div>
                <div className="column_row calendar-body">
                    <table className="week-table timetable-templates-page__table">
                        <thead>
                            <tr>
                                <th />
                                {DAY_LABELS.map((day) => (
                                    <th key={day}>{day}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="schedule-row" />
                            {templates.map((template) => (
                                <>
                                    <tr
                                        key={template.id}
                                        className="schedule-row"
                                    >
                                        <td className={template.colorClass}>
                                            <ul className="schedule-settings">
                                                <li className="name">
                                                    {template.name}
                                                </li>
                                                <li>
                                                    <span className="counter">
                                                        {formatHours(
                                                            getTemplateMinutes(
                                                                template,
                                                            ),
                                                        )}
                                                    </span>
                                                </li>
                                                <li className="schedule-edit">
                                                    <div className="pull_left">
                                                        <button
                                                            type="button"
                                                            className="timetable-employees-page__link-button"
                                                            onClick={() =>
                                                                handleRename(
                                                                    template.id,
                                                                )
                                                            }
                                                        >
                                                            Edytuj
                                                        </button>
                                                    </div>
                                                    <div className="pull_right">
                                                        <button
                                                            type="button"
                                                            className="timetable-employees-page__link-button"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    template.id,
                                                                )
                                                            }
                                                        >
                                                            Usuń
                                                        </button>
                                                    </div>
                                                    <div className="c" />
                                                </li>
                                            </ul>
                                        </td>
                                        {(
                                            [0, 1, 2, 3, 4, 5, 6] as DayOfWeek[]
                                        ).map((day) => {
                                            const entry = template.days[day];
                                            return (
                                                <td
                                                    key={`${template.id}-${day}`}
                                                    className={`${template.colorClass} days`}
                                                >
                                                    <div className="schedule-cell">
                                                        {entry.kind ===
                                                        'open' ? (
                                                            <ul className="schedule-cell-list schedule-cell-list-full">
                                                                <li className="schedule-open">
                                                                    {
                                                                        entry.startTime
                                                                    }{' '}
                                                                    -{' '}
                                                                    {
                                                                        entry.endTime
                                                                    }{' '}
                                                                    <span className="counter">
                                                                        {formatHours(
                                                                            timeToMinutes(
                                                                                entry.endTime,
                                                                            ) -
                                                                                timeToMinutes(
                                                                                    entry.startTime,
                                                                                ),
                                                                        )}
                                                                    </span>
                                                                </li>
                                                            </ul>
                                                        ) : (
                                                            <ul className="schedule-cell-list schedule-cell-list-empty">
                                                                <li className="schedule-closed">
                                                                    <div className="icon_box">
                                                                        <i
                                                                            className={`icon ${
                                                                                entry.kind ===
                                                                                'dayoff'
                                                                                    ? 'sprite-schedule_dayoff'
                                                                                    : 'sprite-schedule_inactive'
                                                                            } mr-xs `}
                                                                        />
                                                                    </div>{' '}
                                                                    {entry.kind ===
                                                                    'dayoff'
                                                                        ? 'Dzień wolny'
                                                                        : 'Salon nieczynny'}
                                                                </li>
                                                            </ul>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                    <tr
                                        key={`sep-${template.id}`}
                                        className="schedule-form-row"
                                    >
                                        <td colSpan={8} />
                                    </tr>
                                </>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={8}>
                                    <form
                                        className="pagination_container"
                                        action="/settings/timetable/templates"
                                    >
                                        <div className="row">
                                            <div className="info col-xs-7">
                                                Pozycje od 1 do{' '}
                                                {templates.length} z{' '}
                                                <span id="total_found">
                                                    {templates.length}
                                                </span>
                                            </div>
                                            <div className="form_pagination col-xs-5">
                                                <input
                                                    type="text"
                                                    name="page"
                                                    id="page"
                                                    value="1"
                                                    readOnly
                                                    className="pagination-page-input"
                                                />{' '}
                                                z <span>1</span>
                                            </div>
                                        </div>
                                    </form>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                {notice ? (
                    <div className="sms-settings-page__notice" role="status">
                        {notice}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

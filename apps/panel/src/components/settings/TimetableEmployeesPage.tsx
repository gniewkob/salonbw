import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import VersumBreadcrumbs from '@/components/salonbw/VersumBreadcrumbs';
import { useStaffOptions } from '@/hooks/useEmployees';
import { useTimetables } from '@/hooks/useTimetables';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import type { DayOfWeek, Timetable, TimetableSlot } from '@/types';

type ViewKind = 'day' | 'week';

const DAY_LABELS = [
    'poniedziałek',
    'wtorek',
    'środa',
    'czwartek',
    'piątek',
    'sobota',
    'niedziela',
] as const;

const DAY_SHORT = ['pon', 'wto', 'śro', 'czw', 'pia', 'sob', 'ndz'] as const;
const MONTH_LABELS = [
    'styczeń',
    'luty',
    'marzec',
    'kwiecień',
    'maj',
    'czerwiec',
    'lipiec',
    'sierpień',
    'wrzesień',
    'październik',
    'listopad',
    'grudzień',
] as const;

function parseDateParam(value: string | string[] | undefined) {
    if (typeof value !== 'string') return new Date();
    const parsed = new Date(`${value}T12:00:00`);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function toIsoDate(date: Date) {
    const copy = new Date(date);
    copy.setHours(12, 0, 0, 0);
    return copy.toISOString().slice(0, 10);
}

function formatDate(date: Date) {
    return `${String(date.getDate()).padStart(2, '0')}.${String(
        date.getMonth() + 1,
    ).padStart(2, '0')}.${date.getFullYear()}`;
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

function getIsoWeek(date: Date) {
    const copy = startOfIsoWeek(date);
    const thursday = addDays(copy, 3);
    const firstThursday = new Date(thursday.getFullYear(), 0, 4);
    const firstWeekStart = startOfIsoWeek(firstThursday);
    return (
        1 +
        Math.round(
            (startOfIsoWeek(thursday).getTime() - firstWeekStart.getTime()) /
                (7 * 24 * 60 * 60 * 1000),
        )
    );
}

function timeToMinutes(value: string) {
    const [hours, minutes] = value.slice(0, 5).split(':').map(Number);
    return hours * 60 + minutes;
}

function formatHours(totalMinutes: number) {
    if (totalMinutes <= 0) return '0h';
    const hours = totalMinutes / 60;
    if (Number.isInteger(hours)) return `${hours}h`;
    return `${hours.toFixed(1).replace('.', ',')}h`;
}

function getWorkingSlots(slots: TimetableSlot[], dayOfWeek: DayOfWeek) {
    return slots
        .filter((slot) => slot.dayOfWeek === dayOfWeek && !slot.isBreak)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

function getDailyMinutes(slots: TimetableSlot[], dayOfWeek: DayOfWeek) {
    return getWorkingSlots(slots, dayOfWeek).reduce((sum, slot) => {
        return (
            sum + (timeToMinutes(slot.endTime) - timeToMinutes(slot.startTime))
        );
    }, 0);
}

function getWeeklyMinutes(timetable: Timetable | null) {
    if (!timetable) return 0;
    return ([0, 1, 2, 3, 4, 5, 6] as DayOfWeek[]).reduce<number>(
        (sum, day) => sum + getDailyMinutes(timetable.slots, day),
        0,
    );
}

function isExpired(validTo?: string) {
    if (!validTo) return false;
    return new Date(`${validTo}T23:59:59`).getTime() < Date.now();
}

export default function TimetableEmployeesPage() {
    const router = useRouter();
    const date = parseDateParam(router.query.date);
    const kind: ViewKind = router.query.kind === 'day' ? 'day' : 'week';
    const selectedEmployeeId =
        typeof router.query.employeeId === 'string'
            ? Number(router.query.employeeId)
            : null;

    const { data: staffOptions } = useStaffOptions();
    const {
        data: timetables,
        loading,
        error,
        refetch,
    } = useTimetables({
        isActive: true,
    });

    const currentWeekStart = startOfIsoWeek(date);
    const visibleDates =
        kind === 'day'
            ? [date]
            : Array.from({ length: 7 }, (_, index) =>
                  addDays(currentWeekStart, index),
              );

    const periodLabel =
        kind === 'week'
            ? `${formatDate(visibleDates[0]!)} - ${formatDate(
                  visibleDates[visibleDates.length - 1]!,
              )}`
            : formatDate(visibleDates[0]!);

    const breadcrumbLabel =
        kind === 'week'
            ? `${getIsoWeek(date)} tydzień`
            : DAY_LABELS[(date.getDay() + 6) % 7];

    const prevDate = addDays(date, kind === 'week' ? -7 : -1);
    const nextDate = addDays(date, kind === 'week' ? 7 : 1);
    const today = new Date();
    const todayActive =
        kind === 'week'
            ? toIsoDate(startOfIsoWeek(today)) === toIsoDate(currentWeekStart)
            : toIsoDate(today) === toIsoDate(date);

    const timetableMap = useMemo(() => {
        return new Map<number, Timetable>(
            timetables.map((timetable) => [timetable.employeeId, timetable]),
        );
    }, [timetables]);
    const staffSignature = JSON.stringify(
        (staffOptions ?? []).map((option) => ({
            id: option.id,
            name: option.name,
        })),
    );
    const timetableSignature = JSON.stringify(
        timetables.map((timetable) => ({
            employeeId: timetable.employeeId,
            validTo: timetable.validTo ?? null,
        })),
    );
    const dateKey = toIsoDate(date);
    const staffNavItems = useMemo<Array<{ id: number; name: string }>>(() => {
        if (!staffSignature) return [];
        return JSON.parse(staffSignature) as Array<{
            id: number;
            name: string;
        }>;
    }, [staffSignature]);
    const timetableNavMap = useMemo(() => {
        if (!timetableSignature) {
            return new Map<number, { validTo: string | null }>();
        }

        const items = JSON.parse(timetableSignature) as Array<{
            employeeId: number;
            validTo: string | null;
        }>;

        return new Map(
            items.map((item) => [item.employeeId, { validTo: item.validTo }]),
        );
    }, [timetableSignature]);

    const rows = useMemo(() => {
        const options = (staffOptions ?? []).filter((option) =>
            selectedEmployeeId ? option.id === selectedEmployeeId : true,
        );
        return options
            .map((option) => ({
                employee: option,
                timetable: timetableMap.get(option.id) ?? null,
            }))
            .sort((a, b) => a.employee.name.localeCompare(b.employee.name));
    }, [selectedEmployeeId, staffOptions, timetableMap]);

    const secondaryNav = useMemo(
        () => (
            <div className="sidenav" id="sidenav">
                <div className="column_row">
                    <h4>Grafiki pracowników</h4>
                    <div className="tree users-list">
                        <Link
                            className={
                                selectedEmployeeId ? 'root' : 'root active'
                            }
                            href={{
                                pathname: '/settings/timetable/employees',
                                query: { date: dateKey, kind },
                            }}
                        >
                            <div className="icon_box">
                                <i className="icon sprite-filter_handled_employees " />
                            </div>
                            Wszyscy pracownicy
                        </Link>
                        <ul>
                            {staffNavItems.map((option) => {
                                const timetable = timetableNavMap.get(
                                    option.id,
                                );
                                const expired = isExpired(
                                    timetable?.validTo ?? undefined,
                                );
                                return (
                                    <li
                                        key={option.id}
                                        className={
                                            option.id === selectedEmployeeId
                                                ? 'active'
                                                : ''
                                        }
                                    >
                                        <Link
                                            href={{
                                                pathname:
                                                    '/settings/timetable/employees/[id]',
                                                query: {
                                                    id: option.id,
                                                    date: dateKey,
                                                    kind,
                                                },
                                            }}
                                        >
                                            <span className="employee-name">
                                                {option.name}
                                            </span>
                                            <span
                                                className={
                                                    expired
                                                        ? 'expired schedule-to'
                                                        : 'schedule-to'
                                                }
                                            >
                                                {timetable?.validTo
                                                    ? `Grafik do ${formatDate(
                                                          new Date(
                                                              `${timetable.validTo}T12:00:00`,
                                                          ),
                                                      )}`
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
                                <Link href="/statistics/worktime">
                                    <div className="icon_box">
                                        <i className="icon sprite-schedule_report mr-xs " />
                                    </div>
                                    Raport czasu pracy
                                </Link>
                            </li>
                            <li>
                                <Link href="/settings/timetable/templates">
                                    <div className="icon_box">
                                        <i className="icon sprite-schedule_template mr-xs " />
                                    </div>
                                    Szablony
                                </Link>
                            </li>
                            <li>
                                <Link href="/settings/timetable/employees/copy">
                                    <div className="icon_box">
                                        <i className="icon sprite-schedule_copy mr-xs " />
                                    </div>
                                    Kopiuj grafiki pracy
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        ),
        [dateKey, kind, selectedEmployeeId, staffNavItems, timetableNavMap],
    );

    useSetSecondaryNav(secondaryNav);

    if (loading) {
        return (
            <div className="settings-detail-state">Ładowanie grafików...</div>
        );
    }

    if (error) {
        return (
            <div className="settings-detail-state settings-detail-state--error">
                <div>Nie udało się pobrać grafików pracowników.</div>
                <button
                    type="button"
                    className="btn btn-default"
                    onClick={() => void refetch()}
                >
                    odśwież
                </button>
            </div>
        );
    }

    return (
        <div className="timetable-employees-page">
            <VersumBreadcrumbs
                iconClass="sprite-breadcrumbs_settings"
                items={[
                    { label: 'Ustawienia', href: '/settings' },
                    {
                        label: 'Grafiki pracowników',
                        href: '/settings/timetable/employees',
                    },
                    { label: breadcrumbLabel },
                ]}
            />

            <div>
                <div className="column_row top_row timetable-employees-page__top">
                    <div className="date">
                        <div className="button-group">
                            <Link
                                className="button"
                                href={{
                                    pathname: '/settings/timetable/employees',
                                    query: {
                                        date: toIsoDate(prevDate),
                                        kind,
                                        ...(selectedEmployeeId
                                            ? {
                                                  employeeId:
                                                      selectedEmployeeId,
                                              }
                                            : {}),
                                    },
                                }}
                            >
                                <span className="fc-icon fc-icon-left-single-arrow" />
                            </Link>
                            <Link
                                className="button"
                                href={{
                                    pathname: '/settings/timetable/employees',
                                    query: {
                                        date: toIsoDate(nextDate),
                                        kind,
                                        ...(selectedEmployeeId
                                            ? {
                                                  employeeId:
                                                      selectedEmployeeId,
                                              }
                                            : {}),
                                    },
                                }}
                            >
                                <span className="fc-icon fc-icon-right-single-arrow" />
                            </Link>
                        </div>
                        <div className="dropdown inline_block">
                            <div className="date_range_box">
                                <input
                                    type="text"
                                    value={periodLabel}
                                    readOnly
                                />
                            </div>
                        </div>
                        <div className="inline_block">
                            <Link
                                className={
                                    todayActive ? 'button disabled' : 'button'
                                }
                                href={{
                                    pathname: '/settings/timetable/employees',
                                    query: {
                                        date: toIsoDate(today),
                                        kind,
                                        ...(selectedEmployeeId
                                            ? {
                                                  employeeId:
                                                      selectedEmployeeId,
                                              }
                                            : {}),
                                    },
                                }}
                            >
                                Dzisiaj
                            </Link>
                        </div>
                    </div>
                    <div className="buttons">
                        <div className="button-group">
                            <Link
                                className={
                                    kind === 'day'
                                        ? 'button button-blue'
                                        : 'button'
                                }
                                href={{
                                    pathname: '/settings/timetable/employees',
                                    query: {
                                        date: toIsoDate(date),
                                        kind: 'day',
                                        ...(selectedEmployeeId
                                            ? {
                                                  employeeId:
                                                      selectedEmployeeId,
                                              }
                                            : {}),
                                    },
                                }}
                            >
                                Dzień
                            </Link>
                            <Link
                                className={
                                    kind === 'week'
                                        ? 'button button-blue'
                                        : 'button'
                                }
                                href={{
                                    pathname: '/settings/timetable/employees',
                                    query: {
                                        date: toIsoDate(date),
                                        kind: 'week',
                                        ...(selectedEmployeeId
                                            ? {
                                                  employeeId:
                                                      selectedEmployeeId,
                                              }
                                            : {}),
                                    },
                                }}
                            >
                                Tydzień
                            </Link>
                        </div>
                    </div>
                    <div className="c" />
                </div>

                <div className="column_row calendar-body">
                    <table className="week-table timetable-employees-page__table">
                        <thead>
                            <tr>
                                <th />
                                {visibleDates.map((visibleDate) => (
                                    <th key={toIsoDate(visibleDate)}>
                                        {
                                            DAY_LABELS[
                                                (visibleDate.getDay() + 6) % 7
                                            ]
                                        }
                                        <div className="lbl">
                                            {formatDate(visibleDate)}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={visibleDates.length + 1}
                                        className="timetable-employees-page__empty"
                                    >
                                        Brak pracowników do wyświetlenia.
                                    </td>
                                </tr>
                            ) : (
                                rows.map(({ employee, timetable }) => (
                                    <tr
                                        key={employee.id}
                                        className="schedule-row"
                                    >
                                        <td className="timetable-employees-page__employee">
                                            <ul className="schedule-settings">
                                                <li
                                                    className="name"
                                                    title={employee.name}
                                                >
                                                    <Link
                                                        className="inverse_decoration blue_text"
                                                        href={{
                                                            pathname:
                                                                '/settings/timetable/employees/[id]',
                                                            query: {
                                                                id: employee.id,
                                                                date: toIsoDate(
                                                                    date,
                                                                ),
                                                                kind,
                                                            },
                                                        }}
                                                    >
                                                        {employee.name}
                                                    </Link>
                                                </li>
                                                <li>
                                                    <span className="counter counter-slim">
                                                        {formatHours(
                                                            getWeeklyMinutes(
                                                                timetable,
                                                            ),
                                                        )}
                                                    </span>
                                                </li>
                                                <li className="schedule-edit">
                                                    <Link
                                                        className="timetable-employees-page__link-button"
                                                        href={{
                                                            pathname:
                                                                '/settings/timetable/employees/[id]',
                                                            query: {
                                                                id: employee.id,
                                                                date: toIsoDate(
                                                                    date,
                                                                ),
                                                            },
                                                        }}
                                                    >
                                                        Edytuj
                                                    </Link>
                                                </li>
                                            </ul>
                                        </td>

                                        {visibleDates.map((visibleDate) => {
                                            const day = ((visibleDate.getDay() +
                                                6) %
                                                7) as DayOfWeek;
                                            const daySlots = timetable
                                                ? getWorkingSlots(
                                                      timetable.slots,
                                                      day,
                                                  )
                                                : [];
                                            const dailyMinutes = timetable
                                                ? getDailyMinutes(
                                                      timetable.slots,
                                                      day,
                                                  )
                                                : 0;

                                            return (
                                                <td
                                                    key={`${employee.id}-${toIsoDate(
                                                        visibleDate,
                                                    )}`}
                                                    className="days timetable-employees-page__day"
                                                >
                                                    <Link
                                                        className="timetable-employees-page__day-link"
                                                        href={{
                                                            pathname:
                                                                '/settings/timetable/employees/[id]',
                                                            query: {
                                                                id: employee.id,
                                                                date: toIsoDate(
                                                                    visibleDate,
                                                                ),
                                                            },
                                                        }}
                                                    >
                                                        <div className="schedule-cell">
                                                            {daySlots.length >
                                                            0 ? (
                                                                <ul className="schedule-cell-list schedule-cell-list-full">
                                                                    {daySlots.map(
                                                                        (
                                                                            slot,
                                                                        ) => (
                                                                            <li
                                                                                key={`${slot.dayOfWeek}-${slot.startTime}-${slot.endTime}`}
                                                                                className="schedule-open"
                                                                            >
                                                                                {slot.startTime.slice(
                                                                                    0,
                                                                                    5,
                                                                                )}{' '}
                                                                                -{' '}
                                                                                {slot.endTime.slice(
                                                                                    0,
                                                                                    5,
                                                                                )}{' '}
                                                                                <span className="counter">
                                                                                    {formatHours(
                                                                                        timeToMinutes(
                                                                                            slot.endTime,
                                                                                        ) -
                                                                                            timeToMinutes(
                                                                                                slot.startTime,
                                                                                            ),
                                                                                    )}
                                                                                </span>
                                                                            </li>
                                                                        ),
                                                                    )}
                                                                    {daySlots.length >
                                                                    1 ? (
                                                                        <li className="timetable-employees-page__day-total">
                                                                            Razem{' '}
                                                                            {formatHours(
                                                                                dailyMinutes,
                                                                            )}
                                                                        </li>
                                                                    ) : null}
                                                                </ul>
                                                            ) : (
                                                                <div className="timetable-employees-page__day-off">
                                                                    dzień wolny
                                                                </div>
                                                            )}
                                                        </div>
                                                    </Link>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="timetable-employees-page__calendar-hint">
                    {kind === 'week'
                        ? `${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`
                        : `${DAY_SHORT[(date.getDay() + 6) % 7]} ${formatDate(
                              date,
                          )}`}
                </div>
            </div>
        </div>
    );
}

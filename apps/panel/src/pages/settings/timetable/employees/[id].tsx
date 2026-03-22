import Link from 'next/link';
import { useRouter } from 'next/router';
import { useMemo, useState } from 'react';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import { useEmployee, useStaffOptions } from '@/hooks/useEmployees';
import {
    useTimetables,
    useTimetableExceptions,
    useTimetableMutations,
} from '@/hooks/useTimetables';
import {
    ExceptionModal,
    ExceptionsList,
    TimetableEditor,
    type ExceptionFormData,
    type SlotData,
} from '@/components/timetables';
import type {
    DayOfWeek,
    Timetable,
    TimetableException,
    TimetableSlot,
} from '@/types';

const DAY_LABELS = [
    'poniedziałek',
    'wtorek',
    'środa',
    'czwartek',
    'piątek',
    'sobota',
    'niedziela',
] as const;

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

function addDays(date: Date, days: number) {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
}

function addMonths(date: Date, months: number) {
    const copy = new Date(date);
    copy.setMonth(copy.getMonth() + months);
    return copy;
}

function startOfIsoWeek(date: Date) {
    const copy = new Date(date);
    copy.setHours(12, 0, 0, 0);
    const day = (copy.getDay() + 6) % 7;
    copy.setDate(copy.getDate() - day);
    return copy;
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

function formatMonthLabel(date: Date) {
    return `${MONTH_LABELS[date.getMonth()]} ${date.getFullYear()}`;
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

function isWithinTimetableRange(timetable: Timetable, date: Date) {
    const current = toIsoDate(date);
    if (timetable.validFrom && current < timetable.validFrom) {
        return false;
    }
    if (timetable.validTo && current > timetable.validTo) {
        return false;
    }
    return true;
}

function getApplicableTimetable(timetables: Timetable[], date: Date) {
    return (
        [...timetables]
            .filter(
                (timetable) =>
                    timetable.isActive &&
                    isWithinTimetableRange(timetable, date),
            )
            .sort((a, b) => b.validFrom.localeCompare(a.validFrom))[0] ?? null
    );
}

function buildMonthWeeks(date: Date) {
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1, 12);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 12);
    const visibleStart = startOfIsoWeek(monthStart);
    const monthEndWeekStart = startOfIsoWeek(monthEnd);
    const visibleEnd = addDays(monthEndWeekStart, 6);

    const weeks: Date[][] = [];
    let cursor = visibleStart;

    while (cursor <= visibleEnd) {
        weeks.push(
            Array.from({ length: 7 }, (_, index) => addDays(cursor, index)),
        );
        cursor = addDays(cursor, 7);
    }

    return weeks;
}

function isExpired(validTo?: string) {
    if (!validTo) return false;
    return new Date(`${validTo}T23:59:59`).getTime() < Date.now();
}

function renderSlotState(daySlots: TimetableSlot[], day: Date) {
    if (daySlots.length > 0) {
        return (
            <ul className="schedule-cell-list schedule-cell-list-full">
                {daySlots.map((slot) => (
                    <li
                        key={`${slot.dayOfWeek}-${slot.startTime}-${slot.endTime}`}
                        className="schedule-open"
                    >
                        {slot.startTime.slice(0, 5)} -{' '}
                        {slot.endTime.slice(0, 5)}{' '}
                        <span className="counter">
                            {formatHours(
                                timeToMinutes(slot.endTime) -
                                    timeToMinutes(slot.startTime),
                            )}
                        </span>
                    </li>
                ))}
            </ul>
        );
    }

    return (
        <ul className="schedule-cell-list schedule-cell-list-empty">
            <li className="schedule-closed">
                <div className="icon_box">
                    <i
                        className={`icon ${day.getDay() === 0 ? 'sprite-schedule_inactive' : 'sprite-schedule_dayoff'} mr-xs `}
                    />
                </div>
                {day.getDay() === 0 ? 'Salon nieczynny' : 'Dzień wolny'}
            </li>
        </ul>
    );
}

export default function SettingsTimetableEmployeeDetailPage() {
    const router = useRouter();
    const id = router.query.id ? Number(router.query.id) : null;
    const date = parseDateParam(router.query.date);

    const { data: employee, isLoading: employeeLoading } = useEmployee(id);
    const { data: staffOptions } = useStaffOptions();
    const {
        data: allTimetables,
        loading: timetablesLoading,
        error: timetablesError,
        refetch,
    } = useTimetables();
    const employeeTimetables = useMemo(
        () =>
            allTimetables
                .filter((timetable) => timetable.employeeId === id)
                .sort((a, b) => a.validFrom.localeCompare(b.validFrom)),
        [allTimetables, id],
    );
    const activeTimetable = useMemo(
        () =>
            getApplicableTimetable(employeeTimetables, date) ??
            [...employeeTimetables]
                .reverse()
                .find((timetable) => timetable.isActive) ??
            null,
        [date, employeeTimetables],
    );

    const { data: exceptions = [] } = useTimetableExceptions(
        activeTimetable?.id ?? null,
    );
    const {
        createTimetable,
        updateTimetable,
        createException,
        updateException,
        deleteException,
        approveException,
    } = useTimetableMutations();

    const [editorOpen, setEditorOpen] = useState(false);
    const [exceptionModalOpen, setExceptionModalOpen] = useState(false);
    const [editingException, setEditingException] =
        useState<TimetableException | null>(null);

    const previousMonth = addMonths(date, -1);
    const nextMonth = addMonths(date, 1);
    const today = new Date();
    const todayActive =
        today.getMonth() === date.getMonth() &&
        today.getFullYear() === date.getFullYear();
    const visibleWeeks = useMemo(() => buildMonthWeeks(date), [date]);

    const timetableByEmployee = useMemo(() => {
        const map = new Map<number, Timetable>();
        [...allTimetables]
            .filter((timetable) => timetable.isActive)
            .sort((a, b) => b.validFrom.localeCompare(a.validFrom))
            .forEach((timetable) => {
                if (!map.has(timetable.employeeId)) {
                    map.set(timetable.employeeId, timetable);
                }
            });
        return map;
    }, [allTimetables]);

    const secondaryNav = (
        <div className="sidenav" id="sidenav">
            <div className="column_row">
                <h4>Grafiki pracowników</h4>
                <div className="tree users-list">
                    <Link
                        className="root"
                        href={{
                            pathname: '/settings/timetable/employees',
                            query: { date: toIsoDate(date), kind: 'week' },
                        }}
                    >
                        <div className="icon_box">
                            <i className="icon sprite-filter_handled_employees " />
                        </div>
                        Wszyscy pracownicy
                    </Link>
                    <ul>
                        {(staffOptions ?? []).map((option) => {
                            const timetable = timetableByEmployee.get(
                                option.id,
                            );
                            const expired = isExpired(timetable?.validTo);

                            return (
                                <li
                                    key={option.id}
                                    className={option.id === id ? 'active' : ''}
                                >
                                    <Link
                                        className={
                                            option.id === id ? 'active' : ''
                                        }
                                        href={{
                                            pathname:
                                                '/settings/timetable/employees/[id]',
                                            query: {
                                                id: option.id,
                                                date: toIsoDate(date),
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
    );

    useSetSecondaryNav(secondaryNav);

    const handleSaveSchedule = async (slots: SlotData[]) => {
        if (!id) return;

        if (activeTimetable) {
            await updateTimetable.mutateAsync({
                id: activeTimetable.id,
                slots,
            });
            return;
        }

        await createTimetable.mutateAsync({
            employeeId: id,
            name: `Grafik - ${employee?.name ?? 'pracownik'}`,
            validFrom: toIsoDate(date),
            slots,
        });
    };

    const handleSaveException = async (data: ExceptionFormData) => {
        if (!activeTimetable) return;

        if (editingException) {
            await updateException.mutateAsync({
                id: editingException.id,
                ...data,
            });
            return;
        }

        await createException.mutateAsync({
            timetableId: activeTimetable.id,
            ...data,
        });
    };

    const handleDeleteException = async (exceptionId: number) => {
        if (window.confirm('Czy na pewno chcesz usunąć ten wyjątek?')) {
            await deleteException.mutateAsync(exceptionId);
        }
    };

    if (employeeLoading || timetablesLoading) {
        return (
            <div className="settings-detail-state">Ładowanie grafiku...</div>
        );
    }

    if (timetablesError || !employee || !id) {
        return (
            <div className="settings-detail-state settings-detail-state--error">
                <div>Nie udało się pobrać grafiku pracownika.</div>
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
        <div className="settings-detail-layout" data-testid="settings-detail">
            <aside className="settings-detail-layout__sidebar">
                {secondaryNav}
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
                            <Link href="/settings/timetable/employees">
                                Grafiki pracowników
                            </Link>
                        </li>
                        <li>
                            <span> / </span>
                            {employee.name}
                        </li>
                    </ul>
                </div>

                <div className="inner">
                    <div className="column_row top_row timetable-employee-detail__top">
                        <div className="date">
                            <div className="button-group">
                                <Link
                                    className="button"
                                    href={{
                                        pathname:
                                            '/settings/timetable/employees/[id]',
                                        query: {
                                            id,
                                            date: toIsoDate(previousMonth),
                                        },
                                    }}
                                >
                                    <span className="fc-icon fc-icon-left-single-arrow" />
                                </Link>
                                <Link
                                    className="button"
                                    href={{
                                        pathname:
                                            '/settings/timetable/employees/[id]',
                                        query: {
                                            id,
                                            date: toIsoDate(nextMonth),
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
                                        value={formatMonthLabel(date)}
                                        readOnly
                                    />
                                </div>
                            </div>
                            <div className="inline_block">
                                <Link
                                    className={
                                        todayActive
                                            ? 'button disabled'
                                            : 'button'
                                    }
                                    href={{
                                        pathname:
                                            '/settings/timetable/employees/[id]',
                                        query: {
                                            id,
                                            date: toIsoDate(today),
                                        },
                                    }}
                                >
                                    Dzisiaj
                                </Link>
                            </div>
                        </div>

                        <div className="buttons">
                            <Link
                                href={`/settings/employees/${id}`}
                                className="button"
                            >
                                powrót do pracownika
                            </Link>
                        </div>
                        <div className="c" />
                    </div>

                    <div className="column_row calendar-body">
                        <table className="month-table timetable-employee-detail__table">
                            <thead>
                                <tr>
                                    <th />
                                    {DAY_LABELS.map((label) => (
                                        <th key={label}>{label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {visibleWeeks.map((week) => {
                                    const weekStart = week[0]!;
                                    const totalMinutes = week.reduce(
                                        (sum, day) => {
                                            const timetable =
                                                getApplicableTimetable(
                                                    employeeTimetables,
                                                    day,
                                                );
                                            if (!timetable) {
                                                return sum;
                                            }

                                            const dayOfWeek = ((day.getDay() +
                                                6) %
                                                7) as DayOfWeek;
                                            return (
                                                sum +
                                                getDailyMinutes(
                                                    timetable.slots,
                                                    dayOfWeek,
                                                )
                                            );
                                        },
                                        0,
                                    );

                                    return (
                                        <tr
                                            key={toIsoDate(weekStart)}
                                            className="schedule-row"
                                        >
                                            <td className="timetable-employee-detail__week">
                                                <ul className="schedule-settings">
                                                    <li
                                                        className="name"
                                                        title={employee.name}
                                                    >
                                                        <Link
                                                            className="inverse_decoration blue_text"
                                                            href={{
                                                                pathname:
                                                                    '/settings/timetable/employees',
                                                                query: {
                                                                    date: toIsoDate(
                                                                        weekStart,
                                                                    ),
                                                                    kind: 'week',
                                                                },
                                                            }}
                                                        >
                                                            {getIsoWeek(
                                                                weekStart,
                                                            )}{' '}
                                                            tydzień
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <span className="counter counter-slim">
                                                            {formatHours(
                                                                totalMinutes,
                                                            )}
                                                        </span>
                                                    </li>
                                                    <li className="schedule-edit">
                                                        <button
                                                            type="button"
                                                            className="timetable-employees-page__link-button"
                                                            onClick={() =>
                                                                setEditorOpen(
                                                                    true,
                                                                )
                                                            }
                                                        >
                                                            Edytuj
                                                        </button>
                                                    </li>
                                                </ul>
                                            </td>

                                            {week.map((day) => {
                                                const timetable =
                                                    getApplicableTimetable(
                                                        employeeTimetables,
                                                        day,
                                                    );
                                                const dayOfWeek =
                                                    ((day.getDay() + 6) %
                                                        7) as DayOfWeek;
                                                const daySlots = timetable
                                                    ? getWorkingSlots(
                                                          timetable.slots,
                                                          dayOfWeek,
                                                      )
                                                    : [];

                                                return (
                                                    <td
                                                        key={toIsoDate(day)}
                                                        className="days timetable-employee-detail__day"
                                                    >
                                                        <div className="schedule-cell">
                                                            <span className="date">
                                                                {formatDate(
                                                                    day,
                                                                )}
                                                            </span>
                                                            {renderSlotState(
                                                                daySlots,
                                                                day,
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="timetable-employee-detail__workspace">
                        <div className="timetable-employee-detail__workspace-main">
                            <div className="timetable-employee-detail__card">
                                <div className="timetable-employee-detail__card-head">
                                    <div>
                                        <h3>Grafik tygodniowy</h3>
                                        <p>
                                            Zapis dotyczy powtarzalnego grafiku
                                            pracownika dla aktywnego okresu.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={() =>
                                            setEditorOpen((current) => !current)
                                        }
                                    >
                                        {editorOpen
                                            ? 'ukryj edytor'
                                            : 'edytuj grafik'}
                                    </button>
                                </div>

                                {editorOpen ? (
                                    <TimetableEditor
                                        timetable={activeTimetable}
                                        onSave={handleSaveSchedule}
                                        saving={
                                            createTimetable.isPending ||
                                            updateTimetable.isPending
                                        }
                                    />
                                ) : (
                                    <div className="timetable-employee-detail__card-placeholder">
                                        Widok miesięczny odwzorowuje grafik z
                                        dumpa, a edycję możesz otworzyć
                                        przyciskiem powyżej.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="timetable-employee-detail__workspace-side">
                            <div className="timetable-employee-detail__card">
                                <div className="timetable-employee-detail__card-head">
                                    <div>
                                        <h3>Wyjątki i nieobecności</h3>
                                        <p>
                                            Urlopy, dni wolne i zmienione
                                            godziny dla aktywnego grafiku.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className="btn btn-default"
                                        disabled={!activeTimetable}
                                        onClick={() => {
                                            setEditingException(null);
                                            setExceptionModalOpen(true);
                                        }}
                                    >
                                        dodaj wyjątek
                                    </button>
                                </div>

                                {!activeTimetable ? (
                                    <div className="timetable-employee-detail__card-placeholder">
                                        Zapisz najpierw grafik tygodniowy, aby
                                        dodać wyjątki.
                                    </div>
                                ) : (
                                    <ExceptionsList
                                        exceptions={exceptions}
                                        onEdit={(exception) => {
                                            setEditingException(exception);
                                            setExceptionModalOpen(true);
                                        }}
                                        onDelete={handleDeleteException}
                                        onApprove={(exceptionId) => {
                                            void approveException.mutateAsync(
                                                exceptionId,
                                            );
                                        }}
                                        canApprove
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ExceptionModal
                isOpen={exceptionModalOpen}
                exception={editingException}
                onClose={() => {
                    setExceptionModalOpen(false);
                    setEditingException(null);
                }}
                onSave={handleSaveException}
            />
        </div>
    );
}

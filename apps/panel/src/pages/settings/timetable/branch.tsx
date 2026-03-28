import Link from 'next/link';
import {
    useEffect,
    useMemo,
    useState,
    type ChangeEvent,
    type FormEvent,
} from 'react';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import { useAuth } from '@/contexts/AuthContext';
import {
    useBranches,
    useBranchesMutations,
    useMyPrimaryBranch,
} from '@/hooks/useBranches';
import type { Branch, WorkingHoursValue } from '@/types';

const TIMETABLE_NAV = (
    <div className="sidenav" id="sidenav">
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
    { key: 'mon', label: 'poniedziałek' },
    { key: 'tue', label: 'wtorek' },
    { key: 'wed', label: 'środa' },
    { key: 'thu', label: 'czwartek' },
    { key: 'fri', label: 'piątek' },
    { key: 'sat', label: 'sobota' },
    { key: 'sun', label: 'niedziela' },
] as const;

type DayKey = (typeof DAYS)[number]['key'];

type TimeRangeDraft = {
    open: string;
    close: string;
};

type BranchHoursDraft = Record<DayKey, TimeRangeDraft[]>;

const DEFAULT_DRAFT: BranchHoursDraft = {
    mon: [{ open: '09:00', close: '18:00' }],
    tue: [{ open: '09:00', close: '18:00' }],
    wed: [{ open: '09:00', close: '18:00' }],
    thu: [{ open: '09:00', close: '18:00' }],
    fri: [{ open: '09:00', close: '18:00' }],
    sat: [{ open: '10:00', close: '14:00' }],
    sun: [],
};

const TIME_OPTIONS = Array.from({ length: 65 }, (_, index) => {
    const totalMinutes = 6 * 60 + index * 15;
    const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const minutes = String(totalMinutes % 60).padStart(2, '0');
    return `${hours}:${minutes}`;
});

function cloneDefaultDraft(): BranchHoursDraft {
    return DAYS.reduce<BranchHoursDraft>((draft, day) => {
        draft[day.key] = DEFAULT_DRAFT[day.key].map((range) => ({ ...range }));
        return draft;
    }, {} as BranchHoursDraft);
}

function normalizeWorkingHoursRanges(value?: WorkingHoursValue | null) {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
}

function toDraft(
    workingHours?: Record<string, WorkingHoursValue | null> | null,
) {
    return DAYS.reduce<BranchHoursDraft>((draft, day) => {
        const current = normalizeWorkingHoursRanges(workingHours?.[day.key]);
        draft[day.key] =
            current.length > 0
                ? current.map((range) => ({
                      open: range.open.slice(0, 5),
                      close: range.close.slice(0, 5),
                  }))
                : cloneDefaultDraft()[day.key];
        return draft;
    }, cloneDefaultDraft());
}

function buildWorkingHours(draft: BranchHoursDraft) {
    return DAYS.reduce<Record<string, WorkingHoursValue | null>>(
        (result, day) => {
            const current = draft[day.key];
            result[day.key] =
                current.length === 0
                    ? null
                    : current.length === 1
                      ? {
                            open: current[0].open,
                            close: current[0].close,
                        }
                      : current.map((range) => ({
                            open: range.open,
                            close: range.close,
                        }));
            return result;
        },
        {},
    );
}

function createDefaultRange(day: DayKey): TimeRangeDraft {
    const fallback = DEFAULT_DRAFT[day][0];
    return fallback ? { ...fallback } : { open: '09:00', close: '18:00' };
}

function hasOverlap(ranges: TimeRangeDraft[]) {
    const sorted = [...ranges].sort((a, b) => a.open.localeCompare(b.open));
    return sorted.some((range, index) => {
        const next = sorted[index + 1];
        return Boolean(next && range.close > next.open);
    });
}

function getValidationMessage(draft: BranchHoursDraft) {
    for (const day of DAYS) {
        const current = draft[day.key];
        if (current.some((range) => range.open >= range.close)) {
            return 'Godzina zamknięcia musi być późniejsza niż godzina otwarcia.';
        }
        if (hasOverlap(current)) {
            return 'Zakresy godzin otwarcia nie mogą na siebie nachodzić.';
        }
    }
    return null;
}

function isDayOpen(ranges: TimeRangeDraft[]) {
    return ranges.length > 0;
}

function getNextRange(day: DayKey, ranges: TimeRangeDraft[]) {
    const lastRange = ranges[ranges.length - 1];
    if (!lastRange) {
        return createDefaultRange(day);
    }

    const lastCloseIndex = TIME_OPTIONS.indexOf(lastRange.close);
    const nextOpenIndex = Math.max(lastCloseIndex, 0);
    const nextCloseIndex = Math.min(nextOpenIndex + 4, TIME_OPTIONS.length - 1);

    return {
        open: TIME_OPTIONS[nextOpenIndex] ?? lastRange.close,
        close: TIME_OPTIONS[nextCloseIndex] ?? lastRange.close,
    };
}

export default function SettingsTimetableBranchPage() {
    const { role } = useAuth();
    useSetSecondaryNav(TIMETABLE_NAV);

    const {
        data: primaryBranch,
        isLoading: isLoadingPrimary,
        isError: isPrimaryError,
        error: primaryError,
        refetch: refetchPrimary,
    } = useMyPrimaryBranch();
    const {
        data: branches,
        isLoading: isLoadingBranches,
        isError: isBranchesError,
        error: branchesError,
        refetch: refetchBranches,
    } = useBranches({ status: 'active' });
    const { updateBranch } = useBranchesMutations();

    const branch = useMemo<Branch | null>(() => {
        return primaryBranch ?? branches?.[0] ?? null;
    }, [branches, primaryBranch]);
    const [draft, setDraft] = useState<BranchHoursDraft>(cloneDefaultDraft());
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        if (!branch) return;
        setDraft(toDraft(branch.workingHours));
        setIsSaved(false);
    }, [branch]);

    const isLoading = isLoadingPrimary || isLoadingBranches;
    const loadError = primaryError ?? branchesError;
    const isError = !branch && (isPrimaryError || isBranchesError);
    const validationError = getValidationMessage(draft);
    const submitError =
        updateBranch.isError && updateBranch.error instanceof Error
            ? updateBranch.error.message
            : updateBranch.isError
              ? 'Nie udało się zapisać godzin otwarcia.'
              : null;

    const handleOpenToggle = (day: DayKey) => {
        setDraft((current) => ({
            ...current,
            [day]: isDayOpen(current[day]) ? [] : [createDefaultRange(day)],
        }));
        setIsSaved(false);
    };

    const handleTimeChange =
        (day: DayKey, rangeIndex: number, field: 'open' | 'close') =>
        (event: ChangeEvent<HTMLSelectElement>) => {
            const value = event.target.value;
            setDraft((current) => ({
                ...current,
                [day]: current[day].map((range, index) =>
                    index === rangeIndex ? { ...range, [field]: value } : range,
                ),
            }));
            setIsSaved(false);
        };

    const handleAddRange = (day: DayKey) => {
        setDraft((current) => ({
            ...current,
            [day]: [...current[day], getNextRange(day, current[day])],
        }));
        setIsSaved(false);
    };

    const handleRemoveRange = (day: DayKey, rangeIndex: number) => {
        setDraft((current) => ({
            ...current,
            [day]: current[day].filter((_, index) => index !== rangeIndex),
        }));
        setIsSaved(false);
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!branch || validationError) return;

        setIsSaved(false);

        try {
            await updateBranch.mutateAsync({
                id: branch.id,
                workingHours: buildWorkingHours(draft),
            });
            setIsSaved(true);
        } catch {
            setIsSaved(false);
        }
    };

    if (!role) return null;

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <SalonShell role={role}>
                <div
                    className="settings-detail-layout"
                    data-testid="settings-detail"
                >
                    <aside className="settings-detail-layout__sidebar">
                        {TIMETABLE_NAV}
                    </aside>
                    <div className="settings-detail-layout__main">
                        <SalonBreadcrumbs
                            iconClass="sprite-breadcrumbs_settings"
                            items={[
                                { label: 'Ustawienia', href: '/settings' },
                                { label: 'Grafiki pracy' },
                                { label: 'Salon' },
                            ]}
                        />

                        <div className="settings-calendar-page settings-timetable-branch-page">
                            <div className="settings-calendar-page__panel">
                                <ul className="tab_list">
                                    <li className="active tab">
                                        <Link href="/settings/timetable/branch">
                                            <div className="icon_box">
                                                <i className="icon sprite-group_today" />
                                            </div>
                                            Godziny otwarcia
                                        </Link>
                                    </li>
                                    <li className="tab">
                                        <Link href="/settings/calendar">
                                            <div className="icon_box">
                                                <i className="icon sprite-customer_history_visits" />
                                            </div>
                                            Kalendarz
                                        </Link>
                                    </li>
                                    <li className="tab">
                                        <Link href="/settings/timetable/employees">
                                            <div className="icon_box">
                                                <i className="icon sprite-schedule_employees mr-xs" />
                                            </div>
                                            Dostępność pracowników
                                        </Link>
                                    </li>
                                </ul>
                            </div>

                            {isLoading ? (
                                <div className="settings-detail-state">
                                    Ładowanie godzin otwarcia...
                                </div>
                            ) : null}

                            {isError ? (
                                <div className="settings-detail-state settings-detail-state--error">
                                    <p>
                                        {loadError instanceof Error
                                            ? loadError.message
                                            : 'Nie udało się pobrać godzin otwarcia.'}
                                    </p>
                                    <button
                                        type="button"
                                        className="btn btn-default"
                                        onClick={() => {
                                            void refetchPrimary();
                                            void refetchBranches();
                                        }}
                                    >
                                        spróbuj ponownie
                                    </button>
                                </div>
                            ) : null}

                            {!isLoading && !isError && !branch ? (
                                <div className="settings-detail-state settings-detail-state--empty">
                                    Brak aktywnego salonu do skonfigurowania.
                                </div>
                            ) : null}

                            {branch ? (
                                <div className="settings-calendar-page__panel">
                                    <form
                                        className="settings-timetable-branch-form"
                                        onSubmit={(event) =>
                                            void handleSubmit(event)
                                        }
                                    >
                                        <div className="column_row">
                                            <h2>Domyślne godziny otwarcia</h2>
                                        </div>
                                        <div className="settings-timetable-branch-form__note">
                                            <span className="light_text smaller">
                                                możesz zdefiniować wyjątki w
                                                zakładce{' '}
                                                <Link href="/settings/calendar">
                                                    Kalendarz
                                                </Link>
                                            </span>
                                        </div>

                                        {validationError ? (
                                            <div className="settings-detail-state settings-detail-state--error">
                                                {validationError}
                                            </div>
                                        ) : null}

                                        {submitError ? (
                                            <div className="settings-detail-state settings-detail-state--error">
                                                {submitError}
                                            </div>
                                        ) : null}

                                        {isSaved ? (
                                            <div className="settings-detail-state">
                                                Godziny otwarcia zostały
                                                zapisane.
                                            </div>
                                        ) : null}

                                        <div className="settings-timetable-branch-form__days">
                                            {DAYS.map((day) => {
                                                const ranges = draft[day.key];
                                                const open = isDayOpen(ranges);

                                                return (
                                                    <div
                                                        key={day.key}
                                                        className="schedule-period"
                                                    >
                                                        <div className="calendar-weekday-col">
                                                            {day.label}
                                                        </div>
                                                        <div className="calendar-form-col">
                                                            {ranges.map(
                                                                (
                                                                    range,
                                                                    rangeIndex,
                                                                ) => (
                                                                    <div
                                                                        key={`${day.key}-${rangeIndex}`}
                                                                        className="column_row"
                                                                    >
                                                                        <div className="column column-working">
                                                                            {rangeIndex ===
                                                                            0 ? (
                                                                                <label>
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={
                                                                                            open
                                                                                        }
                                                                                        onChange={() =>
                                                                                            handleOpenToggle(
                                                                                                day.key,
                                                                                            )
                                                                                        }
                                                                                    />{' '}
                                                                                    Otwarte
                                                                                </label>
                                                                            ) : (
                                                                                <span className="light_text smaller">
                                                                                    dodatkowy
                                                                                    zakres
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="column column-valid-times">
                                                                            <span>
                                                                                &nbsp;od&nbsp;
                                                                            </span>
                                                                            <select
                                                                                className="schedule-time"
                                                                                value={
                                                                                    range.open
                                                                                }
                                                                                onChange={handleTimeChange(
                                                                                    day.key,
                                                                                    rangeIndex,
                                                                                    'open',
                                                                                )}
                                                                            >
                                                                                {TIME_OPTIONS.map(
                                                                                    (
                                                                                        option,
                                                                                    ) => (
                                                                                        <option
                                                                                            key={
                                                                                                option
                                                                                            }
                                                                                            value={
                                                                                                option
                                                                                            }
                                                                                        >
                                                                                            {
                                                                                                option
                                                                                            }
                                                                                        </option>
                                                                                    ),
                                                                                )}
                                                                            </select>
                                                                            <span>
                                                                                &nbsp;do&nbsp;
                                                                            </span>
                                                                            <select
                                                                                className="schedule-time"
                                                                                value={
                                                                                    range.close
                                                                                }
                                                                                onChange={handleTimeChange(
                                                                                    day.key,
                                                                                    rangeIndex,
                                                                                    'close',
                                                                                )}
                                                                            >
                                                                                {TIME_OPTIONS.map(
                                                                                    (
                                                                                        option,
                                                                                    ) => (
                                                                                        <option
                                                                                            key={
                                                                                                option
                                                                                            }
                                                                                            value={
                                                                                                option
                                                                                            }
                                                                                        >
                                                                                            {
                                                                                                option
                                                                                            }
                                                                                        </option>
                                                                                    ),
                                                                                )}
                                                                            </select>
                                                                        </div>
                                                                        <div className="column column-period-actions">
                                                                            <div className="column-add-actions">
                                                                                {rangeIndex ===
                                                                                ranges.length -
                                                                                    1 ? (
                                                                                    <button
                                                                                        type="button"
                                                                                        className="button-link"
                                                                                        onClick={() =>
                                                                                            handleAddRange(
                                                                                                day.key,
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        Dodaj
                                                                                        zakres
                                                                                    </button>
                                                                                ) : null}
                                                                            </div>
                                                                            <div className="column-delete-period-action">
                                                                                {ranges.length >
                                                                                1 ? (
                                                                                    <button
                                                                                        type="button"
                                                                                        className="button-link"
                                                                                        onClick={() =>
                                                                                            handleRemoveRange(
                                                                                                day.key,
                                                                                                rangeIndex,
                                                                                            )
                                                                                        }
                                                                                    >
                                                                                        usuń
                                                                                    </button>
                                                                                ) : null}
                                                                            </div>
                                                                            <div className="clearfix" />
                                                                        </div>
                                                                    </div>
                                                                ),
                                                            )}

                                                            {!open ? (
                                                                <div className="column_row">
                                                                    <div className="column column-working">
                                                                        <label>
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={
                                                                                    open
                                                                                }
                                                                                onChange={() =>
                                                                                    handleOpenToggle(
                                                                                        day.key,
                                                                                    )
                                                                                }
                                                                            />{' '}
                                                                            Otwarte
                                                                        </label>
                                                                    </div>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="form-actions">
                                            <button
                                                type="submit"
                                                className="btn button-blue"
                                                disabled={
                                                    updateBranch.isPending ||
                                                    Boolean(validationError)
                                                }
                                            >
                                                {updateBranch.isPending
                                                    ? 'zapisywanie...'
                                                    : 'zapisz'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </SalonShell>
        </RouteGuard>
    );
}

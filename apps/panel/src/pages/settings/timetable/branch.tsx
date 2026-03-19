import Link from 'next/link';
import {
    useEffect,
    useMemo,
    useState,
    type ChangeEvent,
    type FormEvent,
} from 'react';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import {
    useBranches,
    useBranchesMutations,
    useMyPrimaryBranch,
} from '@/hooks/useBranches';
import type { Branch, WorkingHours } from '@/types';

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
    { key: 'mon', label: 'poniedziałek' },
    { key: 'tue', label: 'wtorek' },
    { key: 'wed', label: 'środa' },
    { key: 'thu', label: 'czwartek' },
    { key: 'fri', label: 'piątek' },
    { key: 'sat', label: 'sobota' },
    { key: 'sun', label: 'niedziela' },
] as const;

type DayKey = (typeof DAYS)[number]['key'];

type DayDraft = {
    isOpen: boolean;
    open: string;
    close: string;
};

type BranchHoursDraft = Record<DayKey, DayDraft>;

const DEFAULT_DRAFT: BranchHoursDraft = {
    mon: { isOpen: true, open: '09:00', close: '18:00' },
    tue: { isOpen: true, open: '09:00', close: '18:00' },
    wed: { isOpen: true, open: '09:00', close: '18:00' },
    thu: { isOpen: true, open: '09:00', close: '18:00' },
    fri: { isOpen: true, open: '09:00', close: '18:00' },
    sat: { isOpen: true, open: '10:00', close: '14:00' },
    sun: { isOpen: false, open: '10:00', close: '14:00' },
};

const TIME_OPTIONS = Array.from({ length: 65 }, (_, index) => {
    const totalMinutes = 6 * 60 + index * 15;
    const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
    const minutes = String(totalMinutes % 60).padStart(2, '0');
    return `${hours}:${minutes}`;
});

function toDraft(workingHours?: Record<string, WorkingHours | null> | null) {
    return DAYS.reduce<BranchHoursDraft>(
        (draft, day) => {
            const current = workingHours?.[day.key] ?? null;
            draft[day.key] = current
                ? {
                      isOpen: true,
                      open: current.open.slice(0, 5),
                      close: current.close.slice(0, 5),
                  }
                : DEFAULT_DRAFT[day.key];
            return draft;
        },
        { ...DEFAULT_DRAFT },
    );
}

function buildWorkingHours(draft: BranchHoursDraft) {
    return DAYS.reduce<Record<string, WorkingHours | null>>((result, day) => {
        const current = draft[day.key];
        result[day.key] = current.isOpen
            ? {
                  open: current.open,
                  close: current.close,
              }
            : null;
        return result;
    }, {});
}

function hasInvalidRange(draft: BranchHoursDraft) {
    return DAYS.some((day) => {
        const current = draft[day.key];
        return current.isOpen && current.open >= current.close;
    });
}

export default function SettingsTimetableBranchPage() {
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
    const [draft, setDraft] = useState<BranchHoursDraft>(DEFAULT_DRAFT);
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        if (!branch) return;
        setDraft(toDraft(branch.workingHours));
        setIsSaved(false);
    }, [branch]);

    const isLoading = isLoadingPrimary || isLoadingBranches;
    const loadError = primaryError ?? branchesError;
    const isError = !branch && (isPrimaryError || isBranchesError);
    const validationError = hasInvalidRange(draft)
        ? 'Godzina zamknięcia musi być późniejsza niż godzina otwarcia.'
        : null;
    const submitError =
        updateBranch.isError && updateBranch.error instanceof Error
            ? updateBranch.error.message
            : updateBranch.isError
              ? 'Nie udało się zapisać godzin otwarcia.'
              : null;

    const handleOpenToggle = (day: DayKey) => {
        setDraft((current) => ({
            ...current,
            [day]: {
                ...current[day],
                isOpen: !current[day].isOpen,
            },
        }));
        setIsSaved(false);
    };

    const handleTimeChange =
        (day: DayKey, field: 'open' | 'close') =>
        (event: ChangeEvent<HTMLSelectElement>) => {
            const value = event.target.value;
            setDraft((current) => ({
                ...current,
                [day]: {
                    ...current[day],
                    [field]: value,
                },
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
                                onSubmit={(event) => void handleSubmit(event)}
                            >
                                <div className="column_row">
                                    <h2>Domyślne godziny otwarcia</h2>
                                </div>
                                <div className="settings-timetable-branch-form__note">
                                    <span className="light_text smaller">
                                        możesz zdefiniować wyjątki w zakładce{' '}
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
                                        Godziny otwarcia zostały zapisane.
                                    </div>
                                ) : null}

                                <div className="settings-timetable-branch-form__days">
                                    {DAYS.map((day) => {
                                        const current = draft[day.key];
                                        return (
                                            <div
                                                key={day.key}
                                                className="schedule-period"
                                            >
                                                <div className="calendar-weekday-col">
                                                    {day.label}
                                                </div>
                                                <div className="calendar-form-col">
                                                    <div className="column_row">
                                                        <div className="column column-working">
                                                            <label>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={
                                                                        current.isOpen
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
                                                        <div className="column column-valid-times">
                                                            <span>
                                                                &nbsp;od&nbsp;
                                                            </span>
                                                            <select
                                                                className="schedule-time"
                                                                value={
                                                                    current.open
                                                                }
                                                                onChange={handleTimeChange(
                                                                    day.key,
                                                                    'open',
                                                                )}
                                                                disabled={
                                                                    !current.isOpen
                                                                }
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
                                                                    current.close
                                                                }
                                                                onChange={handleTimeChange(
                                                                    day.key,
                                                                    'close',
                                                                )}
                                                                disabled={
                                                                    !current.isOpen
                                                                }
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
                                                    </div>
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
    );
}

import Link from 'next/link';
import { Fragment, useEffect, useMemo, useState } from 'react';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import ConfirmModal from '@/components/ConfirmModal';
import { useStaffOptions } from '@/hooks/useEmployees';
import { useTimetables } from '@/hooks/useTimetables';
import {
    useTimetableTemplateMutations,
    useTimetableTemplates,
} from '@/hooks/useTimetableTemplates';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import type {
    DayOfWeek,
    TimetableTemplate,
    TimetableTemplateDayKind,
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
    const dayMap = getTemplateDayMap(template);
    return ([0, 1, 2, 3, 4, 5, 6] as DayOfWeek[]).reduce<number>((sum, day) => {
        const entry = dayMap[day];
        if (entry.kind !== 'open') return sum;
        const startTime = entry.startTime ?? '00:00';
        const endTime = entry.endTime ?? '00:00';
        return sum + (timeToMinutes(endTime) - timeToMinutes(startTime));
    }, 0);
}

function getDefaultTemplate(
    name: string,
    colorClass: TimetableTemplate['colorClass'],
): {
    name: string;
    colorClass: TimetableTemplate['colorClass'];
    days: Array<{
        dayOfWeek: DayOfWeek;
        kind: TimetableTemplateDayKind;
        startTime?: string;
        endTime?: string;
    }>;
} {
    return {
        name,
        colorClass,
        days: [
            {
                dayOfWeek: 0,
                kind: 'open',
                startTime: '10:00',
                endTime: '18:00',
            },
            {
                dayOfWeek: 1,
                kind: 'open',
                startTime: '10:00',
                endTime: '18:00',
            },
            {
                dayOfWeek: 2,
                kind: 'open',
                startTime: '10:00',
                endTime: '18:00',
            },
            {
                dayOfWeek: 3,
                kind: 'open',
                startTime: '10:00',
                endTime: '18:00',
            },
            {
                dayOfWeek: 4,
                kind: 'open',
                startTime: '10:00',
                endTime: '18:00',
            },
            { dayOfWeek: 5, kind: 'dayoff' },
            { dayOfWeek: 6, kind: 'closed' },
        ],
    };
}

function getTemplateDayMap(template: TimetableTemplate) {
    return template.days.reduce<
        Record<
            DayOfWeek,
            {
                kind: TimetableTemplateDayKind;
                startTime?: string;
                endTime?: string;
            }
        >
    >(
        (acc, day) => {
            acc[day.dayOfWeek] =
                day.kind === 'open'
                    ? {
                          kind: 'open',
                          startTime: day.startTime ?? '',
                          endTime: day.endTime ?? '',
                      }
                    : { kind: day.kind };
            return acc;
        },
        {
            0: { kind: 'closed' },
            1: { kind: 'closed' },
            2: { kind: 'closed' },
            3: { kind: 'closed' },
            4: { kind: 'closed' },
            5: { kind: 'closed' },
            6: { kind: 'closed' },
        },
    );
}

interface NameModalState {
    mode: 'add' | 'rename';
    value: string;
    renameId?: number;
}

export default function TimetableTemplatesPage() {
    const [notice, setNotice] = useState<string | null>(null);
    const [confirmDeleteTemplateId, setConfirmDeleteTemplateId] = useState<
        number | null
    >(null);
    const [nameModal, setNameModal] = useState<NameModalState | null>(null);
    const { data: staffOptions } = useStaffOptions();
    const { data: timetables } = useTimetables({ isActive: true });
    const {
        data: templates,
        loading,
        error,
        refetch,
    } = useTimetableTemplates();
    const { createTemplate, updateTemplate, deleteTemplate } =
        useTimetableTemplateMutations();
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

    useEffect(() => {
        if (!notice) return;
        const timeout = window.setTimeout(() => setNotice(null), 2500);
        return () => window.clearTimeout(timeout);
    }, [notice]);

    const secondaryNav = useMemo(() => {
        return (
            <div className="sidenav" id="sidenav">
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
                            {staffNavItems.map((option) => {
                                const timetable = timetableNavMap.get(
                                    option.id,
                                );
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
    }, [staffNavItems, timetableNavMap]);

    useSetSecondaryNav(secondaryNav);

    const handleAdd = () => {
        setNameModal({ mode: 'add', value: 'Nowy szablon' });
    };

    const handleRename = (id: number) => {
        const current = templates.find((template) => template.id === id);
        setNameModal({
            mode: 'rename',
            value: current?.name ?? '',
            renameId: id,
        });
    };

    const doNameModalConfirm = () => {
        if (!nameModal) return;
        const { mode, value, renameId } = nameModal;
        setNameModal(null);
        if (!value.trim()) return;
        if (mode === 'add') {
            const colorClass = `color${(
                (templates.length % 5) +
                1
            ).toString()}` as TimetableTemplate['colorClass'];
            void createTemplate
                .mutateAsync(getDefaultTemplate(value.trim(), colorClass))
                .then(() => setNotice('Dodano szablon grafiku.'))
                .catch((mutationError: unknown) => {
                    setNotice(
                        mutationError instanceof Error
                            ? mutationError.message
                            : 'Nie udało się dodać szablonu.',
                    );
                });
        } else if (renameId !== undefined) {
            void updateTemplate
                .mutateAsync({ id: renameId, name: value.trim() })
                .then(() => setNotice('Zmieniono nazwę szablonu.'))
                .catch((mutationError: unknown) => {
                    setNotice(
                        mutationError instanceof Error
                            ? mutationError.message
                            : 'Nie udało się zmienić nazwy szablonu.',
                    );
                });
        }
    };

    const handleDelete = (id: number) => {
        setConfirmDeleteTemplateId(id);
    };

    const doDelete = async (id: number) => {
        try {
            await deleteTemplate.mutateAsync(id);
            setNotice('Usunięto szablon grafiku.');
        } catch (mutationError) {
            setNotice(
                mutationError instanceof Error
                    ? mutationError.message
                    : 'Nie udało się usunąć szablonu.',
            );
        }
    };

    if (loading) {
        return (
            <div className="settings-detail-state">Ładowanie szablonów...</div>
        );
    }

    if (error) {
        return (
            <div className="settings-detail-state settings-detail-state--error">
                <div>Nie udało się pobrać szablonów grafików.</div>
                <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => void refetch()}
                >
                    odśwież
                </button>
            </div>
        );
    }

    return (
        <div className="timetable-templates-page">
            <SalonBreadcrumbs
                iconClass="sprite-breadcrumbs_settings"
                items={[
                    { label: 'Ustawienia', href: '/settings' },
                    {
                        label: 'Grafiki pracowników',
                        href: '/settings/timetable/employees',
                    },
                    { label: 'Szablony' },
                ]}
            />

            <div>
                <div className="column_row top_row">
                    <div className="buttons">
                        <button
                            type="button"
                            className="btn btn-primary"
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
                            {templates.map((template) => {
                                const dayMap = getTemplateDayMap(template);
                                return (
                                    <Fragment key={template.id}>
                                        <tr className="schedule-row">
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
                                                                    void handleDelete(
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
                                                [
                                                    0, 1, 2, 3, 4, 5, 6,
                                                ] as DayOfWeek[]
                                            ).map((day) => {
                                                const entry = dayMap[day];
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
                                                                        {entry.startTime ??
                                                                            '--:--'}{' '}
                                                                        -{' '}
                                                                        {entry.endTime ??
                                                                            '--:--'}{' '}
                                                                        <span className="counter">
                                                                            {formatHours(
                                                                                timeToMinutes(
                                                                                    entry.endTime ??
                                                                                        '00:00',
                                                                                ) -
                                                                                    timeToMinutes(
                                                                                        entry.startTime ??
                                                                                            '00:00',
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
                                    </Fragment>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={8}>
                                    <form
                                        className="pagination_container"
                                        action="/settings/timetable/templates"
                                    >
                                        <div className="row">
                                            <div className="infocol-7">
                                                Pozycje od 1 do{' '}
                                                {templates.length} z{' '}
                                                <span id="total_found">
                                                    {templates.length}
                                                </span>
                                            </div>
                                            <div className="form_paginationcol-5">
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
            <ConfirmModal
                open={confirmDeleteTemplateId !== null}
                title="Usuń szablon"
                message="Czy na pewno chcesz usunąć szablon grafiku?"
                confirmLabel="Usuń"
                confirmVariant="danger"
                onConfirm={() => {
                    if (confirmDeleteTemplateId === null) return;
                    const id = confirmDeleteTemplateId;
                    setConfirmDeleteTemplateId(null);
                    void doDelete(id);
                }}
                onCancel={() => setConfirmDeleteTemplateId(null)}
            />
            {nameModal !== null && (
                <div className="modal-backdrop fade in">
                    <div
                        className="modal-dialog"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Szablon grafiku"
                    >
                        <form
                            className="modal-content"
                            onSubmit={(e) => {
                                e.preventDefault();
                                doNameModalConfirm();
                            }}
                        >
                            <div className="modal-header">
                                <button
                                    type="button"
                                    className="close"
                                    onClick={() => setNameModal(null)}
                                    aria-label="Zamknij"
                                >
                                    <span aria-hidden="true">&times;</span>
                                </button>
                                <h4 className="modal-title">
                                    {nameModal.mode === 'add'
                                        ? 'Dodaj szablon'
                                        : 'Zmień nazwę szablonu'}
                                </h4>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label
                                        className="form-label"
                                        htmlFor="template-name-input"
                                    >
                                        Nazwa szablonu
                                    </label>
                                    <input
                                        id="template-name-input"
                                        className="form-control"
                                        autoFocus
                                        value={nameModal.value}
                                        onChange={(e) =>
                                            setNameModal({
                                                ...nameModal,
                                                value: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => setNameModal(null)}
                                >
                                    anuluj
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={!nameModal.value.trim()}
                                >
                                    {nameModal.mode === 'add'
                                        ? 'dodaj'
                                        : 'zapisz'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

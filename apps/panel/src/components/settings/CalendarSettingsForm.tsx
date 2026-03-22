import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import VersumBreadcrumbs from '@/components/salonbw/VersumBreadcrumbs';
import PanelActionBar from '@/components/ui/PanelActionBar';
import { useCalendarSettings, useSettingsMutations } from '@/hooks/useSettings';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import type { CalendarView, UpdateCalendarSettingsRequest } from '@/types';

type CalendarViewOption = 'month' | 'agendaWeek' | 'agendaDay' | 'reception';
const EMPTY_SECONDARY_NAV = <></>;

const DEFAULT_FORM: UpdateCalendarSettingsRequest = {
    defaultView: 'reception',
    defaultStartTime: '08:00',
    defaultEndTime: '21:00',
    firstVisibleHour: '09:00',
    timeSlotDuration: 15,
    daysWhileEditable: 1,
    customerNamingOrder: 'lastname',
};

const VISIBLE_FROM_OPTIONS = Array.from(
    { length: 19 },
    (_, index) => `${String(index).padStart(2, '0')}:00`,
);
const VISIBLE_TO_OPTIONS = Array.from(
    { length: 17 },
    (_, index) => `${String(index + 8).padStart(2, '0')}:00`,
).concat('24:00');
const FIRST_VISIBLE_OPTIONS = Array.from(
    { length: 15 },
    (_, index) => `${String(index + 6).padStart(2, '0')}:00`,
);
const SLOT_LENGTH_OPTIONS = [5, 10, 15, 20, 30] as const;
const DAYS_LIMIT_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 14, 21, 30] as const;

function normalizeTime(value: string | null | undefined, fallback: string) {
    if (!value) return fallback;
    return value.slice(0, 5);
}

function isPresetDaysLimit(value: number) {
    return DAYS_LIMIT_OPTIONS.some((option) => option === value);
}

function toRouteView(value: CalendarView | undefined): CalendarViewOption {
    switch (value) {
        case 'month':
            return 'month';
        case 'week':
            return 'agendaWeek';
        case 'day':
            return 'agendaDay';
        case 'reception':
        default:
            return 'reception';
    }
}

function toApiView(value: CalendarViewOption): CalendarView {
    switch (value) {
        case 'month':
            return 'month';
        case 'agendaWeek':
            return 'week';
        case 'agendaDay':
            return 'day';
        case 'reception':
        default:
            return 'reception';
    }
}

export default function CalendarSettingsForm() {
    const { data: settings, isLoading, error, refetch } = useCalendarSettings();
    const { updateCalendarSettings } = useSettingsMutations();
    const [viewValue, setViewValue] = useState<CalendarViewOption>('reception');
    const [formData, setFormData] =
        useState<UpdateCalendarSettingsRequest>(DEFAULT_FORM);
    const [customDaysValue, setCustomDaysValue] = useState('40');
    const [saved, setSaved] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    useSetSecondaryNav(EMPTY_SECONDARY_NAV);

    useEffect(() => {
        if (!settings) return;

        setFormData({
            defaultView: settings.defaultView,
            defaultStartTime: normalizeTime(settings.defaultStartTime, '08:00'),
            defaultEndTime: normalizeTime(settings.defaultEndTime, '21:00'),
            firstVisibleHour: normalizeTime(settings.firstVisibleHour, '09:00'),
            timeSlotDuration: settings.timeSlotDuration,
            daysWhileEditable: settings.daysWhileEditable,
            customerNamingOrder: settings.customerNamingOrder,
        });
        setViewValue(toRouteView(settings.defaultView));
        if (
            typeof settings.daysWhileEditable === 'number' &&
            !isPresetDaysLimit(settings.daysWhileEditable)
        ) {
            setCustomDaysValue(String(settings.daysWhileEditable));
        } else {
            setCustomDaysValue('40');
        }
    }, [settings]);

    const isCustomDaysMode = useMemo(() => {
        const days = formData.daysWhileEditable;
        return typeof days === 'number' && !isPresetDaysLimit(days);
    }, [formData.daysWhileEditable]);

    const handleSelectChange =
        <K extends keyof UpdateCalendarSettingsRequest>(key: K) =>
        (event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
            const rawValue = event.target.value;
            const value =
                key === 'timeSlotDuration' || key === 'daysWhileEditable'
                    ? Number.parseInt(rawValue, 10) || 0
                    : rawValue;

            setFormData((current) => ({
                ...current,
                [key]: value,
            }));
            setSaved(false);
            setSubmitError(null);
        };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setSubmitError(null);

        const payload: UpdateCalendarSettingsRequest = {
            ...formData,
            defaultView: toApiView(viewValue),
            daysWhileEditable: isCustomDaysMode
                ? Number.parseInt(customDaysValue, 10) || 0
                : formData.daysWhileEditable,
        };

        try {
            await updateCalendarSettings.mutateAsync(payload);
            setSaved(true);
        } catch {
            setSubmitError('Nie udało się zapisać ustawień kalendarza.');
        }
    };

    if (isLoading) {
        return (
            <div className="settings-detail-state">Ładowanie ustawień...</div>
        );
    }

    if (error) {
        return (
            <div className="settings-detail-state settings-detail-state--error">
                <div>Nie udało się pobrać ustawień kalendarza.</div>
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
        <div className="settings-calendar-page">
            <VersumBreadcrumbs
                iconClass="sprite-breadcrumbs_settings"
                items={[
                    { label: 'Ustawienia', href: '/settings' },
                    { label: 'Kalendarz' },
                ]}
            />

            <div className="settings-calendar-page__panel">
                <ul className="tab_list">
                    <li className="active tab">
                        <Link href="/settings/calendar">
                            <div className="icon_box">
                                <i className="icon sprite-settings_calendar icon-up" />
                            </div>
                            Kalendarz
                        </Link>
                    </li>
                    <li className="tab">
                        <Link href="/settings/tags">
                            <div className="icon_box">
                                <i className="icon sprite-settings_label_visits icon-up" />
                            </div>
                            Etykiety wizyt
                        </Link>
                    </li>
                </ul>
            </div>

            <div className="settings-calendar-page__panel">
                <form
                    className="simple_form edit_setting"
                    onSubmit={(event) => void handleSubmit(event)}
                >
                    <ol>
                        <li className="control-group">
                            <label
                                className="select optional control-label"
                                htmlFor="setting-calendar-default-view"
                            >
                                Domyślny widok kalendarza
                            </label>
                            <div className="controls">
                                <select
                                    id="setting-calendar-default-view"
                                    className="select optional medium"
                                    value={viewValue}
                                    onChange={(event) => {
                                        setViewValue(
                                            event.target
                                                .value as CalendarViewOption,
                                        );
                                        setSaved(false);
                                    }}
                                >
                                    <option value="month">miesięczny</option>
                                    <option value="agendaWeek">
                                        tygodniowy
                                    </option>
                                    <option value="agendaDay">dzienny</option>
                                    <option value="reception">recepcji</option>
                                </select>
                            </div>
                        </li>
                        <li className="control-group">
                            <label
                                className="select optional control-label"
                                htmlFor="setting-calendar-from"
                            >
                                Pokaż godziny od
                            </label>
                            <div className="controls">
                                <select
                                    id="setting-calendar-from"
                                    className="select optional small"
                                    value={formData.defaultStartTime ?? '08:00'}
                                    onChange={handleSelectChange(
                                        'defaultStartTime',
                                    )}
                                >
                                    {VISIBLE_FROM_OPTIONS.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </li>
                        <li className="control-group">
                            <label
                                className="select optional control-label"
                                htmlFor="setting-calendar-to"
                            >
                                Pokaż godziny do
                            </label>
                            <div className="controls">
                                <select
                                    id="setting-calendar-to"
                                    className="select optional small"
                                    value={formData.defaultEndTime ?? '21:00'}
                                    onChange={handleSelectChange(
                                        'defaultEndTime',
                                    )}
                                >
                                    {VISIBLE_TO_OPTIONS.map((option) => (
                                        <option key={option} value={option}>
                                            {option === '24:00'
                                                ? '00:00'
                                                : option}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </li>
                        <li className="control-group">
                            <label
                                className="select optional control-label"
                                htmlFor="setting-first-visible-hour"
                            >
                                Przewiń kalendarz do godziny
                            </label>
                            <div className="controls">
                                <select
                                    id="setting-first-visible-hour"
                                    className="select optional small"
                                    value={formData.firstVisibleHour ?? '09:00'}
                                    onChange={handleSelectChange(
                                        'firstVisibleHour',
                                    )}
                                >
                                    {FIRST_VISIBLE_OPTIONS.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </li>
                        <li className="control-group">
                            <label
                                className="string required control-label"
                                htmlFor="setting-slot-length"
                            >
                                Podział godziny
                            </label>
                            <div className="controls">
                                <select
                                    id="setting-slot-length"
                                    className="select optional"
                                    value={formData.timeSlotDuration ?? 15}
                                    onChange={handleSelectChange(
                                        'timeSlotDuration',
                                    )}
                                >
                                    {SLOT_LENGTH_OPTIONS.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                                <div className="info_tip ml-s">
                                    <span
                                        className="icon sprite-info_tip2"
                                        aria-hidden="true"
                                    />
                                </div>
                            </div>
                        </li>
                        <li className="control-group">
                            <label
                                className="select optional control-label"
                                htmlFor="setting-days-while-editable"
                            >
                                Ograniczenie wprowadzania zmian wstecz
                            </label>
                            <div className="controls settings-calendar-page__days-control">
                                {isCustomDaysMode ? (
                                    <input
                                        id="setting-days-while-editable"
                                        className="string optional small short"
                                        type="text"
                                        inputMode="numeric"
                                        value={customDaysValue}
                                        onChange={(event) => {
                                            setCustomDaysValue(
                                                event.target.value,
                                            );
                                            setSaved(false);
                                        }}
                                    />
                                ) : (
                                    <select
                                        id="setting-days-while-editable"
                                        className="select optional align-middle small"
                                        value={formData.daysWhileEditable ?? 1}
                                        onChange={(event) => {
                                            const selected = Number.parseInt(
                                                event.target.value,
                                                10,
                                            );
                                            if (selected === 40) {
                                                setFormData((current) => ({
                                                    ...current,
                                                    daysWhileEditable: 40,
                                                }));
                                                setCustomDaysValue('40');
                                            } else {
                                                handleSelectChange(
                                                    'daysWhileEditable',
                                                )(event);
                                            }
                                            setSaved(false);
                                        }}
                                    >
                                        {DAYS_LIMIT_OPTIONS.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                        <option value={40}>inny okres</option>
                                    </select>
                                )}
                                <span className="inline-hint">
                                    {' '}
                                    dni wstecz
                                    <br />
                                    Określ na ile dni wstecz możliwa jest edycja
                                    wizyt przez pracowników innych niż
                                    Administrator.
                                </span>
                            </div>
                        </li>
                        <li className="control-group">
                            <label
                                className="select optional control-label"
                                htmlFor="setting-customer-naming-order"
                            >
                                Kolejność wyświetlania danych klienta
                            </label>
                            <div className="controls">
                                <select
                                    id="setting-customer-naming-order"
                                    className="select optional medium"
                                    value={
                                        formData.customerNamingOrder ??
                                        'lastname'
                                    }
                                    onChange={handleSelectChange(
                                        'customerNamingOrder',
                                    )}
                                >
                                    <option value="firstname">
                                        Najpierw imię
                                    </option>
                                    <option value="lastname">
                                        Najpierw nazwisko
                                    </option>
                                </select>
                            </div>
                        </li>
                    </ol>

                    {submitError ? (
                        <div className="alert alert-danger">{submitError}</div>
                    ) : null}
                    {saved ? (
                        <div className="alert alert-success">
                            Ustawienia kalendarza zostały zapisane.
                        </div>
                    ) : null}

                    <PanelActionBar
                        primary={
                            <button
                                type="submit"
                                name="commit"
                                className="btn btn-primary"
                                disabled={updateCalendarSettings.isPending}
                            >
                                <span className="icon sprite-add_customer_save mr-xs" />
                                {updateCalendarSettings.isPending
                                    ? 'Przetwarzanie danych...'
                                    : 'zapisz ustawienia'}
                            </button>
                        }
                    />
                </form>
            </div>
        </div>
    );
}

import Head from 'next/head';
import { useState } from 'react';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { useCalendarSettings, useSettingsMutations } from '@/hooks/useSettings';
import type { CalendarSettings, UpdateCalendarSettingsRequest } from '@/types';

type ToggleKey =
    | 'allowOverlappingAppointments'
    | 'allowSameDayBooking'
    | 'allowClientReschedule'
    | 'reminderEnabled'
    | 'noshowPenaltyEnabled';

const FEATURES: { key: ToggleKey; label: string; desc: string }[] = [
    {
        key: 'allowOverlappingAppointments',
        label: 'Nakładanie wizyt',
        desc: 'Pozwól umawiać dwie wizyty w tym samym czasie (np. druga klientka w czasie farbowania). Rezerwacja online klienta nadal respektuje zajętość.',
    },
    {
        key: 'allowSameDayBooking',
        label: 'Rezerwacja tego samego dnia',
        desc: 'Klient może zarezerwować wizytę na dziś przez rezerwację online.',
    },
    {
        key: 'allowClientReschedule',
        label: 'Klient może prosić o zmianę terminu',
        desc: 'Pozwól klientowi wnioskować o przełożenie wizyty (akceptujesz w panelu).',
    },
    {
        key: 'reminderEnabled',
        label: 'Przypomnienia o wizytach',
        desc: 'Wysyłaj automatyczne przypomnienia przed wizytą.',
    },
    {
        key: 'noshowPenaltyEnabled',
        label: 'Kara za nieobecność (no-show)',
        desc: 'Naliczaj karę, gdy klient nie pojawi się na wizycie.',
    },
];

export default function FeaturesSettingsPage() {
    const { role } = useAuth();
    const { data: settings, isLoading, error } = useCalendarSettings();
    const { updateCalendarSettings } = useSettingsMutations();
    const [savingKey, setSavingKey] = useState<ToggleKey | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);

    const handleToggle = (key: ToggleKey, value: boolean) => {
        setSavingKey(key);
        setSaveError(null);
        void updateCalendarSettings
            .mutateAsync({ [key]: value } as UpdateCalendarSettingsRequest)
            .catch(() =>
                setSaveError('Nie udało się zapisać. Spróbuj ponownie.'),
            )
            .finally(() => setSavingKey(null));
    };

    return (
        <RouteGuard roles={['admin']} permission="nav:settings">
            <Head>
                <title>Funkcje — Salon Black &amp; White</title>
            </Head>
            <SalonShell role={role}>
                <div className="salonbw-page">
                    <SalonBreadcrumbs
                        iconClass="sprite-breadcrumbs_settings"
                        items={[
                            { label: 'Ustawienia', href: '/settings' },
                            { label: 'Funkcje' },
                        ]}
                    />
                    <div className="description">
                        <h2>Funkcje</h2>
                        <p className="text-muted">
                            Włączaj i wyłączaj funkcje aplikacji. Zmiany
                            zapisują się od razu.
                        </p>
                        {isLoading ? (
                            <p className="text-muted" role="status">
                                Ładowanie…
                            </p>
                        ) : error ? (
                            <p className="text-danger" role="alert">
                                Nie udało się pobrać ustawień.
                            </p>
                        ) : settings ? (
                            <div
                                className="d-flex flex-column gap-2"
                                style={{ maxWidth: 720 }}
                            >
                                {FEATURES.map((f) => {
                                    const checked = Boolean(
                                        (settings as CalendarSettings)[f.key],
                                    );
                                    return (
                                        <div
                                            key={f.key}
                                            className="d-flex align-items-start justify-content-between gap-3 p-3 border rounded bg-white"
                                        >
                                            <div>
                                                <label
                                                    htmlFor={`feat-${f.key}`}
                                                    className="fw-semibold d-block"
                                                >
                                                    {f.label}
                                                </label>
                                                <div className="text-muted small">
                                                    {f.desc}
                                                </div>
                                            </div>
                                            <div className="form-check form-switch flex-shrink-0">
                                                <input
                                                    id={`feat-${f.key}`}
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    role="switch"
                                                    checked={checked}
                                                    disabled={
                                                        savingKey === f.key
                                                    }
                                                    onChange={(e) =>
                                                        handleToggle(
                                                            f.key,
                                                            e.target.checked,
                                                        )
                                                    }
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                                {saveError && (
                                    <div
                                        className="text-danger small"
                                        role="alert"
                                    >
                                        {saveError}
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                </div>
            </SalonShell>
        </RouteGuard>
    );
}

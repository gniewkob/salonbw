import Link from 'next/link';
import { useEffect, useState } from 'react';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import { useSettingsMutations, useSmsSettings } from '@/hooks/useSettings';
import type { SmsSettings } from '@/types';

const COMMUNICATION_NAV = (
    <div className="sidenav" id="sidenav">
        <div className="column_row tree communication_settings">
            <h4>Ustawienia łączności</h4>
            <ul>
                <li>
                    <Link href="/settings/sms" className="active">
                        <div className="icon_box">
                            <span className="icon sprite-settings_sms_nav" />
                        </div>
                        Wiadomości SMS
                    </Link>
                </li>
                <li>
                    <Link href="/communication">
                        <div className="icon_box">
                            <span className="icon sprite-settings_notifications_nav" />
                        </div>
                        Komunikacja z klientami
                    </Link>
                </li>
            </ul>
        </div>
    </div>
);

export default function SmsSettingsPage() {
    const { data, isLoading, error, refetch } = useSmsSettings();
    const { updateSmsSettings } = useSettingsMutations();
    const [notice, setNotice] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [prefix, setPrefix] = useState('');

    useSetSecondaryNav(COMMUNICATION_NAV);

    useEffect(() => {
        if (data) setPrefix(data.defaultPrefix ?? '');
    }, [data]);

    const mutate = async (payload: Partial<SmsSettings>, ok?: string) => {
        setNotice(null);
        setSaving(true);
        try {
            await updateSmsSettings.mutateAsync(payload);
            if (ok) setNotice(ok);
        } catch {
            setNotice('Nie udało się zapisać ustawień SMS.');
        } finally {
            setSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="settings-detail-state">Ładowanie ustawień...</div>
        );
    }

    if (error || !data) {
        return (
            <div className="settings-detail-state settings-detail-state--error">
                <div>Nie udało się pobrać ustawień SMS.</div>
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
        <div className="sms-settings-page">
            <SalonBreadcrumbs
                iconClass="sprite-breadcrumbs_communication_set"
                items={[
                    { label: 'ustawienia', href: '/settings' },
                    { label: 'Łączność' },
                    { label: 'Wiadomości SMS' },
                ]}
            />

            <div style={{ maxWidth: 720 }}>
                <h2 className="fs-4 fw-bold mb-1">Konfiguracja SMS</h2>
                <p className="text-muted">
                    Ustawienia wysyłki wiadomości SMS do klientek.
                </p>

                <div className="alert alert-warning" role="status">
                    <strong>Wysyłka SMS wymaga konta SMSAPI.</strong> Token
                    bramki SMS ustawia się po stronie serwera (zmienna{' '}
                    <code>SMSAPI_TOKEN</code>). Po jego dodaniu SMS-y będą
                    wysyłane do klientek, które wyraziły zgodę na kanał SMS
                    (patrz „Zgody i prywatność”). Bez tokena poniższe ustawienia
                    są zapisywane, ale wiadomości nie wychodzą.
                </div>

                <div className="bg-white rounded-4 border shadow-sm p-4">
                    <div className="mb-3 pb-3 border-bottom d-flex justify-content-between align-items-start gap-3">
                        <div>
                            <div className="fw-medium">Numery zagraniczne</div>
                            <div className="text-muted small">
                                Zezwól na wysyłkę SMS na numery spoza Polski.
                            </div>
                        </div>
                        <button
                            type="button"
                            className={`btn btn-sm ${data.sendAbroad ? 'btn-dark' : 'btn-outline-secondary'}`}
                            disabled={saving}
                            onClick={() =>
                                void mutate({ sendAbroad: !data.sendAbroad })
                            }
                        >
                            {data.sendAbroad ? 'Włączone' : 'Wyłączone'}
                        </button>
                    </div>

                    <div className="mb-3 pb-3 border-bottom d-flex justify-content-between align-items-start gap-3">
                        <div>
                            <div className="fw-medium">Polskie znaki</div>
                            <div className="text-muted small">
                                Zachowaj polskie znaki (ą, ę, …). Ogranicza
                                pojedynczą wiadomość do 70 znaków.
                            </div>
                        </div>
                        <button
                            type="button"
                            className={`btn btn-sm ${data.utf ? 'btn-dark' : 'btn-outline-secondary'}`}
                            disabled={saving}
                            onClick={() => void mutate({ utf: !data.utf })}
                        >
                            {data.utf ? 'Włączone' : 'Wyłączone'}
                        </button>
                    </div>

                    <div>
                        <label
                            htmlFor="sms-prefix"
                            className="fw-medium d-block mb-1"
                        >
                            Domyślny prefix kraju
                        </label>
                        <div className="text-muted small mb-2">
                            Dodawany do numerów bez kierunkowego (np. +48 dla
                            Polski).
                        </div>
                        <div className="d-flex gap-2" style={{ maxWidth: 260 }}>
                            <input
                                id="sms-prefix"
                                className="form-control"
                                value={prefix}
                                placeholder="+48"
                                onChange={(e) => setPrefix(e.target.value)}
                            />
                            <button
                                type="button"
                                className="btn btn-dark"
                                disabled={
                                    saving ||
                                    prefix.trim() === (data.defaultPrefix ?? '')
                                }
                                onClick={() =>
                                    void mutate(
                                        { defaultPrefix: prefix.trim() },
                                        'Prefix zapisany.',
                                    )
                                }
                            >
                                Zapisz
                            </button>
                        </div>
                    </div>
                </div>

                {notice ? (
                    <div className="alert alert-info mt-3" role="status">
                        {notice}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

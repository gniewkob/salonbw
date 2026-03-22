import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import { useSettingsMutations, useSmsSettings } from '@/hooks/useSettings';
import type { SmsSettings, SmsType } from '@/types';

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
                    <span className="settings-detail-layout__nav-disabled">
                        <div className="icon_box">
                            <span className="icon sprite-settings_notifications_nav" />
                        </div>
                        Powiadomienia
                    </span>
                </li>
                <li>
                    <span className="settings-detail-layout__nav-disabled">
                        <div className="icon_box">
                            <span className="icon sprite-settings_phone_records_nav" />
                        </div>
                        Billing SMS
                    </span>
                </li>
            </ul>
        </div>
    </div>
);

type SmsTypeCardProps = {
    active: boolean;
    recommended?: boolean;
    title: string;
    price: string;
    description: string;
    features: Array<{ label: string; inaccessible?: boolean }>;
    onActivate?: () => void;
};

function SmsTypeCard({
    active,
    recommended = false,
    title,
    price,
    description,
    features,
    onActivate,
}: SmsTypeCardProps) {
    return (
        <div
            className={`sms-settings-page__type-card ${active ? 'sms-settings-page__type-card--active' : 'sms-settings-page__type-card--inactive'}`}
        >
            {recommended ? (
                <>
                    <div className="sms-settings-page__ribbon">polecany</div>
                    <div className="sms-settings-page__ribbon-shadow" />
                </>
            ) : null}
            <div className="sms-settings-page__type-title">{title}</div>
            <div className="sms-settings-page__type-price">{price}</div>
            <div className="sms-settings-page__type-desc">{description}</div>
            <ul className="sms-settings-page__feature-list">
                {features.map((feature) => (
                    <li
                        key={feature.label}
                        className={
                            feature.inaccessible
                                ? 'sms-settings-page__feature--disabled'
                                : undefined
                        }
                    >
                        {feature.label}
                    </li>
                ))}
            </ul>
            <div className="sms-settings-page__type-actions">
                {active ? (
                    <div className="sms-settings-page__status-active">
                        <div className="icon sprite-active_blue" />
                        <span>Aktywny</span>
                    </div>
                ) : (
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={onActivate}
                    >
                        Aktywuj
                    </button>
                )}
            </div>
        </div>
    );
}

export default function SmsSettingsPage() {
    const { data, isLoading, error, refetch } = useSmsSettings();
    const { updateSmsSettings } = useSettingsMutations();
    const [notice, setNotice] = useState<string | null>(null);
    const [pendingType, setPendingType] = useState<SmsType | null>(null);
    const [pendingFlag, setPendingFlag] = useState<'sendAbroad' | 'utf' | null>(
        null,
    );

    useSetSecondaryNav(COMMUNICATION_NAV);

    const currentType = data?.smsType ?? 'standard';
    const advancedDisabled = currentType === 'standard';

    const featureCards = useMemo(
        () => ({
            premium: [
                { label: 'Natychmiastowe doręczenie wiadomości' },
                { label: 'Natychmiastowe doręczenie odpowiedzi' },
                { label: 'Wiadomości masowe' },
                { label: 'Przypomnienia' },
                { label: 'Gwarantowane doręczenie odpowiedzi' },
                { label: 'Możliwość wykupienia nadpisu tekstowego' },
            ],
            standard: [
                { label: 'Doręczenie wiadomości - średnio 15 minut' },
                { label: 'Doręczenie odpowiedzi - średnio 15 minut' },
                { label: 'Wiadomości masowe' },
                { label: 'Przypomnienia' },
                {
                    label: 'Gwarantowane doręczenie odpowiedzi',
                    inaccessible: true,
                },
                {
                    label: 'Możliwość wykupienia nadpisu tekstowego',
                    inaccessible: true,
                },
            ],
        }),
        [],
    );

    const mutate = async (payload: Partial<SmsSettings>) => {
        setNotice(null);
        try {
            await updateSmsSettings.mutateAsync(payload);
        } catch {
            setNotice('Nie udało się zapisać ustawień SMS.');
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
                    className="btn btn-default"
                    onClick={() => void refetch()}
                >
                    odśwież
                </button>
            </div>
        );
    }

    return (
        <div className="sms-settings-page">
            <div className="breadcrumbs" e2e-breadcrumbs="">
                <ul>
                    <li>
                        <div className="icon sprite-breadcrumbs_communication_set" />
                        <Link href="/settings">ustawienia</Link>
                    </li>
                    <li>
                        <span> / </span>
                        Łączność
                    </li>
                    <li>
                        <span> / </span>
                        Wiadomości SMS
                    </li>
                </ul>
            </div>

            <div className="inner sms_settings sms-settings-page__inner">
                <div className="polish_sms_settings visible">
                    <div className="sms-settings-page__types">
                        <SmsTypeCard
                            active={currentType === 'premium'}
                            recommended
                            title="SMS Premium"
                            price="12 groszy/SMS"
                            description="Zalecane do wysyłki przypomnień oraz innych wiadomości, w przypadku których istotna jest odpowiedź klienta."
                            features={featureCards.premium}
                            onActivate={() => {
                                setPendingType('premium');
                                void mutate({ smsType: 'premium' }).finally(
                                    () => setPendingType(null),
                                );
                            }}
                        />

                        <SmsTypeCard
                            active={currentType === 'standard'}
                            title="SMS Standard"
                            price="10 groszy/SMS"
                            description="Ten typ SMS można użyć do wysyłki wiadomości masowych, dla których nie jest wymagana odpowiedź klienta."
                            features={featureCards.standard}
                            onActivate={() => {
                                setPendingType('standard');
                                void mutate({ smsType: 'standard' }).finally(
                                    () => setPendingType(null),
                                );
                            }}
                        />
                    </div>

                    <div className="net_prices">
                        Podane ceny są cenami netto i należy do nich doliczyć
                        podatek VAT.
                    </div>
                </div>

                <div className="breadcrumbs">
                    <ul>
                        <li>
                            <div className="icon sprite-advanced_sms_options" />
                            Zaawansowane opcje wysyłki
                            {advancedDisabled ? (
                                <span className="sms-settings-page__note-inline">
                                    {' '}
                                    (niedostępne dla SMS standard)
                                </span>
                            ) : null}
                        </li>
                    </ul>
                </div>

                <div
                    className={`advanced_sms_options sms-settings-page__advanced ${advancedDisabled ? 'disabled' : 'enabled'}`}
                >
                    <div className="option">
                        1. Wysyłaj na numery zagraniczne
                        <div className="send_abroad">
                            <div
                                className={`status_tag ${data.sendAbroad ? 'tag_green' : 'tag_red'}`}
                            >
                                {data.sendAbroad ? 'aktywne' : 'nieaktywne'}
                            </div>
                            <button
                                type="button"
                                id="send_abroad"
                                className="sms-settings-page__link-button"
                                disabled={advancedDisabled}
                                onClick={() => {
                                    setPendingFlag('sendAbroad');
                                    void mutate({
                                        sendAbroad: !data.sendAbroad,
                                    }).finally(() => setPendingFlag(null));
                                }}
                            >
                                {data.sendAbroad ? 'wyłącz' : 'włącz'}
                            </button>
                            <br />
                            <span className="sms-settings-page__subline">
                                Cena wiadomości SMS na numery zagraniczne
                                (dowolny kraj świata): 30 groszy/SMS
                            </span>
                        </div>
                    </div>

                    <div className="option">
                        2. Wysyłaj wiadomości SMS z polskimi znakami
                        <div className="utf">
                            <div
                                className={`status_tag ${data.utf ? 'tag_green' : 'tag_red'}`}
                            >
                                {data.utf ? 'aktywne' : 'nieaktywne'}
                            </div>
                            <button
                                type="button"
                                id="utf"
                                className="sms-settings-page__link-button"
                                disabled={advancedDisabled}
                                onClick={() => {
                                    setPendingFlag('utf');
                                    void mutate({ utf: !data.utf }).finally(
                                        () => setPendingFlag(null),
                                    );
                                }}
                            >
                                {data.utf ? 'wyłącz' : 'włącz'}
                            </button>
                        </div>
                        <div className="sms-settings-page__hint">
                            Aktywna opcja ogranicza długość pojedynczej
                            wiadomości do 70 znaków, ale zachowuje polskie
                            znaki.
                        </div>
                    </div>

                    <div className="option prefix_option">
                        <div className="adv_option">3. Domyślny prefix</div>
                        <div className="default_prefix">
                            {data.defaultPrefix}
                        </div>
                        <div className="change_prefix">
                            <button
                                type="button"
                                className="sms-settings-page__link-button"
                                onClick={() =>
                                    setNotice(
                                        'Zmiana prefixu nie została jeszcze odwzorowana poza widoczną informacją z dumpa.',
                                    )
                                }
                            >
                                zmień prefix
                            </button>
                        </div>
                    </div>

                    <div
                        className={`${advancedDisabled ? 'disabled' : 'enabled'} option`}
                    >
                        <div className="adv_option">4. Nadpis tekstowy</div>
                        <button
                            type="button"
                            className="btn"
                            disabled={advancedDisabled}
                            onClick={() =>
                                setNotice(
                                    'Zamówienie nadpisu tekstowego nie jest jeszcze obsługiwane w panelu salonbw.',
                                )
                            }
                        >
                            zamów nadpis
                        </button>
                        <div className="price_info">
                            Jednorazowa opłata rejestracyjna: 49 zł
                        </div>
                    </div>
                </div>

                {notice ? (
                    <div className="sms-settings-page__notice" role="status">
                        {notice}
                    </div>
                ) : null}
                {pendingType || pendingFlag ? (
                    <div className="sms-settings-page__saving">
                        Zapisywanie...
                    </div>
                ) : null}
            </div>
        </div>
    );
}

import { useState } from 'react';
import SettingsDetailLayout from '@/components/settings/SettingsDetailLayout';

const paymentNavItems = [
    {
        label: 'Moment Pay',
        iconClass: 'sprite-settings_product_purchase_prices',
        href: '/settings/payment-configuration',
        active: true,
    },
    {
        label: 'Przedpłaty',
        iconClass: 'sprite-settings_prepay',
    },
    {
        label: 'Napiwki',
        iconClass: 'sprite-tips',
        href: '/statistics/tips',
    },
    {
        label: 'Metody płatności',
        iconClass: 'sprite-settings_payment_methods',
    },
] as const;

export default function PaymentConfigurationPage() {
    const [activationNoticeVisible, setActivationNoticeVisible] =
        useState(false);
    const [learnMoreNoticeVisible, setLearnMoreNoticeVisible] = useState(false);

    return (
        <SettingsDetailLayout
            sectionTitle="Płatności"
            breadcrumbLabel="Moment Pay"
            navItems={[...paymentNavItems]}
        >
            <div className="settings-payment-page">
                <div className="settings-payment-page__actions">
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => setActivationNoticeVisible(true)}
                    >
                        aktywuj Moment Pay
                    </button>
                </div>

                <section
                    className="settings-payment-page__blank"
                    aria-label="Moment Pay activation"
                >
                    <div
                        className="settings-payment-page__art"
                        aria-hidden="true"
                    >
                        <div className="settings-payment-page__art-shadow" />
                        <div className="settings-payment-page__art-badge">
                            M
                        </div>
                    </div>

                    <h2 className="settings-payment-page__title">Moment Pay</h2>

                    <p className="settings-payment-page__description">
                        Aktywuj system płatności online Moment Pay, aby
                        zmniejszyć ilość zapomnianych wizyt i usprawnić proces
                        rezerwacji usług. Dzięki niemu zyskasz możliwość
                        przyjmowania przedpłat w procesie rezerwacji przez
                        portal Moment.pl, a także umożliwisz klientom opłacenie
                        przedpłat dla wizyt dodanych przez Ciebie w kalendarzu,
                        w dogodnym dla nich czasie i miejscu. Co więcej, Moment
                        Pay pozwoli Ci zaoferować klientom dodatkowe metody
                        płatności, a co za tym idzie, zwiększyć ich komfort.
                    </p>

                    <button
                        type="button"
                        className="settings-payment-page__learn-more"
                        onClick={() => setLearnMoreNoticeVisible(true)}
                    >
                        Dowiedz się więcej
                    </button>
                </section>

                {activationNoticeVisible ? (
                    <div
                        className="settings-payment-page__notice"
                        role="status"
                    >
                        Aktywacja Moment Pay nie jest jeszcze obsługiwana w
                        panelu salonbw.
                    </div>
                ) : null}
                {learnMoreNoticeVisible ? (
                    <div
                        className="settings-payment-page__notice"
                        role="status"
                    >
                        Szczegóły oferty Moment Pay nie zostały jeszcze
                        odwzorowane poza widocznym stanem aktywacji z dumpa.
                    </div>
                ) : null}
            </div>
        </SettingsDetailLayout>
    );
}

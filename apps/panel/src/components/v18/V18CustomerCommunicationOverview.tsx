import { useState } from 'react';
import type { Customer } from '@/types';
import type { CommunicationChannel } from '@/api/communicationConsents';
import { CHANNEL_LABELS } from '@/api/communicationConsents';
import { useCommunicationState } from '@/hooks/useCommunicationConsents';
import { useSmsHistory } from '@/hooks/useSms';
import { useEmailHistory } from '@/hooks/useEmails';
import CustomerConsentHistory from '@/components/communication/CustomerConsentHistory';
import styles from '@/styles/V18CustomerCommunication.module.css';

interface Props {
    customer: Customer;
    onEditConsents: () => void;
}

const channelOrder: CommunicationChannel[] = [
    'PANEL',
    'EMAIL',
    'SMS',
    'WHATSAPP',
];

function formatTime(value?: string | null) {
    if (!value) return '—';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
        ? '—'
        : parsed.toLocaleString('pl-PL');
}

function messageStatus(status?: string | null) {
    switch ((status ?? '').toLowerCase()) {
        case 'sent':
        case 'delivered':
            return 'Wysłano';
        case 'pending':
            return 'Oczekuje';
        case 'failed':
        case 'rejected':
            return 'Błąd';
        default:
            return status || '—';
    }
}

/**
 * Studio V18-only overview. Detailed controls remain in V18EditCustomerModal.
 * No new consent mutations, no inference from unverified legacy flags.
 * History queries are disabled until the user opens the relevant section.
 */
export default function V18CustomerCommunicationOverview({
    customer,
    onEditConsents,
}: Props) {
    const [formalOpen, setFormalOpen] = useState(false);
    const [auditOpen, setAuditOpen] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyChannel, setHistoryChannel] = useState<'sms' | 'email'>(
        'sms',
    );
    const communication = useCommunicationState({
        kind: 'customer',
        customerId: customer.id,
    });
    const smsHistory = useSmsHistory({
        recipientId: customer.id,
        page: 1,
        limit: 20,
        enabled: historyOpen && historyChannel === 'sms',
    });
    const emailHistory = useEmailHistory({
        recipientId: customer.id,
        page: 1,
        limit: 20,
        enabled: historyOpen && historyChannel === 'email',
    });

    const state = communication.data;
    const operationalChannels = channelOrder.filter((channel) =>
        state?.preferences.some(
            (pref) =>
                pref.communicationClass === 'OPERATIONAL' &&
                pref.channel === channel &&
                pref.effectiveAllowed,
        ),
    );
    const grantedChannels = channelOrder.filter((channel) =>
        state?.consents.some(
            (consent) =>
                consent.purpose === 'DIRECT_MARKETING' &&
                consent.channel === channel &&
                consent.status === 'GRANTED',
        ),
    );
    const consentsOfOtherPurposes =
        state?.consents.filter(
            (consent) =>
                consent.purpose !== 'DIRECT_MARKETING' &&
                consent.status === 'GRANTED',
        ).length ?? 0;
    const operationalSummary = !state
        ? 'Ładowanie…'
        : !state.receiveNotifications
          ? 'Powiadomienia wyłączone'
          : operationalChannels.length
            ? operationalChannels.map((channel) => CHANNEL_LABELS[channel]).join(' · ')
            : 'Brak aktywnych kanałów';
    const marketingSummary = !state
        ? 'Ładowanie…'
        : grantedChannels.length
          ? grantedChannels.map((channel) => CHANNEL_LABELS[channel]).join(' · ')
          : 'Brak zgody marketingowej';

    const history = historyChannel === 'sms' ? smsHistory : emailHistory;
    const smsItems = Array.isArray(smsHistory.data?.items)
        ? smsHistory.data.items
        : [];
    const emailItems = Array.isArray(emailHistory.data?.items)
        ? emailHistory.data.items
        : [];

    return (
        <div className={styles.overview} data-testid="v18-communication-overview">
            <section className={styles.overviewPanel} aria-label="Kontakt z klientem">
                <div className={styles.overviewHeader}>
                    <div>
                        <span className={styles.overviewEyebrow}>Karta klienta · V18</span>
                        <h2>Komunikacja</h2>
                    </div>
                    <button
                        type="button"
                        className={styles.editButton}
                        onClick={onEditConsents}
                    >
                        Edytuj komunikację
                    </button>
                </div>
                <div className={styles.contactGrid}>
                    <div>
                        <span>Klient</span>
                        <strong>{customer.fullName || customer.name}</strong>
                    </div>
                    <div>
                        <span>E-mail</span>
                        {customer.email ? (
                            <a href={`mailto:${customer.email}`}>{customer.email}</a>
                        ) : (
                            <strong>Nie podano</strong>
                        )}
                    </div>
                    <div>
                        <span>Telefon</span>
                        {customer.phone ? (
                            <a href={`tel:${customer.phone}`}>{customer.phone}</a>
                        ) : (
                            <strong>Nie podano</strong>
                        )}
                    </div>
                </div>
            </section>

            <section className={styles.overviewPanel} aria-label="Podsumowanie komunikacji">
                <div className={styles.overviewHeader}>
                    <div>
                        <span className={styles.overviewEyebrow}>Stan bieżący</span>
                        <h2>Ustawienia w skrócie</h2>
                    </div>
                </div>
                {communication.isError ? (
                    <p role="alert">Nie udało się pobrać ustawień komunikacji.</p>
                ) : (
                    <div className={styles.summaryGrid}>
                        <div className={styles.summaryCard}>
                            <span>Powiadomienia o wizytach</span>
                            <strong>{operationalSummary}</strong>
                            <small>
                                Aktywne kanały dla co najmniej jednego rodzaju
                                wiadomości
                            </small>
                        </div>
                        <div className={styles.summaryCard}>
                            <span>Marketing bezpośredni</span>
                            <strong>{marketingSummary}</strong>
                            <small>
                                {state
                                    ? `${grantedChannels.length} z 3 kanałów ze zgodą`
                                    : 'Sprawdzanie uprawnień'}
                            </small>
                        </div>
                        <div className={styles.summaryCard}>
                            <span>Formalności</span>
                            <strong>
                                {customer.termsConsent
                                    ? 'Regulamin zaakceptowany'
                                    : 'Brak potwierdzenia regulaminu'}
                            </strong>
                            <small>
                                {consentsOfOtherPurposes
                                    ? `Pozostałe aktywne zgody: ${consentsOfOtherPurposes}`
                                    : 'Pozostałe cele marketingowe: brak zgód'}
                            </small>
                        </div>
                    </div>
                )}
                <p className={styles.summaryFootnote}>
                    Preferencje i zgody są niezależne. Szczegóły oraz ich zmianę
                    znajdziesz w edycji komunikacji.
                </p>
            </section>

            <details
                className={styles.disclosure}
                onToggle={(event) =>
                    setFormalOpen(event.currentTarget.open)
                }
            >
                <summary>Informacje formalne i regulamin</summary>
                {formalOpen ? (
                    <div className={styles.disclosureBody}>
                        <p>
                            <strong>Regulamin: </strong>
                            {customer.termsConsent
                                ? 'Zaakceptowany'
                                : 'Brak potwierdzenia'}
                            {customer.termsConsentDate
                                ? ` · ${formatTime(customer.termsConsentDate)}`
                                : ''}
                        </p>
                        <p>
                            <strong>Historyczne pole RODO: </strong>
                            {customer.gdprConsent
                                ? 'Odnotowane'
                                : 'Brak wpisu'}
                            {customer.gdprConsentDate
                                ? ` · ${formatTime(customer.gdprConsentDate)}`
                                : ''}
                        </p>
                        <p className={styles.muted}>
                            Historyczne pole RODO nie zastępuje obowiązku
                            informacyjnego i nie stanowi zgody marketingowej.
                        </p>
                    </div>
                ) : null}
            </details>

            <details
                className={styles.disclosure}
                onToggle={(event) =>
                    setAuditOpen(event.currentTarget.open)
                }
            >
                <summary>Historia zmian zgód i preferencji</summary>
                {auditOpen ? (
                    <div className={styles.disclosureBody}>
                        <CustomerConsentHistory
                            scope={{ kind: 'customer', customerId: customer.id }}
                            audience="staff"
                        />
                    </div>
                ) : null}
            </details>

            <details
                className={styles.disclosure}
                onToggle={(event) =>
                    setHistoryOpen(event.currentTarget.open)
                }
            >
                <summary>Historia wysłanych wiadomości</summary>
                {historyOpen ? (
                    <div className={styles.disclosureBody}>
                        <div className={styles.historySwitch}>
                            <button
                                type="button"
                                className={
                                    historyChannel === 'sms'
                                        ? styles.historyActive
                                        : styles.historyButton
                                }
                                aria-pressed={historyChannel === 'sms'}
                                onClick={() => setHistoryChannel('sms')}
                            >
                                SMS
                            </button>
                            <button
                                type="button"
                                className={
                                    historyChannel === 'email'
                                        ? styles.historyActive
                                        : styles.historyButton
                                }
                                aria-pressed={historyChannel === 'email'}
                                onClick={() => setHistoryChannel('email')}
                            >
                                E-mail
                            </button>
                        </div>
                        {history.loading ? (
                            <p role="status">Ładowanie historii…</p>
                        ) : history.error ? (
                            <p role="alert">
                                Nie udało się pobrać historii komunikacji.
                            </p>
                        ) : historyChannel === 'sms' ? (
                            smsItems.length ? (
                                <div className={styles.historyScroll}>
                                    <table className={styles.historyTable}>
                                        <thead>
                                            <tr>
                                                <th>Data</th>
                                                <th>Status</th>
                                                <th>Wiadomość</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {smsItems.map((item) => (
                                                <tr key={item.id}>
                                                    <td>{formatTime(item.sentAt || item.createdAt)}</td>
                                                    <td>{messageStatus(item.status)}</td>
                                                    <td>{item.content || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p>Brak wysłanych SMS do tego klienta.</p>
                            )
                        ) : emailItems.length ? (
                            <div className={styles.historyScroll}>
                                <table className={styles.historyTable}>
                                    <thead>
                                        <tr>
                                            <th>Data</th>
                                            <th>Status</th>
                                            <th>Temat</th>
                                            <th>Odbiorca</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {emailItems.map((item) => (
                                            <tr key={item.id}>
                                                <td>{formatTime(item.sentAt || item.createdAt)}</td>
                                                <td>{messageStatus(item.status)}</td>
                                                <td>{item.subject || '—'}</td>
                                                <td>{item.to || '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p>Brak wysłanych e-maili do tego klienta.</p>
                        )}
                    </div>
                ) : null}
            </details>
        </div>
    );
}

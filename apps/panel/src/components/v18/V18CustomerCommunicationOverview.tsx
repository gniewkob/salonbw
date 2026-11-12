import { useState } from 'react';
import type { Customer } from '@/types';
import {
    V18_CHANNEL_GROUPS,
    marketingGroupConsent,
    marketingStatusLabel,
    operationalGroupDelivery,
} from '@/components/v18/communicationGroups';
import { useCommunicationState } from '@/hooks/useCommunicationConsents';
import { useSmsHistory } from '@/hooks/useSms';
import { useEmailHistory } from '@/hooks/useEmails';
import CustomerConsentHistory from '@/components/communication/CustomerConsentHistory';
import styles from '@/styles/V18CustomerCommunication.module.css';

interface Props {
    customer: Customer;
    onEditConsents: () => void;
}

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
    const history = historyChannel === 'sms' ? smsHistory : emailHistory;
    const smsItems = Array.isArray(smsHistory.data?.items)
        ? smsHistory.data.items
        : [];
    const emailItems = Array.isArray(emailHistory.data?.items)
        ? emailHistory.data.items
        : [];

    return (
        <div
            className={styles.overview}
            data-testid="v18-communication-overview"
        >
            <section
                className={styles.overviewPanel}
                aria-label="Kontakt z klientem"
            >
                <div className={styles.overviewHeader}>
                    <div>
                        <span className={styles.overviewEyebrow}>
                            Karta klienta · V18
                        </span>
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
                            <a href={`mailto:${customer.email}`}>
                                {customer.email}
                            </a>
                        ) : (
                            <strong>Nie podano</strong>
                        )}
                    </div>
                    <div>
                        <span>Telefon</span>
                        {customer.phone ? (
                            <a href={`tel:${customer.phone}`}>
                                {customer.phone}
                            </a>
                        ) : (
                            <strong>Nie podano</strong>
                        )}
                    </div>
                </div>
            </section>

            <section
                className={styles.overviewPanel}
                aria-label="Podsumowanie kanałów kontaktu"
            >
                <div className={styles.overviewHeader}>
                    <div>
                        <span className={styles.overviewEyebrow}>
                            Stan bieżący
                        </span>
                        <h2>Kanały kontaktu</h2>
                    </div>
                </div>
                {communication.isError ? (
                    <p role="alert">
                        Nie udało się pobrać ustawień komunikacji.
                    </p>
                ) : !state ? (
                    <p role="status">Ładowanie ustawień komunikacji…</p>
                ) : (
                    <div className={styles.channelSummary}>
                        {V18_CHANNEL_GROUPS.map((group) => {
                            const operational = operationalGroupDelivery(
                                state,
                                group,
                            );
                            const marketing = marketingGroupConsent(
                                state,
                                group,
                            );
                            const missingContact =
                                group.id === 'MESSAGING'
                                    ? !state.contact.hasPhone
                                    : !state.contact.hasEmail;
                            const operationalLabel = missingContact
                                ? group.id === 'MESSAGING'
                                    ? 'Brak telefonu'
                                    : 'Brak adresu e-mail'
                                : operational.status === 'on'
                                  ? 'Aktywne'
                                  : operational.status === 'off'
                                    ? 'Wyłączone'
                                    : operational.status === 'partial'
                                      ? 'Częściowo'
                                      : 'Niedostępne';
                            const marketingLabel =
                                marketingStatusLabel[marketing.status];

                            return (
                                <div
                                    className={styles.channelSummaryRow}
                                    key={group.id}
                                    data-channel-group={group.id}
                                >
                                    <strong>{group.label}</strong>
                                    <div>
                                        <span>Wizyty</span>
                                        <b>{operationalLabel}</b>
                                        {operational.status === 'partial' && (
                                            <small>
                                                {operational.enabled}/
                                                {operational.total} kanałów
                                            </small>
                                        )}
                                    </div>
                                    <div>
                                        <span>Oferty i promocje</span>
                                        <b>{marketingLabel}</b>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                <p className={styles.summaryFootnote}>
                    Preferencje powiadomień i zgody na promocje są niezależne.
                    Szczegóły oraz zmiany dostępne w edycji komunikacji.
                </p>
            </section>

            <details
                className={styles.disclosure}
                onToggle={(event) => setFormalOpen(event.currentTarget.open)}
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
                            {customer.gdprConsent ? 'Odnotowane' : 'Brak wpisu'}
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
                onToggle={(event) => setAuditOpen(event.currentTarget.open)}
            >
                <summary>Historia zmian zgód i preferencji</summary>
                {auditOpen ? (
                    <div className={styles.disclosureBody}>
                        <CustomerConsentHistory
                            scope={{
                                kind: 'customer',
                                customerId: customer.id,
                            }}
                            audience="staff"
                        />
                    </div>
                ) : null}
            </details>

            <details
                className={styles.disclosure}
                onToggle={(event) => setHistoryOpen(event.currentTarget.open)}
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
                                                    <td>
                                                        {formatTime(
                                                            item.sentAt ||
                                                                item.createdAt,
                                                        )}
                                                    </td>
                                                    <td>
                                                        {messageStatus(
                                                            item.status,
                                                        )}
                                                    </td>
                                                    <td>
                                                        {item.content || '—'}
                                                    </td>
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
                                                <td>
                                                    {formatTime(
                                                        item.sentAt ||
                                                            item.createdAt,
                                                    )}
                                                </td>
                                                <td>
                                                    {messageStatus(item.status)}
                                                </td>
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

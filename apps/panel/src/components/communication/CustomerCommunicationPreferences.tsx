import { useEffect, useMemo, useState } from 'react';
import {
    CHANNEL_LABELS,
    CONSENT_STATUS_LABELS,
    CommunicationChannel,
    CommunicationPreferenceView,
    CommunicationScope,
    ConsentScopeView,
    REASON_LABELS,
    newIdempotencyKey,
} from '@/api/communicationConsents';
import {
    useCommunicationCatalog,
    useCommunicationState,
    useGrantConsent,
    useUpdateCommunicationPreferences,
    useWithdrawConsent,
} from '@/hooks/useCommunicationConsents';
import v18Styles from '@/styles/V18CommunicationPreferences.module.css';
import CustomerConsentConfirmation, {
    ConsentConfirmationRequest,
    StaffEvidence,
} from './CustomerConsentConfirmation';

export interface CustomerCommunicationPreferencesProps {
    scope: CommunicationScope;
    /** 'staff' = salon personnel, 'customer' = self-service. */
    audience: 'staff' | 'customer';
    /** Profile is a read-only snapshot; modifications belong in the editor. */
    readOnly?: boolean;
    /** Use the established Studio V18 design language without changing legacy screens. */
    variant?: 'default' | 'v18';
    /** Reports unsaved preference edits to the hosting V18 customer editor. */
    onDirtyChange?: (dirty: boolean) => void;
}

type PendingAction =
    | { kind: 'grant'; consent: ConsentScopeView }
    | { kind: 'withdraw'; consent: ConsentScopeView }
    | { kind: 'preferences' }
    | {
          kind: 'preference';
          pref: CommunicationPreferenceView;
          enabled: boolean;
      };

/**
 * Functional integration of consents + preferences. Every change goes through
 * CustomerConsentConfirmation and is persisted by the backend with an audit
 * event; the view always re-renders from the server response.
 */
export default function CustomerCommunicationPreferences({
    scope,
    audience,
    readOnly = false,
    variant = 'default',
    onDirtyChange,
}: CustomerCommunicationPreferencesProps) {
    const catalog = useCommunicationCatalog();
    const state = useCommunicationState(scope);
    const grant = useGrantConsent(scope);
    const withdraw = useWithdrawConsent(scope);
    const updatePrefs = useUpdateCommunicationPreferences(scope);
    const [pending, setPending] = useState<PendingAction | null>(null);
    const [idempotencyKey, setIdempotencyKey] = useState('');
    const [draftPreferences, setDraftPreferences] = useState<
        Record<string, boolean>
    >({});
    const isV18 = variant === 'v18';
    const batchPreferences = isV18 && !readOnly;
    const preferenceKey = (type: string, channel: CommunicationChannel) =>
        `${type}:${channel}`;

    const busy = grant.isPending || withdraw.isPending || updatePrefs.isPending;
    const dirtyCount = (state.data?.preferences ?? []).filter((pref) => {
        const key = preferenceKey(pref.communicationType, pref.channel);
        return (
            pref.supported &&
            Object.prototype.hasOwnProperty.call(draftPreferences, key) &&
            draftPreferences[key] !== Boolean(pref.preferred)
        );
    }).length;

    // The editor blocks accidental dismissal, without changing consent/audit APIs.
    useEffect(() => {
        onDirtyChange?.(batchPreferences && dirtyCount > 0);
    }, [batchPreferences, dirtyCount, onDirtyChange]);

    const typesByClass = useMemo(() => {
        const types = catalog.data?.types ?? [];
        return {
            OPERATIONAL: types.filter((t) => t.class === 'OPERATIONAL'),
            MARKETING: types.filter((t) => t.class === 'MARKETING'),
        };
    }, [catalog.data]);

    if (state.isLoading || catalog.isLoading) {
        return <p className="text-muted small">Ładowanie zgód…</p>;
    }
    if (state.isError || catalog.isError || !state.data || !catalog.data) {
        return (
            <p className="text-danger small" role="alert">
                Nie udało się pobrać zgód i preferencji.
            </p>
        );
    }

    const data = state.data;
    const channels = catalog.data.channels;
    const scopeText = (c: ConsentScopeView) =>
        catalog.data.consentScopes.find(
            (s) => s.purpose === c.purpose && s.channel === c.channel,
        );
    const prefFor = (type: string, channel: CommunicationChannel) =>
        data.preferences.find(
            (p) => p.communicationType === type && p.channel === channel,
        );
    const typeLabel = (type: string) =>
        catalog.data.types.find((t) => t.type === type)?.label ?? type;
    const changedPreferences = data.preferences
        .filter(
            (pref) =>
                pref.supported &&
                Object.prototype.hasOwnProperty.call(
                    draftPreferences,
                    preferenceKey(pref.communicationType, pref.channel),
                ) &&
                draftPreferences[
                    preferenceKey(pref.communicationType, pref.channel)
                ] !== Boolean(pref.preferred),
        )
        .map((pref) => ({
            communicationType: pref.communicationType,
            channel: pref.channel,
            enabled:
                draftPreferences[
                    preferenceKey(pref.communicationType, pref.channel)
                ],
        }));

    const open = (action: PendingAction) => {
        setIdempotencyKey(newIdempotencyKey());
        setPending(action);
    };

    let request: ConsentConfirmationRequest | null = null;
    if (pending?.kind === 'grant') {
        const text = scopeText(pending.consent);
        request = {
            title: 'Potwierdź zgodę',
            summary: [
                `${pending.consent.label}: ${CONSENT_STATUS_LABELS[pending.consent.status]} → Udzielona`,
            ],
            statement: text
                ? {
                      text: text.text,
                      version: text.textVersion,
                      draft: text.draft,
                  }
                : undefined,
            requireStaffEvidence: audience === 'staff',
            staffSources: catalog.data.staffGrantSources,
            confirmLabel: 'Zapisz zgodę',
        };
    } else if (pending?.kind === 'withdraw') {
        request = {
            title: 'Wycofanie zgody',
            summary: [
                `${pending.consent.label}: ${CONSENT_STATUS_LABELS[pending.consent.status]} → Wycofana`,
                'Wycofanie działa od razu dla kolejnych wysyłek.',
            ],
            confirmLabel: 'Wycofaj zgodę',
            destructive: true,
        };
    } else if (pending?.kind === 'preferences') {
        request = {
            title: 'Potwierdź zmiany preferencji',
            summary: changedPreferences.map(
                (pref) =>
                    `${typeLabel(pref.communicationType)} — ${CHANNEL_LABELS[pref.channel]}: ${pref.enabled ? 'włącz' : 'wyłącz'}`,
            ),
            confirmLabel: 'Zapisz zmiany',
        };
    } else if (pending?.kind === 'preference') {
        request = {
            title: 'Zmiana preferencji',
            summary: [
                `${typeLabel(pending.pref.communicationType)} — ${CHANNEL_LABELS[pending.pref.channel]}: ${pending.enabled ? 'włącz' : 'wyłącz'}`,
            ],
            confirmLabel: 'Zapisz',
        };
    }

    const confirm = (evidence?: StaffEvidence) => {
        if (!pending) return;
        const done = { onSettled: () => setPending(null) };
        if (pending.kind === 'grant') {
            grant.mutate(
                {
                    purpose: pending.consent.purpose,
                    channel: pending.consent.channel,
                    consentTextVersion: pending.consent.currentTextVersion,
                    ...(evidence ?? {}),
                    idempotencyKey,
                },
                done,
            );
        } else if (pending.kind === 'withdraw') {
            withdraw.mutate(
                {
                    purpose: pending.consent.purpose,
                    channel: pending.consent.channel,
                    idempotencyKey,
                },
                done,
            );
        } else if (pending.kind === 'preferences') {
            updatePrefs.mutate(
                { changes: changedPreferences, idempotencyKey },
                {
                    onSuccess: () => setDraftPreferences({}),
                    onSettled: () => setPending(null),
                },
            );
        } else {
            updatePrefs.mutate(
                {
                    changes: [
                        {
                            communicationType: pending.pref.communicationType,
                            channel: pending.pref.channel,
                            enabled: pending.enabled,
                        },
                    ],
                    idempotencyKey,
                },
                done,
            );
        }
    };

    const renderMatrix = (
        title: string,
        types: typeof typesByClass.OPERATIONAL,
    ) => (
        <table
            className={isV18 ? v18Styles.table : 'customer-communication-table'}
        >
            <caption className="text-start small fw-semibold">{title}</caption>
            <thead>
                <tr>
                    <th scope="col">Typ wiadomości</th>
                    {channels.map((ch) => (
                        <th key={ch} scope="col">
                            {CHANNEL_LABELS[ch]}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {types.map((t) => (
                    <tr key={t.type}>
                        <th scope="row">{t.label}</th>
                        {channels.map((ch) => {
                            const pref = prefFor(t.type, ch);
                            if (!pref || !pref.supported) {
                                return (
                                    <td key={ch} className="text-muted">
                                        <span aria-label="kanał niedostępny">
                                            —
                                        </span>
                                    </td>
                                );
                            }
                            const key = preferenceKey(t.type, ch);
                            const draftValue = draftPreferences[key];
                            const checked =
                                batchPreferences && draftValue !== undefined
                                    ? draftValue
                                    : Boolean(pref.preferred);
                            const dirty =
                                batchPreferences &&
                                checked !== Boolean(pref.preferred);
                            return (
                                <td
                                    key={ch}
                                    className={
                                        isV18 ? v18Styles.cell : undefined
                                    }
                                >
                                    {readOnly ? (
                                        <span
                                            className={
                                                checked
                                                    ? v18Styles.statusEnabled
                                                    : v18Styles.statusDisabled
                                            }
                                            aria-label={`${t.label} — ${CHANNEL_LABELS[ch]}: ${checked ? 'włączone' : 'wyłączone'}`}
                                        >
                                            {checked ? 'Włączone' : 'Wyłączone'}
                                        </span>
                                    ) : (
                                        <label
                                            className={
                                                isV18
                                                    ? v18Styles.toggleWrap
                                                    : undefined
                                            }
                                        >
                                            <input
                                                type="checkbox"
                                                className={
                                                    isV18
                                                        ? v18Styles.toggle
                                                        : undefined
                                                }
                                                checked={checked}
                                                disabled={busy}
                                                aria-label={`${t.label} — ${CHANNEL_LABELS[ch]}`}
                                                aria-describedby={`pref-${t.type}-${ch}`}
                                                onChange={(e) =>
                                                    batchPreferences
                                                        ? setDraftPreferences(
                                                              (draft) => ({
                                                                  ...draft,
                                                                  [key]: e
                                                                      .target
                                                                      .checked,
                                                              }),
                                                          )
                                                        : open({
                                                              kind: 'preference',
                                                              pref,
                                                              enabled:
                                                                  e.target
                                                                      .checked,
                                                          })
                                                }
                                            />
                                        </label>
                                    )}
                                    {dirty ? (
                                        <small className={v18Styles.unsaved}>
                                            Niezapisana zmiana
                                        </small>
                                    ) : null}
                                    <small
                                        id={`pref-${t.type}-${ch}`}
                                        className={`d-block ${
                                            pref.effectiveAllowed
                                                ? 'text-success'
                                                : 'text-muted'
                                        }`}
                                        data-reason={pref.reason}
                                    >
                                        {dirty
                                            ? 'Ocena wysyłki po zapisaniu zmian'
                                            : REASON_LABELS[pref.reason]}
                                    </small>
                                </td>
                            );
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
    );

    const renderConsentScopes = () => (
        <section
            aria-label={
                isV18 ? 'Lista zgód marketingowych' : 'Zgody marketingowe'
            }
            className={isV18 ? v18Styles.consents : 'mb-3'}
        >
            <ul
                className={isV18 ? v18Styles.consentList : 'list-unstyled mb-0'}
            >
                {data.consents.map((c) => (
                    <li
                        key={`${c.purpose}:${c.channel}`}
                        className={
                            isV18
                                ? v18Styles.consentItem
                                : 'd-flex flex-wrap align-items-center gap-2 py-1'
                        }
                        data-consent={`${c.purpose}:${c.channel}`}
                        data-status={c.status}
                    >
                        <span
                            className={
                                isV18 ? v18Styles.consentLabel : 'fw-semibold'
                            }
                        >
                            {c.label}
                        </span>
                        <span
                            className={
                                isV18
                                    ? c.status === 'GRANTED'
                                        ? v18Styles.statusEnabled
                                        : v18Styles.statusDisabled
                                    : undefined
                            }
                        >
                            {CONSENT_STATUS_LABELS[c.status]}
                        </span>
                        {c.legacyUnverifiedConsent && (
                            <span
                                className={
                                    isV18
                                        ? v18Styles.legacyWarning
                                        : 'text-warning small'
                                }
                            >
                                stara zgoda bez dowodu — nie uprawnia do
                                marketingu
                            </span>
                        )}
                        {c.recordedAt && (
                            <small className="text-muted">
                                {new Date(c.recordedAt).toLocaleString('pl-PL')}
                            </small>
                        )}
                        {!readOnly && (
                            <span
                                className={
                                    isV18
                                        ? v18Styles.consentActions
                                        : 'ms-auto d-flex gap-2'
                                }
                            >
                                {c.status === 'GRANTED' ? (
                                    <button
                                        type="button"
                                        className={
                                            isV18
                                                ? v18Styles.withdrawButton
                                                : 'btn btn-outline-secondary btn-sm'
                                        }
                                        disabled={busy}
                                        onClick={() =>
                                            open({
                                                kind: 'withdraw',
                                                consent: c,
                                            })
                                        }
                                    >
                                        Wycofaj
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className={
                                            isV18
                                                ? v18Styles.grantButton
                                                : 'btn btn-outline-dark btn-sm'
                                        }
                                        disabled={busy}
                                        onClick={() =>
                                            open({
                                                kind: 'grant',
                                                consent: c,
                                            })
                                        }
                                    >
                                        {audience === 'staff'
                                            ? 'Zarejestruj zgodę'
                                            : 'Wyrażam zgodę'}
                                    </button>
                                )}
                            </span>
                        )}
                    </li>
                ))}
            </ul>
        </section>
    );

    return (
        <div
            className={
                isV18 ? v18Styles.root : 'customer-communication-preferences'
            }
            data-testid="communication-preferences"
        >
            {isV18 ? (
                <>
                    <section
                        className={v18Styles.section}
                        aria-label="Ustawienia powiadomień"
                    >
                        <div className={v18Styles.sectionHeader}>
                            <span className={v18Styles.sectionNumber}>01</span>
                            <div>
                                <h3 className={v18Styles.sectionTitle}>
                                    Powiadomienia o wizytach
                                </h3>
                                <p className={v18Styles.sectionDescription}>
                                    Tutaj wybierasz preferowane kanały
                                    informacji o rezerwacji, przypomnieniach i
                                    zmianach terminów. To ustawienia
                                    komunikacji, nie zgody marketingowe.
                                </p>
                            </div>
                        </div>
                        {!data.receiveNotifications && (
                            <p className={v18Styles.notice} role="status">
                                Główne powiadomienia o wizytach są wyłączone na
                                koncie. Włączenie pojedynczego kanału nie omija
                                tego ustawienia.
                            </p>
                        )}
                        {renderMatrix(
                            'Kanały powiadomień',
                            typesByClass.OPERATIONAL,
                        )}
                    </section>
                    <section
                        className={v18Styles.section}
                        aria-label="Zgody marketingowe"
                    >
                        <div className={v18Styles.sectionHeader}>
                            <span className={v18Styles.sectionNumber}>02</span>
                            <div>
                                <h3 className={v18Styles.sectionTitle}>
                                    Zgody marketingowe
                                </h3>
                                <p className={v18Styles.sectionDescription}>
                                    Oddzielne uprawnienia do komunikacji
                                    reklamowej dla danego celu i kanału. Zgody
                                    mają własne potwierdzenie i historię; same
                                    ustawienia powiadomień nie zastępują zgody.
                                </p>
                            </div>
                        </div>
                        {renderConsentScopes()}

                        {typesByClass.MARKETING.length > 0 && (
                            <details className={v18Styles.marketingDetails}>
                                <summary className={v18Styles.marketingSummary}>
                                    Dodatkowe preferencje wiadomości
                                    marketingowych
                                </summary>
                                <p className={v18Styles.sectionDescription}>
                                    Można dodatkowo ograniczyć rodzaje
                                    wiadomości i kanały. Zaznaczenie preferencji
                                    nie udziela zgody marketingowej i nie
                                    odblokowuje wysyłki bez wymaganej podstawy.
                                </p>
                                {renderMatrix(
                                    'Dodatkowe ustawienia marketingowe',
                                    typesByClass.MARKETING,
                                )}
                            </details>
                        )}
                    </section>
                </>
            ) : (
                <>
                    {renderConsentScopes()}
                    {!data.receiveNotifications && (
                        <p className="small text-warning" role="status">
                            Powiadomienia o wizytach są wyłączone na koncie.
                        </p>
                    )}
                    {renderMatrix(
                        'Powiadomienia o wizytach',
                        typesByClass.OPERATIONAL,
                    )}
                    {renderMatrix(
                        'Wiadomości marketingowe',
                        typesByClass.MARKETING,
                    )}
                </>
            )}
            {batchPreferences ? (
                <div className={v18Styles.formActions}>
                    <span aria-live="polite" className={v18Styles.changeCount}>
                        {changedPreferences.length === 0
                            ? 'Brak niezapisanych zmian preferencji'
                            : `${changedPreferences.length} niezapisanych zmian`}
                    </span>
                    <button
                        type="button"
                        className={v18Styles.resetButton}
                        disabled={busy || changedPreferences.length === 0}
                        onClick={() => setDraftPreferences({})}
                    >
                        Anuluj
                    </button>
                    <button
                        type="button"
                        className={v18Styles.saveButton}
                        disabled={busy || changedPreferences.length === 0}
                        onClick={() => open({ kind: 'preferences' })}
                    >
                        Zapisz zmiany
                    </button>
                </div>
            ) : null}
            <CustomerConsentConfirmation
                request={request}
                variant={variant}
                pending={busy}
                onConfirm={confirm}
                onCancel={() => setPending(null)}
            />
        </div>
    );
}

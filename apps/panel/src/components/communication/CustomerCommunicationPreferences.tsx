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
import {
    V18_CHANNEL_GROUPS,
    groupStatusLabel,
    marketingGroupConsent,
    marketingStatusLabel,
    operationalGroupSettings,
    setOperationalGroupDraft,
} from '@/components/v18/communicationGroups';
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

    /** V18 shows only supported channels; no dense grid of unavailable cells. */
    const renderV18Rows = (
        title: string,
        types: typeof typesByClass.OPERATIONAL,
    ) => (
        <div className={v18Styles.preferenceGroup}>
            <h4 className={v18Styles.preferenceHeading}>{title}</h4>
            <div className={v18Styles.preferenceList}>
                {types.map((type) => {
                    const supported = channels
                        .map((channel) => ({
                            channel,
                            preference: prefFor(type.type, channel),
                        }))
                        .filter(
                            (
                                item,
                            ): item is {
                                channel: CommunicationChannel;
                                preference: CommunicationPreferenceView;
                            } => Boolean(item.preference?.supported),
                        );

                    return (
                        <div
                            className={v18Styles.preferenceRow}
                            key={type.type}
                        >
                            <div className={v18Styles.preferenceName}>
                                <strong>{type.label}</strong>
                            </div>
                            <div className={v18Styles.preferenceChannels}>
                                {supported.length === 0 ? (
                                    <span className={v18Styles.noChannels}>
                                        Brak dostępnych kanałów
                                    </span>
                                ) : (
                                    supported.map(({ channel, preference }) => {
                                        const key = preferenceKey(
                                            type.type,
                                            channel,
                                        );
                                        const draft = draftPreferences[key];
                                        const checked =
                                            batchPreferences &&
                                            draft !== undefined
                                                ? draft
                                                : Boolean(preference.preferred);
                                        const changed =
                                            batchPreferences &&
                                            checked !==
                                                Boolean(preference.preferred);
                                        const label = `${type.label} — ${CHANNEL_LABELS[channel]}`;

                                        return (
                                            <div
                                                className={
                                                    v18Styles.preferenceChannel
                                                }
                                                key={channel}
                                            >
                                                <span
                                                    className={
                                                        v18Styles.channelName
                                                    }
                                                >
                                                    {CHANNEL_LABELS[channel]}
                                                </span>
                                                {readOnly ? (
                                                    <span
                                                        className={
                                                            checked
                                                                ? v18Styles.statusEnabled
                                                                : v18Styles.statusDisabled
                                                        }
                                                        aria-label={`${label}: ${checked ? 'włączone' : 'wyłączone'}`}
                                                    >
                                                        {checked
                                                            ? 'Włączone'
                                                            : 'Wyłączone'}
                                                    </span>
                                                ) : (
                                                    <label
                                                        className={
                                                            v18Styles.toggleWrap
                                                        }
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className={
                                                                v18Styles.toggle
                                                            }
                                                            checked={checked}
                                                            disabled={busy}
                                                            aria-label={label}
                                                            aria-describedby={`pref-${type.type}-${channel}`}
                                                            onChange={(
                                                                event,
                                                            ) => {
                                                                if (
                                                                    batchPreferences
                                                                ) {
                                                                    setDraftPreferences(
                                                                        (
                                                                            current,
                                                                        ) => ({
                                                                            ...current,
                                                                            [key]: event
                                                                                .target
                                                                                .checked,
                                                                        }),
                                                                    );
                                                                } else {
                                                                    open({
                                                                        kind: 'preference',
                                                                        pref: preference,
                                                                        enabled:
                                                                            event
                                                                                .target
                                                                                .checked,
                                                                    });
                                                                }
                                                            }}
                                                        />
                                                    </label>
                                                )}
                                                {changed ? (
                                                    <small
                                                        id={`pref-${type.type}-${channel}`}
                                                        className={
                                                            v18Styles.unsaved
                                                        }
                                                    >
                                                        Niezapisana zmiana
                                                    </small>
                                                ) : checked &&
                                                  !preference.effectiveAllowed ? (
                                                    <small
                                                        id={`pref-${type.type}-${channel}`}
                                                        className={
                                                            v18Styles.blockedReason
                                                        }
                                                    >
                                                        {
                                                            REASON_LABELS[
                                                                preference
                                                                    .reason
                                                            ]
                                                        }
                                                    </small>
                                                ) : (
                                                    <small
                                                        id={`pref-${type.type}-${channel}`}
                                                        className={
                                                            checked &&
                                                            preference.effectiveAllowed
                                                                ? v18Styles.allowedReason
                                                                : v18Styles.srOnly
                                                        }
                                                    >
                                                        {checked
                                                            ? REASON_LABELS[
                                                                  preference
                                                                      .reason
                                                              ]
                                                            : 'Wyłączone'}
                                                    </small>
                                                )}
                                                {changed ? (
                                                    <small
                                                        className={
                                                            v18Styles.pendingReason
                                                        }
                                                    >
                                                        Ocena wysyłki po
                                                        zapisaniu zmian
                                                    </small>
                                                ) : null}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const renderConsentItems = (items: ConsentScopeView[]) => (
        <ul className={isV18 ? v18Styles.consentList : 'list-unstyled mb-0'}>
            {items.map((c) => (
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
                            stara zgoda bez dowodu — nie uprawnia do marketingu
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
    );

    const renderConsentScopes = () => (
        <section
            aria-label={
                isV18 ? 'Lista zgód marketingowych' : 'Zgody marketingowe'
            }
            className={isV18 ? v18Styles.consents : 'mb-3'}
        >
            {isV18 ? (
                <>
                    <p className={v18Styles.sectionDescription}>
                        Uproszczony podgląd dwóch grup. Każdy kanał zachowuje
                        własną, udokumentowaną zgodę i osobną historię.
                    </p>
                    <div className={v18Styles.groupList}>
                        {V18_CHANNEL_GROUPS.map((group) => {
                            const grant = marketingGroupConsent(data, group);
                            return (
                                <div
                                    className={v18Styles.groupRow}
                                    key={group.id}
                                    data-consent-group={group.id}
                                    data-consent-state={grant.status}
                                >
                                    <div className={v18Styles.groupMeta}>
                                        <strong>{group.label}</strong>
                                        <span>
                                            {marketingStatusLabel[grant.status]}
                                        </span>
                                    </div>
                                    <details
                                        className={v18Styles.groupDetails}
                                    >
                                        <summary>
                                            Zobacz zgody
                                        </summary>
                                        <p className={v18Styles.sectionDescription}>
                                            Zgoda musi obejmować wskazany kanał.
                                            Nie przenosimy jej automatycznie z
                                            SMS na WhatsApp.
                                        </p>
                                        {renderConsentItems(
                                            data.consents.filter(
                                                (consent) =>
                                                    consent.purpose ===
                                                        'DIRECT_MARKETING' &&
                                                    group.channels.some(
                                                        (channel) =>
                                                            channel ===
                                                            consent.channel,
                                                    ),
                                            ),
                                        )}
                                    </details>
                                </div>
                            );
                        })}
                    </div>
                    {data.consents.some(
                        (consent) => consent.purpose !== 'DIRECT_MARKETING',
                    ) && (
                        <details className={v18Styles.marketingDetails}>
                            <summary className={v18Styles.marketingSummary}>
                                Newsletter i prośby o opinie
                            </summary>
                            {renderConsentItems(
                                data.consents.filter(
                                    (consent) =>
                                        consent.purpose !== 'DIRECT_MARKETING',
                                ),
                            )}
                        </details>
                    )}
                </>
            ) : (
                renderConsentItems(data.consents)
            )}
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
                    <details
                        className={v18Styles.section}
                        data-testid="v18-operational-settings"
                    >
                        <summary className={v18Styles.accordionSummary}>
                            <span className={v18Styles.sectionNumber}>01</span>
                            <span className={v18Styles.accordionLabel}>
                                <strong>Powiadomienia o wizytach</strong>
                                <small>
                                    {typesByClass.OPERATIONAL.length} rodzaje
                                    wiadomości · konfiguracja kanałów
                                </small>
                            </span>
                        </summary>
                        <div className={v18Styles.accordionBody}>
                            {!data.receiveNotifications && (
                                <p className={v18Styles.notice} role="status">
                                    Powiadomienia o wizytach są wyłączone na
                                    koncie. Zmiana kanału nie omija blokady.
                                </p>
                            )}
                            <div className={v18Styles.groupList}>
                                {V18_CHANNEL_GROUPS.map((group) => {
                                    const summary = operationalGroupSettings(
                                        data,
                                        group,
                                        draftPreferences,
                                    );
                                    const actionLabel =
                                        summary.status === 'on'
                                            ? 'Wyłącz'
                                            : 'Włącz';

                                    return (
                                        <div
                                            className={v18Styles.groupRow}
                                            key={group.id}
                                            data-preference-group={group.id}
                                            data-preference-state={summary.status}
                                        >
                                            <div className={v18Styles.groupMeta}>
                                                <strong>{group.label}</strong>
                                                <span>
                                                    {groupStatusLabel[
                                                        summary.status
                                                    ]}
                                                    {summary.status === 'partial'
                                                        ? ` · ${summary.enabled}/${summary.total} ustawień`
                                                        : ''}
                                                </span>
                                            </div>
                                            {!readOnly && (
                                                <button
                                                    type="button"
                                                    className={v18Styles.groupAction}
                                                    disabled={
                                                        busy ||
                                                        summary.status ===
                                                            'unavailable'
                                                    }
                                                    aria-label={`${actionLabel} powiadomienia ${group.label}`}
                                                    onClick={() =>
                                                        setDraftPreferences(
                                                            (draft) =>
                                                                setOperationalGroupDraft(
                                                                    data,
                                                                    group,
                                                                    draft,
                                                                    summary.status !==
                                                                        'on',
                                                                ),
                                                        )
                                                    }
                                                >
                                                    {actionLabel}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <details className={v18Styles.marketingDetails}>
                                <summary className={v18Styles.marketingSummary}>
                                    Ustawienia poszczególnych wiadomości
                                </summary>
                                <p className={v18Styles.sectionDescription}>
                                    Opcjonalnie dostosuj kanał dla potwierdzenia,
                                    przypomnienia lub zmiany wizyty. Dostępność
                                    i wysyłka zależą także od ustawień konta.
                                </p>
                                {renderV18Rows(
                                    'Kanały powiadomień',
                                    typesByClass.OPERATIONAL,
                                )}
                            </details>
                        </div>
                    </details>
                    <details
                        className={v18Styles.section}
                        data-testid="v18-marketing-settings"
                    >
                        <summary className={v18Styles.accordionSummary}>
                            <span className={v18Styles.sectionNumber}>02</span>
                            <span className={v18Styles.accordionLabel}>
                                <strong>Marketing i zgody</strong>
                                <small>
                                    {
                                        data.consents.filter(
                                            (c) =>
                                                c.purpose ===
                                                    'DIRECT_MARKETING' &&
                                                c.status === 'GRANTED',
                                        ).length
                                    }{' '}
                                    z 3 kanałów marketingu bezpośredniego
                                </small>
                            </span>
                        </summary>
                        <div className={v18Styles.accordionBody}>
                            <p className={v18Styles.sectionDescription}>
                                Zgody i preferencje są niezależne. Każde
                                udzielenie lub wycofanie zgody jest potwierdzane
                                i zapisywane w historii.
                            </p>
                            {renderConsentScopes()}
                            {typesByClass.MARKETING.length > 0 && (
                                <details className={v18Styles.marketingDetails}>
                                    <summary
                                        className={v18Styles.marketingSummary}
                                    >
                                        Dodatkowe preferencje marketingowe
                                    </summary>
                                    <p className={v18Styles.sectionDescription}>
                                        Możesz ograniczyć typy wiadomości, ale
                                        włączenie preferencji nie zastępuje
                                        zgody.
                                    </p>
                                    {renderV18Rows(
                                        'Dodatkowe ustawienia marketingowe',
                                        typesByClass.MARKETING,
                                    )}
                                </details>
                            )}
                        </div>
                    </details>
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
            {batchPreferences && changedPreferences.length > 0 ? (
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

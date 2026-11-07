import { useMemo, useState } from 'react';
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
import CustomerConsentConfirmation, {
    ConsentConfirmationRequest,
    StaffEvidence,
} from './CustomerConsentConfirmation';

export interface CustomerCommunicationPreferencesProps {
    scope: CommunicationScope;
    /** 'staff' = salon personnel, 'customer' = self-service. */
    audience: 'staff' | 'customer';
}

type PendingAction =
    | { kind: 'grant'; consent: ConsentScopeView }
    | { kind: 'withdraw'; consent: ConsentScopeView }
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
}: CustomerCommunicationPreferencesProps) {
    const catalog = useCommunicationCatalog();
    const state = useCommunicationState(scope);
    const grant = useGrantConsent(scope);
    const withdraw = useWithdrawConsent(scope);
    const updatePrefs = useUpdateCommunicationPreferences(scope);
    const [pending, setPending] = useState<PendingAction | null>(null);
    const [idempotencyKey, setIdempotencyKey] = useState('');

    const busy = grant.isPending || withdraw.isPending || updatePrefs.isPending;

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
        <table className="customer-communication-table">
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
                            return (
                                <td key={ch}>
                                    <input
                                        type="checkbox"
                                        checked={Boolean(pref.preferred)}
                                        disabled={busy}
                                        aria-label={`${t.label} — ${CHANNEL_LABELS[ch]}`}
                                        aria-describedby={`pref-${t.type}-${ch}`}
                                        onChange={(e) =>
                                            open({
                                                kind: 'preference',
                                                pref,
                                                enabled: e.target.checked,
                                            })
                                        }
                                    />
                                    <small
                                        id={`pref-${t.type}-${ch}`}
                                        className={`d-block ${
                                            pref.effectiveAllowed
                                                ? 'text-success'
                                                : 'text-muted'
                                        }`}
                                        data-reason={pref.reason}
                                    >
                                        {REASON_LABELS[pref.reason]}
                                    </small>
                                </td>
                            );
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
    );

    return (
        <div
            className="customer-communication-preferences"
            data-testid="communication-preferences"
        >
            <section aria-label="Zgody marketingowe" className="mb-3">
                <ul className="list-unstyled mb-0">
                    {data.consents.map((c) => (
                        <li
                            key={`${c.purpose}:${c.channel}`}
                            className="d-flex flex-wrap align-items-center gap-2 py-1"
                            data-consent={`${c.purpose}:${c.channel}`}
                            data-status={c.status}
                        >
                            <span className="fw-semibold">{c.label}</span>
                            <span>{CONSENT_STATUS_LABELS[c.status]}</span>
                            {c.legacyUnverifiedConsent && (
                                <span className="text-warning small">
                                    stara zgoda bez dowodu — nie uprawnia do
                                    marketingu
                                </span>
                            )}
                            {c.recordedAt && (
                                <small className="text-muted">
                                    {new Date(c.recordedAt).toLocaleString(
                                        'pl-PL',
                                    )}
                                </small>
                            )}
                            <span className="ms-auto d-flex gap-2">
                                {c.status === 'GRANTED' ? (
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary btn-sm"
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
                                        className="btn btn-outline-dark btn-sm"
                                        disabled={busy}
                                        onClick={() =>
                                            open({ kind: 'grant', consent: c })
                                        }
                                    >
                                        {audience === 'staff'
                                            ? 'Zarejestruj zgodę'
                                            : 'Wyrażam zgodę'}
                                    </button>
                                )}
                            </span>
                        </li>
                    ))}
                </ul>
            </section>
            {!data.receiveNotifications && (
                <p className="small text-warning" role="status">
                    Powiadomienia o wizytach są wyłączone na koncie.
                </p>
            )}
            {renderMatrix('Powiadomienia o wizytach', typesByClass.OPERATIONAL)}
            {renderMatrix('Wiadomości marketingowe', typesByClass.MARKETING)}
            <CustomerConsentConfirmation
                request={request}
                pending={busy}
                onConfirm={confirm}
                onCancel={() => setPending(null)}
            />
        </div>
    );
}

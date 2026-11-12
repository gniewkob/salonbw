import {
    InitialCommunicationSetup,
    STAFF_SOURCE_LABELS,
    StaffGrantSource,
} from '@/api/communicationConsents';
import { useCommunicationCatalog } from '@/hooks/useCommunicationConsents';

interface Props {
    value: InitialCommunicationSetup;
    onChange: (next: InitialCommunicationSetup) => void;
    disabled?: boolean;
    idPrefix: string;
}

/**
 * Consent section of the customer-creation form. Uses the SAME catalogue
 * (purpose × channel scopes + versioned statements) as the customer profile,
 * so creation and editing cannot drift. All marketing scopes start unchecked;
 * any ticked scope requires a real source and evidence reference.
 */
export default function InitialConsentFields({
    value,
    onChange,
    disabled,
    idPrefix,
}: Props) {
    const catalog = useCommunicationCatalog();
    const grants = value.grants ?? [];
    const isChecked = (purpose: string, channel: string) =>
        grants.some((g) => g.purpose === purpose && g.channel === channel);

    if (catalog.isLoading) {
        return <p className="text-muted small">Ładowanie zgód…</p>;
    }
    if (catalog.isError || !catalog.data) {
        return (
            <p className="text-danger small" role="alert">
                Nie udało się pobrać listy zgód. Klienta można dodać bez zgód
                marketingowych.
            </p>
        );
    }

    return (
        <fieldset
            className="customer-new-consents"
            data-testid="initial-consents"
        >
            <legend className="small fw-semibold">
                Zgody marketingowe (tylko jeśli klient faktycznie ich udzielił)
            </legend>
            {catalog.data.consentScopes.map((scope) => {
                const id = `${idPrefix}-consent-${scope.purpose}-${scope.channel}`;
                return (
                    <div
                        key={id}
                        className="customer-new-row customer-new-row--checkbox"
                    >
                        <label htmlFor={id} title={scope.text}>
                            {scope.label}
                        </label>
                        <input
                            id={id}
                            type="checkbox"
                            checked={isChecked(scope.purpose, scope.channel)}
                            disabled={disabled}
                            onChange={(e) => {
                                const rest = grants.filter(
                                    (g) =>
                                        !(
                                            g.purpose === scope.purpose &&
                                            g.channel === scope.channel
                                        ),
                                );
                                onChange({
                                    ...value,
                                    grants: e.target.checked
                                        ? [
                                              ...rest,
                                              {
                                                  purpose: scope.purpose,
                                                  channel: scope.channel,
                                                  consentTextVersion:
                                                      scope.textVersion,
                                              },
                                          ]
                                        : rest,
                                });
                            }}
                        />
                    </div>
                );
            })}
            {grants.length > 0 && (
                <>
                    <div className="customer-new-row">
                        <label htmlFor={`${idPrefix}-consent-source`}>
                            Źródło zgody
                        </label>
                        <select
                            id={`${idPrefix}-consent-source`}
                            className="form-select"
                            required
                            disabled={disabled}
                            value={value.source ?? ''}
                            onChange={(e) =>
                                onChange({
                                    ...value,
                                    source:
                                        (e.target.value as StaffGrantSource) ||
                                        undefined,
                                })
                            }
                        >
                            <option value="">Wybierz…</option>
                            {catalog.data.staffGrantSources.map((s) => (
                                <option key={s} value={s}>
                                    {STAFF_SOURCE_LABELS[s]}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="customer-new-row">
                        <label htmlFor={`${idPrefix}-consent-evidence`}>
                            Odniesienie do dowodu
                        </label>
                        <input
                            id={`${idPrefix}-consent-evidence`}
                            className="form-control"
                            required
                            minLength={3}
                            maxLength={500}
                            disabled={disabled}
                            placeholder="np. numer podpisanego formularza"
                            value={value.evidenceReference ?? ''}
                            onChange={(e) =>
                                onChange({
                                    ...value,
                                    evidenceReference: e.target.value,
                                })
                            }
                        />
                    </div>
                </>
            )}
        </fieldset>
    );
}

/** Payload for POST /customers — omits the section when nothing was chosen. */
export function toCommunicationPayload(
    value: InitialCommunicationSetup | undefined,
): InitialCommunicationSetup | undefined {
    if (!value) return undefined;
    const hasGrants = (value.grants?.length ?? 0) > 0;
    const hasPrefs = (value.preferences?.length ?? 0) > 0;
    if (!hasGrants && !hasPrefs) return undefined;
    return {
        ...(hasGrants
            ? {
                  grants: value.grants,
                  source: value.source,
                  evidenceReference: value.evidenceReference?.trim(),
              }
            : {}),
        ...(hasPrefs ? { preferences: value.preferences } : {}),
    };
}

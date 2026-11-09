import V18DateInput from '@/components/ui/V18DateInput';
import { landingUrl } from '@/utils/landingUrl';
import V18Select from '@/components/ui/V18Select';
import type { Gender } from '@/types';
import type { InitialCommunicationSetup } from '@/api/communicationConsents';
import InitialConsentFields from '@/components/communication/InitialConsentFields';

export type CustomerFormDraft = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    birthDate: string;
    gender: '' | Gender;
    address: string;
    buildingNo: string;
    apartmentNo: string;
    city: string;
    postalCode: string;
    country: string;
    nameDay: string;
    origin: string;
    pesel: string;
    nip: string;
    cardNumber: string;
    groups: string;
    description: string;
    gdprConsent: boolean;
    termsConsent: boolean;
    notifyPanel: boolean;
    /**
     * Initial marketing consents with evidence — same catalogue as the
     * customer profile (CustomerCommunicationPreferences). Never pre-ticked.
     */
    communication?: InitialCommunicationSetup;
    /** Standing discount percent (0–100) as a string; '' = none. Admin-set. */
    discountPercent?: string;
};

export type CustomerFormOnChange = <K extends keyof CustomerFormDraft>(
    key: K,
    value: CustomerFormDraft[K],
) => void;

interface Props {
    values: CustomerFormDraft;
    onChange: CustomerFormOnChange;
    disabled?: boolean;
    /** Prefix for input `id` attributes, e.g. "customer-new" or "customer-personal" */
    fieldIdPrefix: string;
    autoFocusFirstName?: boolean;
    /** V18: hide fields not persisted by the existing customer DTO. */
    supportedOnly?: boolean;
    /** Use the localized calendar only within V18 screens. */
    datePickerVariant?: 'native' | 'v18';
    /**
     * 'create' captures initial marketing consents with evidence; 'edit'
     * points to the audited consent section instead (no plain toggles).
     */
    mode?: 'create' | 'edit';
}

export default function CustomerFormFields({
    mode = 'create',
    values,
    onChange,
    disabled,
    fieldIdPrefix,
    autoFocusFirstName,
    supportedOnly = false,
    datePickerVariant = 'native',
}: Props) {
    return (
        <>
            <div className="customer-new-section" id="customer-form-basic">
                <h4>dane podstawowe</h4>
                <div className="customer-new-row">
                    <label htmlFor={`${fieldIdPrefix}-first-name`}>
                        {supportedOnly ? 'Imię' : '1. Imię'}
                    </label>
                    <input
                        id={`${fieldIdPrefix}-first-name`}
                        className="form-control"
                        type="text"
                        autoComplete="given-name"
                        value={values.firstName}
                        onChange={(e) => onChange('firstName', e.target.value)}
                        disabled={disabled}
                        autoFocus={autoFocusFirstName}
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor={`${fieldIdPrefix}-last-name`}>
                        {supportedOnly ? 'Nazwisko' : '2. Nazwisko'}
                    </label>
                    <input
                        id={`${fieldIdPrefix}-last-name`}
                        className="form-control"
                        type="text"
                        autoComplete="family-name"
                        value={values.lastName}
                        onChange={(e) => onChange('lastName', e.target.value)}
                        disabled={disabled}
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor={`${fieldIdPrefix}-email`}>
                        {supportedOnly ? 'E-mail' : '3. Email'}
                    </label>
                    <input
                        id={`${fieldIdPrefix}-email`}
                        className="form-control"
                        type="email"
                        autoComplete="email"
                        value={values.email}
                        onChange={(e) => onChange('email', e.target.value)}
                        disabled={disabled}
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor={`${fieldIdPrefix}-phone`}>
                        {supportedOnly ? 'Telefon' : '4. Telefon'}
                    </label>
                    <input
                        id={`${fieldIdPrefix}-phone`}
                        className="form-control"
                        type="tel"
                        autoComplete="tel"
                        value={values.phone}
                        onChange={(e) => onChange('phone', e.target.value)}
                        disabled={disabled}
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor={`${fieldIdPrefix}-gender`}>
                        {supportedOnly ? 'Płeć' : '5. Płeć'}
                    </label>
                    {supportedOnly || datePickerVariant === 'v18' ? (
                        <V18Select
                            id={`${fieldIdPrefix}-gender`}
                            ariaLabel={supportedOnly ? 'Płeć' : '5. Płeć'}
                            value={values.gender}
                            onChange={(value) =>
                                onChange(
                                    'gender',
                                    value as CustomerFormDraft['gender'],
                                )
                            }
                            disabled={disabled}
                            options={[
                                { value: '', label: 'Nie podano' },
                                { value: 'female', label: 'Kobieta' },
                                { value: 'male', label: 'Mężczyzna' },
                                { value: 'other', label: 'Inna' },
                            ]}
                        />
                    ) : (
                        <select
                            id={`${fieldIdPrefix}-gender`}
                            className="form-control"
                            value={values.gender}
                            onChange={(e) =>
                                onChange(
                                    'gender',
                                    (e.target.value ||
                                        '') as CustomerFormDraft['gender'],
                                )
                            }
                            disabled={disabled}
                        >
                            <option value="">Nie podano</option>
                            <option value="female">Kobieta</option>
                            <option value="male">Mężczyzna</option>
                            <option value="other">Inna</option>
                        </select>
                    )}
                </div>
                <div className="customer-new-row customer-new-row--consent">
                    <span className="form-label d-block">
                        {supportedOnly
                            ? 'Informacje formalne'
                            : '6. Zgody udzielone przez klienta'}
                    </span>
                    <div className="customer-consent-box">
                        {supportedOnly ? (
                            <>
                                Dane klienta wykorzystujemy do obsługi
                                rezerwacji i realizacji usług. Informacje o
                                celach, podstawach i prawach osób znajdziesz w{' '}
                                <a
                                    href={landingUrl('/privacy')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Polityce prywatności
                                </a>
                                . Nie wymagamy ogólnej zgody na przetwarzanie
                                danych niezbędnych do realizacji usługi.
                            </>
                        ) : (
                            'Pamiętaj o dopełnieniu obowiązku informacyjnego w zakresie realizacji umowy.'
                        )}
                    </div>
                </div>
                {!supportedOnly && (
                    <div className="customer-new-row customer-new-row--checkbox">
                        <label htmlFor={`${fieldIdPrefix}-gdpr-consent`}>
                            Wyrażam zgodę na przetwarzanie danych osobowych
                        </label>
                        <input
                            id={`${fieldIdPrefix}-gdpr-consent`}
                            type="checkbox"
                            checked={values.gdprConsent}
                            onChange={(e) =>
                                onChange('gdprConsent', e.target.checked)
                            }
                            disabled={disabled}
                        />
                    </div>
                )}
                <div className="customer-new-row customer-new-row--checkbox">
                    <label htmlFor={`${fieldIdPrefix}-terms-consent`}>
                        Akceptacja regulaminu salonu
                    </label>
                    <input
                        id={`${fieldIdPrefix}-terms-consent`}
                        type="checkbox"
                        checked={values.termsConsent}
                        onChange={(e) =>
                            onChange('termsConsent', e.target.checked)
                        }
                        disabled={disabled}
                    />
                </div>
            </div>

            <div className="customer-new-section" id="customer-form-extended">
                <h4>dane rozszerzone</h4>
                <div className="customer-new-row">
                    <label htmlFor={`${fieldIdPrefix}-birth-date`}>
                        {supportedOnly ? 'Data urodzenia' : '7. Data urodzenia'}
                    </label>
                    {supportedOnly || datePickerVariant === 'v18' ? (
                        <V18DateInput
                            id={`${fieldIdPrefix}-birth-date`}
                            mode="date"
                            value={values.birthDate}
                            onChange={(value) => onChange('birthDate', value)}
                            disabled={disabled}
                        />
                    ) : (
                        <input
                            id={`${fieldIdPrefix}-birth-date`}
                            className="form-control"
                            type="date"
                            value={values.birthDate}
                            onChange={(e) =>
                                onChange('birthDate', e.target.value)
                            }
                            disabled={disabled}
                        />
                    )}
                </div>
                <div className="customer-new-row">
                    <label htmlFor={`${fieldIdPrefix}-address`}>
                        {supportedOnly ? 'Ulica' : '8. Ulica'}
                    </label>
                    <input
                        id={`${fieldIdPrefix}-address`}
                        className="form-control"
                        value={values.address}
                        onChange={(e) => onChange('address', e.target.value)}
                        disabled={disabled}
                    />
                </div>
                {!supportedOnly ? (
                    <div className="customer-new-row">
                        <label htmlFor={`${fieldIdPrefix}-building-no`}>
                            9. Nr domu
                        </label>
                        <input
                            id={`${fieldIdPrefix}-building-no`}
                            className="form-control"
                            value={values.buildingNo}
                            onChange={(e) =>
                                onChange('buildingNo', e.target.value)
                            }
                            disabled={disabled}
                        />
                    </div>
                ) : null}
                {!supportedOnly ? (
                    <div className="customer-new-row">
                        <label htmlFor={`${fieldIdPrefix}-apartment-no`}>
                            10. Nr lokalu
                        </label>
                        <input
                            id={`${fieldIdPrefix}-apartment-no`}
                            className="form-control"
                            value={values.apartmentNo}
                            onChange={(e) =>
                                onChange('apartmentNo', e.target.value)
                            }
                            disabled={disabled}
                        />
                    </div>
                ) : null}
                <div className="customer-new-row">
                    <label htmlFor={`${fieldIdPrefix}-postal-code`}>
                        {supportedOnly ? 'Kod pocztowy' : '11. Kod pocztowy'}
                    </label>
                    <input
                        id={`${fieldIdPrefix}-postal-code`}
                        className="form-control"
                        value={values.postalCode}
                        onChange={(e) => onChange('postalCode', e.target.value)}
                        disabled={disabled}
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor={`${fieldIdPrefix}-city`}>
                        {supportedOnly ? 'Miasto' : '12. Miasto'}
                    </label>
                    <input
                        id={`${fieldIdPrefix}-city`}
                        className="form-control"
                        value={values.city}
                        onChange={(e) => onChange('city', e.target.value)}
                        disabled={disabled}
                    />
                </div>
                {!supportedOnly ? (
                    <div className="customer-new-row">
                        <label htmlFor={`${fieldIdPrefix}-country`}>
                            13. Kraj
                        </label>
                        <input
                            id={`${fieldIdPrefix}-country`}
                            className="form-control"
                            value={values.country}
                            onChange={(e) =>
                                onChange('country', e.target.value)
                            }
                            disabled={disabled}
                        />
                    </div>
                ) : null}
                {!supportedOnly ? (
                    <div className="customer-new-row">
                        <label htmlFor={`${fieldIdPrefix}-name-day`}>
                            14. Data imienin
                        </label>
                        <input
                            id={`${fieldIdPrefix}-name-day`}
                            className="form-control"
                            value={values.nameDay}
                            onChange={(e) =>
                                onChange('nameDay', e.target.value)
                            }
                            disabled={disabled}
                        />
                    </div>
                ) : null}
                {!supportedOnly ? (
                    <div className="customer-new-row">
                        <label htmlFor={`${fieldIdPrefix}-groups`}>
                            15. Grupy
                        </label>
                        <input
                            id={`${fieldIdPrefix}-groups`}
                            className="form-control"
                            value={values.groups}
                            onChange={(e) => onChange('groups', e.target.value)}
                            disabled={disabled}
                            placeholder="kliknij, aby dodać do grupy"
                        />
                    </div>
                ) : null}
                {!supportedOnly ? (
                    <div className="customer-new-row">
                        <label htmlFor={`${fieldIdPrefix}-origin`}>
                            16. Pochodzenie klienta
                        </label>
                        <input
                            id={`${fieldIdPrefix}-origin`}
                            className="form-control"
                            value={values.origin}
                            onChange={(e) => onChange('origin', e.target.value)}
                            disabled={disabled}
                        />
                    </div>
                ) : null}
                {!supportedOnly ? (
                    <div className="customer-new-row">
                        <label htmlFor={`${fieldIdPrefix}-pesel`}>
                            17. PESEL
                        </label>
                        <input
                            id={`${fieldIdPrefix}-pesel`}
                            className="form-control"
                            value={values.pesel}
                            onChange={(e) => onChange('pesel', e.target.value)}
                            disabled={disabled}
                        />
                    </div>
                ) : null}
                {!supportedOnly ? (
                    <div className="customer-new-row">
                        <label htmlFor={`${fieldIdPrefix}-nip`}>18. NIP</label>
                        <input
                            id={`${fieldIdPrefix}-nip`}
                            className="form-control"
                            value={values.nip}
                            onChange={(e) => onChange('nip', e.target.value)}
                            disabled={disabled}
                        />
                    </div>
                ) : null}
                {!supportedOnly ? (
                    <div className="customer-new-row">
                        <label htmlFor={`${fieldIdPrefix}-card-number`}>
                            19. Numer karty
                        </label>
                        <input
                            id={`${fieldIdPrefix}-card-number`}
                            className="form-control"
                            value={values.cardNumber}
                            onChange={(e) =>
                                onChange('cardNumber', e.target.value)
                            }
                            disabled={disabled}
                        />
                    </div>
                ) : null}
                <div className="customer-new-row">
                    <label htmlFor={`${fieldIdPrefix}-description`}>
                        {supportedOnly ? 'Opis' : '20. Opis'}
                    </label>
                    <textarea
                        id={`${fieldIdPrefix}-description`}
                        className="form-control"
                        value={values.description}
                        onChange={(e) =>
                            onChange('description', e.target.value)
                        }
                        disabled={disabled}
                    />
                </div>
            </div>

            <div className="customer-new-section" id="customer-form-advanced">
                <h4>
                    Zaawansowane{' '}
                    <span className="customer-advanced-hint">Pokaż</span>
                </h4>
                <div className="customer-new-row">
                    <label htmlFor={`${fieldIdPrefix}-discount`}>
                        Stały rabat (%)
                    </label>
                    <input
                        id={`${fieldIdPrefix}-discount`}
                        type="number"
                        min={0}
                        max={100}
                        step="0.5"
                        className="form-control"
                        value={values.discountPercent ?? ''}
                        onChange={(e) =>
                            onChange('discountPercent', e.target.value)
                        }
                        disabled={disabled}
                        placeholder="np. 10"
                        aria-describedby={`${fieldIdPrefix}-discount-hint`}
                    />
                    <small
                        id={`${fieldIdPrefix}-discount-hint`}
                        className="text-muted d-block mt-1"
                    >
                        Auto-podpowiada się przy finalizacji. Puste = rabat z
                        grupy klienta lub brak.
                    </small>
                </div>
                <div className="customer-new-row customer-new-row--checkbox">
                    <label htmlFor={`${fieldIdPrefix}-notify-panel`}>
                        Powiadomienia w panelu klienta
                    </label>
                    <input
                        id={`${fieldIdPrefix}-notify-panel`}
                        type="checkbox"
                        checked={values.notifyPanel}
                        onChange={(e) =>
                            onChange('notifyPanel', e.target.checked)
                        }
                        disabled={disabled}
                    />
                </div>
                {mode === 'create' ? (
                    <InitialConsentFields
                        idPrefix={fieldIdPrefix}
                        value={values.communication ?? { grants: [] }}
                        disabled={disabled}
                        onChange={(next) => onChange('communication', next)}
                    />
                ) : (
                    <p className="small text-muted mb-0">
                        Zgody marketingowe i preferencje zmienisz w zakładce
                        Komunikacja (z potwierdzeniem i historią zmian).
                    </p>
                )}
            </div>
        </>
    );
}

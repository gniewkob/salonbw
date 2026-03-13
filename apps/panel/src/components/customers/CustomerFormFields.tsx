import { useEffect, useRef } from 'react';
import type { Gender } from '@/types';

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
    emailConsent: boolean;
    smsConsent: boolean;
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
}

export default function CustomerFormFields({
    values,
    onChange,
    disabled,
    fieldIdPrefix,
    autoFocusFirstName,
}: Props) {
    const consentCheckboxRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (consentCheckboxRef.current) {
            consentCheckboxRef.current.indeterminate =
                values.emailConsent !== values.smsConsent;
        }
    }, [values.emailConsent, values.smsConsent]);

    return (
        <>
            <div className="customer-new-section" id="customer-form-basic">
                <h4>dane podstawowe</h4>
                <div className="customer-new-row">
                    <label htmlFor={`${fieldIdPrefix}-first-name`}>
                        1. Imię
                    </label>
                    <input
                        id={`${fieldIdPrefix}-first-name`}
                        className="form-control"
                        value={values.firstName}
                        onChange={(e) => onChange('firstName', e.target.value)}
                        disabled={disabled}
                        autoFocus={autoFocusFirstName}
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor={`${fieldIdPrefix}-last-name`}>
                        2. Nazwisko
                    </label>
                    <input
                        id={`${fieldIdPrefix}-last-name`}
                        className="form-control"
                        value={values.lastName}
                        onChange={(e) => onChange('lastName', e.target.value)}
                        disabled={disabled}
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor={`${fieldIdPrefix}-email`}>3. Email</label>
                    <input
                        id={`${fieldIdPrefix}-email`}
                        className="form-control"
                        value={values.email}
                        onChange={(e) => onChange('email', e.target.value)}
                        disabled={disabled}
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor={`${fieldIdPrefix}-phone`}>4. Telefon</label>
                    <input
                        id={`${fieldIdPrefix}-phone`}
                        className="form-control"
                        value={values.phone}
                        onChange={(e) => onChange('phone', e.target.value)}
                        disabled={disabled}
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor={`${fieldIdPrefix}-gender`}>5. Płeć</label>
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
                </div>
                <div className="customer-new-row customer-new-row--consent">
                    <label>7. Zgody udzielone przez klienta</label>
                    <div className="customer-consent-box">
                        Pamiętaj o dopełnieniu obowiązku informacyjnego w
                        zakresie realizacji umowy.
                    </div>
                </div>
                <div className="customer-new-row customer-new-row--checkbox">
                    <label htmlFor={`${fieldIdPrefix}-consent`}>
                        Wyrażam zgodę na przetwarzanie danych osobowych
                    </label>
                    <input
                        ref={consentCheckboxRef}
                        id={`${fieldIdPrefix}-consent`}
                        type="checkbox"
                        checked={values.emailConsent && values.smsConsent}
                        onChange={(e) => {
                            onChange('emailConsent', e.target.checked);
                            onChange('smsConsent', e.target.checked);
                        }}
                        disabled={disabled}
                    />
                </div>
            </div>

            <div className="customer-new-section" id="customer-form-extended">
                <h4>dane rozszerzone</h4>
                <div className="customer-new-row">
                    <label htmlFor={`${fieldIdPrefix}-birth-date`}>
                        8. Data urodzenia
                    </label>
                    <input
                        id={`${fieldIdPrefix}-birth-date`}
                        className="form-control"
                        type="date"
                        value={values.birthDate}
                        onChange={(e) => onChange('birthDate', e.target.value)}
                        disabled={disabled}
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor={`${fieldIdPrefix}-address`}>9. Ulica</label>
                    <input
                        id={`${fieldIdPrefix}-address`}
                        className="form-control"
                        value={values.address}
                        onChange={(e) => onChange('address', e.target.value)}
                        disabled={disabled}
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor={`${fieldIdPrefix}-building-no`}>
                        10. Nr domu
                    </label>
                    <input
                        id={`${fieldIdPrefix}-building-no`}
                        className="form-control"
                        value={values.buildingNo}
                        onChange={(e) => onChange('buildingNo', e.target.value)}
                        disabled={disabled}
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor={`${fieldIdPrefix}-apartment-no`}>
                        11. Nr lokalu
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
                <div className="customer-new-row">
                    <label htmlFor={`${fieldIdPrefix}-postal-code`}>
                        12. Kod pocztowy
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
                    <label htmlFor={`${fieldIdPrefix}-city`}>13. Miasto</label>
                    <input
                        id={`${fieldIdPrefix}-city`}
                        className="form-control"
                        value={values.city}
                        onChange={(e) => onChange('city', e.target.value)}
                        disabled={disabled}
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor={`${fieldIdPrefix}-country`}>14. Kraj</label>
                    <input
                        id={`${fieldIdPrefix}-country`}
                        className="form-control"
                        value={values.country}
                        onChange={(e) => onChange('country', e.target.value)}
                        disabled={disabled}
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor={`${fieldIdPrefix}-name-day`}>
                        15. Data imienin
                    </label>
                    <input
                        id={`${fieldIdPrefix}-name-day`}
                        className="form-control"
                        value={values.nameDay}
                        onChange={(e) => onChange('nameDay', e.target.value)}
                        disabled={disabled}
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor={`${fieldIdPrefix}-groups`}>16. Grupy</label>
                    <input
                        id={`${fieldIdPrefix}-groups`}
                        className="form-control"
                        value={values.groups}
                        onChange={(e) => onChange('groups', e.target.value)}
                        disabled={disabled}
                        placeholder="kliknij, aby dodać do grupy"
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor={`${fieldIdPrefix}-origin`}>
                        17. Pochodzenie klienta
                    </label>
                    <input
                        id={`${fieldIdPrefix}-origin`}
                        className="form-control"
                        value={values.origin}
                        onChange={(e) => onChange('origin', e.target.value)}
                        disabled={disabled}
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor={`${fieldIdPrefix}-pesel`}>18. PESEL</label>
                    <input
                        id={`${fieldIdPrefix}-pesel`}
                        className="form-control"
                        value={values.pesel}
                        onChange={(e) => onChange('pesel', e.target.value)}
                        disabled={disabled}
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor={`${fieldIdPrefix}-nip`}>19. NIP</label>
                    <input
                        id={`${fieldIdPrefix}-nip`}
                        className="form-control"
                        value={values.nip}
                        onChange={(e) => onChange('nip', e.target.value)}
                        disabled={disabled}
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor={`${fieldIdPrefix}-card-number`}>
                        20. Numer karty
                    </label>
                    <input
                        id={`${fieldIdPrefix}-card-number`}
                        className="form-control"
                        value={values.cardNumber}
                        onChange={(e) => onChange('cardNumber', e.target.value)}
                        disabled={disabled}
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor={`${fieldIdPrefix}-description`}>
                        21. Opis
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
                <div className="customer-new-row customer-new-row--checkbox">
                    <label htmlFor={`${fieldIdPrefix}-email-consent`}>
                        Zgoda na kontakt email
                    </label>
                    <input
                        id={`${fieldIdPrefix}-email-consent`}
                        type="checkbox"
                        checked={values.emailConsent}
                        onChange={(e) =>
                            onChange('emailConsent', e.target.checked)
                        }
                        disabled={disabled}
                    />
                </div>
                <div className="customer-new-row customer-new-row--checkbox">
                    <label htmlFor={`${fieldIdPrefix}-sms-consent`}>
                        Zgoda na kontakt SMS
                    </label>
                    <input
                        id={`${fieldIdPrefix}-sms-consent`}
                        type="checkbox"
                        checked={values.smsConsent}
                        onChange={(e) =>
                            onChange('smsConsent', e.target.checked)
                        }
                        disabled={disabled}
                    />
                </div>
            </div>
        </>
    );
}

'use client';

import { useEffect, useState } from 'react';
import type { Customer } from '@/types';

interface Props {
    customer: Customer;
    onUpdate?: (data: Partial<Customer>) => Promise<void> | void;
}

type Draft = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    birthDate: string;
    gender: '' | 'female' | 'male' | 'other';
    address: string;
    buildingNo: string;
    apartmentNo: string;
    city: string;
    postalCode: string;
    country: string;
    nameDay: string;
    groups: string;
    origin: string;
    pesel: string;
    nip: string;
    cardNumber: string;
    description: string;
    emailConsent: boolean;
    smsConsent: boolean;
};

function toDraft(customer: Customer): Draft {
    return {
        firstName: customer.firstName || '',
        lastName: customer.lastName || '',
        email: customer.email || '',
        phone: customer.phone || '',
        birthDate: customer.birthDate || '',
        gender: customer.gender || '',
        address: customer.address || '',
        buildingNo: '',
        apartmentNo: '',
        city: customer.city || '',
        postalCode: customer.postalCode || '',
        country: '',
        nameDay: '',
        groups: '',
        origin: '',
        pesel: '',
        nip: '',
        cardNumber: '',
        description: customer.description || '',
        emailConsent: customer.emailConsent,
        smsConsent: customer.smsConsent,
    };
}

export default function CustomerPersonalDataTab({ customer, onUpdate }: Props) {
    const [draft, setDraft] = useState<Draft>(() => toDraft(customer));
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        setDraft(toDraft(customer));
        setIsDirty(false);
    }, [customer, customer.id, customer.updatedAt]);

    const updateField = <K extends keyof Draft>(key: K, value: Draft[K]) => {
        setDraft((prev) => ({ ...prev, [key]: value }));
        setIsDirty(true);
    };

    const handleSave = async () => {
        if (!onUpdate || isSaving) return;
        setIsSaving(true);
        try {
            await onUpdate({
                firstName: draft.firstName || undefined,
                lastName: draft.lastName || undefined,
                email: draft.email || undefined,
                phone: draft.phone || undefined,
                birthDate: draft.birthDate || undefined,
                gender: draft.gender || undefined,
                address: draft.address || undefined,
                city: draft.city || undefined,
                postalCode: draft.postalCode || undefined,
                description: draft.description || undefined,
                emailConsent: draft.emailConsent,
                smsConsent: draft.smsConsent,
            });
            setIsDirty(false);
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setDraft(toDraft(customer));
        setIsDirty(false);
    };

    return (
        <div className="customer-personal-form customer-form-legacy">
            <div className="customer-new-section" id="customer-form-basic">
                <h4>dane podstawowe</h4>
                <div className="customer-new-row">
                    <label htmlFor="customer-personal-first-name">
                        1. Imię
                    </label>
                    <input
                        id="customer-personal-first-name"
                        className="form-control"
                        value={draft.firstName}
                        onChange={(e) =>
                            updateField('firstName', e.target.value)
                        }
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor="customer-personal-last-name">
                        2. Nazwisko
                    </label>
                    <input
                        id="customer-personal-last-name"
                        className="form-control"
                        value={draft.lastName}
                        onChange={(e) =>
                            updateField('lastName', e.target.value)
                        }
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor="customer-personal-email">3. Email</label>
                    <input
                        id="customer-personal-email"
                        className="form-control"
                        value={draft.email}
                        onChange={(e) => updateField('email', e.target.value)}
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor="customer-personal-phone">4. Telefon</label>
                    <input
                        id="customer-personal-phone"
                        className="form-control"
                        value={draft.phone}
                        onChange={(e) => updateField('phone', e.target.value)}
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor="customer-personal-gender">5. Płeć</label>
                    <select
                        id="customer-personal-gender"
                        className="form-control"
                        value={draft.gender}
                        onChange={(e) =>
                            updateField(
                                'gender',
                                (e.target.value || '') as Draft['gender'],
                            )
                        }
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
                    <label htmlFor="customer-personal-gdpr">
                        Wyrażam zgodę na przetwarzanie danych osobowych
                    </label>
                    <input
                        id="customer-personal-gdpr"
                        type="checkbox"
                        checked={draft.emailConsent || draft.smsConsent}
                        onChange={(e) => {
                            updateField('emailConsent', e.target.checked);
                            updateField('smsConsent', e.target.checked);
                        }}
                    />
                </div>
            </div>

            <div className="customer-new-section" id="customer-form-extended">
                <h4>dane rozszerzone</h4>
                <div className="customer-new-row">
                    <label htmlFor="customer-personal-birth-date">
                        8. Data urodzenia
                    </label>
                    <input
                        id="customer-personal-birth-date"
                        type="date"
                        className="form-control"
                        value={draft.birthDate}
                        onChange={(e) =>
                            updateField('birthDate', e.target.value)
                        }
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor="customer-personal-address">9. Ulica</label>
                    <input
                        id="customer-personal-address"
                        className="form-control"
                        value={draft.address}
                        onChange={(e) => updateField('address', e.target.value)}
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor="customer-personal-postal-code">
                        10. Nr domu
                    </label>
                    <input
                        id="customer-personal-building-no"
                        className="form-control"
                        value={draft.buildingNo}
                        onChange={(e) =>
                            updateField('buildingNo', e.target.value)
                        }
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor="customer-personal-apartment-no">
                        11. Nr lokalu
                    </label>
                    <input
                        id="customer-personal-apartment-no"
                        className="form-control"
                        value={draft.apartmentNo}
                        onChange={(e) =>
                            updateField('apartmentNo', e.target.value)
                        }
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor="customer-personal-postal-code">
                        12. Kod pocztowy
                    </label>
                    <input
                        id="customer-personal-postal-code"
                        className="form-control"
                        value={draft.postalCode}
                        onChange={(e) =>
                            updateField('postalCode', e.target.value)
                        }
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor="customer-personal-city">13. Miasto</label>
                    <input
                        id="customer-personal-city"
                        className="form-control"
                        value={draft.city}
                        onChange={(e) => updateField('city', e.target.value)}
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor="customer-personal-country">14. Kraj</label>
                    <input
                        id="customer-personal-country"
                        className="form-control"
                        value={draft.country}
                        onChange={(e) => updateField('country', e.target.value)}
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor="customer-personal-name-day">
                        15. Data imienin
                    </label>
                    <input
                        id="customer-personal-name-day"
                        className="form-control"
                        value={draft.nameDay}
                        onChange={(e) => updateField('nameDay', e.target.value)}
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor="customer-personal-groups">16. Grupy</label>
                    <input
                        id="customer-personal-groups"
                        className="form-control"
                        value={draft.groups}
                        onChange={(e) => updateField('groups', e.target.value)}
                        placeholder="kliknij, aby dodać do grupy"
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor="customer-personal-origin">
                        17. Pochodzenie klienta
                    </label>
                    <input
                        id="customer-personal-origin"
                        className="form-control"
                        value={draft.origin}
                        onChange={(e) => updateField('origin', e.target.value)}
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor="customer-personal-pesel">18. PESEL</label>
                    <input
                        id="customer-personal-pesel"
                        className="form-control"
                        value={draft.pesel}
                        onChange={(e) => updateField('pesel', e.target.value)}
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor="customer-personal-nip">19. NIP</label>
                    <input
                        id="customer-personal-nip"
                        className="form-control"
                        value={draft.nip}
                        onChange={(e) => updateField('nip', e.target.value)}
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor="customer-personal-card-number">
                        20. Numer karty
                    </label>
                    <input
                        id="customer-personal-card-number"
                        className="form-control"
                        value={draft.cardNumber}
                        onChange={(e) =>
                            updateField('cardNumber', e.target.value)
                        }
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor="customer-personal-description">
                        21. Opis
                    </label>
                    <textarea
                        id="customer-personal-description"
                        className="form-control"
                        value={draft.description}
                        onChange={(e) =>
                            updateField('description', e.target.value)
                        }
                    />
                </div>
            </div>

            <div className="customer-new-section" id="customer-form-advanced">
                <h4>
                    Zaawansowane{' '}
                    <span className="customer-advanced-hint">Pokaż</span>
                </h4>
                <div className="customer-new-row customer-new-row--checkbox">
                    <label htmlFor="customer-personal-email-consent">
                        Zgoda na kontakt email
                    </label>
                    <input
                        id="customer-personal-email-consent"
                        type="checkbox"
                        checked={draft.emailConsent}
                        onChange={(e) =>
                            updateField('emailConsent', e.target.checked)
                        }
                    />
                </div>
                <div className="customer-new-row customer-new-row--checkbox">
                    <label htmlFor="customer-personal-sms-consent">
                        Zgoda na kontakt SMS
                    </label>
                    <input
                        id="customer-personal-sms-consent"
                        type="checkbox"
                        checked={draft.smsConsent}
                        onChange={(e) =>
                            updateField('smsConsent', e.target.checked)
                        }
                    />
                </div>
            </div>

            <div className="customer-new-actions customer-new-actions--sticky">
                <button
                    type="button"
                    className="btn btn-primary btn-xs"
                    onClick={() => void handleSave()}
                    disabled={!isDirty || isSaving}
                >
                    {isSaving ? 'zapisywanie...' : 'zapisz zmiany'}
                </button>
                <button
                    type="button"
                    className="btn btn-default btn-xs"
                    onClick={handleReset}
                    disabled={!isDirty || isSaving}
                >
                    anuluj
                </button>
            </div>
        </div>
    );
}

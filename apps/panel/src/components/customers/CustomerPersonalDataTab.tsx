'use client';

import { useState } from 'react';
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
    city: string;
    postalCode: string;
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
        city: customer.city || '',
        postalCode: customer.postalCode || '',
        description: customer.description || '',
        emailConsent: customer.emailConsent,
        smsConsent: customer.smsConsent,
    };
}

export default function CustomerPersonalDataTab({ customer, onUpdate }: Props) {
    const [draft, setDraft] = useState<Draft>(() => toDraft(customer));
    const [isSaving, setIsSaving] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

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
        <div className="customer-personal-form">
            <div className="customer-personal-actions">
                <button
                    type="button"
                    className="btn btn-default btn-xs"
                    onClick={handleReset}
                    disabled={!isDirty || isSaving}
                >
                    anuluj
                </button>
                <button
                    type="button"
                    className="btn btn-primary btn-xs"
                    onClick={() => void handleSave()}
                    disabled={!isDirty || isSaving}
                >
                    {isSaving ? 'zapisywanie...' : 'zapisz'}
                </button>
            </div>

            <div className="customer-new-section">
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
            </div>

            <div className="customer-new-section">
                <h4>dane rozszerzone</h4>
                <div className="customer-new-row">
                    <label htmlFor="customer-personal-birth-date">
                        6. Data urodzenia
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
                    <label htmlFor="customer-personal-address">7. Ulica</label>
                    <input
                        id="customer-personal-address"
                        className="form-control"
                        value={draft.address}
                        onChange={(e) => updateField('address', e.target.value)}
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor="customer-personal-postal-code">
                        8. Kod pocztowy
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
                    <label htmlFor="customer-personal-city">9. Miasto</label>
                    <input
                        id="customer-personal-city"
                        className="form-control"
                        value={draft.city}
                        onChange={(e) => updateField('city', e.target.value)}
                    />
                </div>
                <div className="customer-new-row">
                    <label htmlFor="customer-personal-description">
                        10. Opis
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

            <div className="customer-new-section">
                <h4>zgody komunikacyjne</h4>
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
        </div>
    );
}

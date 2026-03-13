import { useEffect, useState } from 'react';
import type { Customer } from '@/types';
import CustomerFormFields, {
    type CustomerFormDraft,
} from './CustomerFormFields';

interface Props {
    customer: Customer;
    onUpdate?: (data: Partial<Customer>) => Promise<void> | void;
}

type Draft = CustomerFormDraft;

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
            <CustomerFormFields
                values={draft}
                onChange={updateField}
                fieldIdPrefix="customer-personal"
            />

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

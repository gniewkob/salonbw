'use client';

import { useRouter } from 'next/router';
import Link from 'next/link';
import type { Route } from 'next';
import { useState, type FormEvent } from 'react';
import RouteGuard from '@/components/RouteGuard';
import VersumShell from '@/components/versum/VersumShell';
import VersumCustomersVendorCss from '@/components/versum/VersumCustomersVendorCss';
import NewCustomerNav from '@/components/versum/navs/NewCustomerNav';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateCustomer } from '@/hooks/useCustomers';
import type { Gender } from '@/types';

type Draft = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    birthDate: string;
    gender: '' | Gender;
    address: string;
    city: string;
    postalCode: string;
    description: string;
    emailConsent: boolean;
    smsConsent: boolean;
};

export default function NewCustomerPage() {
    const router = useRouter();
    const { role } = useAuth();
    const create = useCreateCustomer();
    const [activeTab, setActiveTab] = useState<
        'basic' | 'extended' | 'advanced'
    >('basic');
    const [submitMode, setSubmitMode] = useState<'view' | 'next'>('view');

    const [form, setForm] = useState<Draft>({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        birthDate: '',
        gender: '',
        address: '',
        city: '',
        postalCode: '',
        description: '',
        emailConsent: false,
        smsConsent: false,
    });

    if (!role) return null;

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        const created = await create.mutateAsync({
            firstName: form.firstName.trim() || undefined,
            lastName: form.lastName.trim() || undefined,
            email: form.email.trim() || undefined,
            phone: form.phone.trim() || undefined,
            birthDate: form.birthDate || undefined,
            gender: form.gender || undefined,
            address: form.address.trim() || undefined,
            city: form.city.trim() || undefined,
            postalCode: form.postalCode.trim() || undefined,
            description: form.description.trim() || undefined,
            emailConsent: form.emailConsent,
            smsConsent: form.smsConsent,
        });
        if (submitMode === 'next') {
            setForm({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                birthDate: '',
                gender: '',
                address: '',
                city: '',
                postalCode: '',
                description: '',
                emailConsent: false,
                smsConsent: false,
            });
            return;
        }
        void router.push(`/customers/${created.id}` as Route);
    };

    const handleSelectTab = (tab: 'basic' | 'extended' | 'advanced') => {
        setActiveTab(tab);
        const idMap: Record<typeof tab, string> = {
            basic: 'customer-new-basic',
            extended: 'customer-new-extended',
            advanced: 'customer-new-advanced',
        };
        const target = document.getElementById(idMap[tab]);
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const secondNav = (
        <div className="sidenav secondarynav" id="sidenav">
            <NewCustomerNav activeTab={activeTab} onSelect={handleSelectTab} />
        </div>
    );

    return (
        <RouteGuard
            roles={['admin', 'employee', 'receptionist']}
            permission="nav:customers"
        >
            <VersumShell role={role} secondaryNav={secondNav}>
                <VersumCustomersVendorCss />
                <div className="show_customer new_customer" id="customers_main">
                    <ul className="breadcrumb">
                        <li>Klienci / Dodaj klienta</li>
                    </ul>

                    <form
                        onSubmit={(e) => void onSubmit(e)}
                        className="customer-new-form"
                    >
                        <div
                            className="customer-new-section"
                            id="customer-new-basic"
                        >
                            <h4>dane podstawowe</h4>
                            <div className="customer-new-row">
                                <label htmlFor="customer-new-first-name">
                                    1. Imię
                                </label>
                                <input
                                    id="customer-new-first-name"
                                    className="form-control"
                                    value={form.firstName}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            firstName: e.target.value,
                                        }))
                                    }
                                    disabled={create.isPending}
                                    autoFocus
                                />
                            </div>
                            <div className="customer-new-row">
                                <label htmlFor="customer-new-last-name">
                                    2. Nazwisko
                                </label>
                                <input
                                    id="customer-new-last-name"
                                    className="form-control"
                                    value={form.lastName}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            lastName: e.target.value,
                                        }))
                                    }
                                    disabled={create.isPending}
                                />
                            </div>
                            <div className="customer-new-row">
                                <label htmlFor="customer-new-email">
                                    3. Email
                                </label>
                                <input
                                    id="customer-new-email"
                                    className="form-control"
                                    value={form.email}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            email: e.target.value,
                                        }))
                                    }
                                    disabled={create.isPending}
                                />
                            </div>
                            <div className="customer-new-row">
                                <label htmlFor="customer-new-phone">
                                    4. Telefon
                                </label>
                                <input
                                    id="customer-new-phone"
                                    className="form-control"
                                    value={form.phone}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            phone: e.target.value,
                                        }))
                                    }
                                    disabled={create.isPending}
                                />
                            </div>
                            <div className="customer-new-row">
                                <label htmlFor="customer-new-gender">
                                    5. Płeć
                                </label>
                                <select
                                    id="customer-new-gender"
                                    className="form-control"
                                    value={form.gender}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            gender: e.target
                                                .value as Draft['gender'],
                                        }))
                                    }
                                    disabled={create.isPending}
                                >
                                    <option value="">Nie podano</option>
                                    <option value="female">Kobieta</option>
                                    <option value="male">Mężczyzna</option>
                                    <option value="other">Inna</option>
                                </select>
                            </div>
                        </div>

                        <div
                            className="customer-new-section"
                            id="customer-new-extended"
                        >
                            <h4>dane rozszerzone</h4>
                            <div className="customer-new-row">
                                <label htmlFor="customer-new-birth-date">
                                    8. Data urodzenia
                                </label>
                                <input
                                    id="customer-new-birth-date"
                                    className="form-control"
                                    type="date"
                                    value={form.birthDate}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            birthDate: e.target.value,
                                        }))
                                    }
                                    disabled={create.isPending}
                                />
                            </div>
                            <div className="customer-new-row">
                                <label htmlFor="customer-new-address">
                                    9. Ulica
                                </label>
                                <input
                                    id="customer-new-address"
                                    className="form-control"
                                    value={form.address}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            address: e.target.value,
                                        }))
                                    }
                                    disabled={create.isPending}
                                />
                            </div>
                            <div className="customer-new-row">
                                <label htmlFor="customer-new-postal-code">
                                    10. Kod pocztowy
                                </label>
                                <input
                                    id="customer-new-postal-code"
                                    className="form-control"
                                    value={form.postalCode}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            postalCode: e.target.value,
                                        }))
                                    }
                                    disabled={create.isPending}
                                />
                            </div>
                            <div className="customer-new-row">
                                <label htmlFor="customer-new-city">
                                    11. Miasto
                                </label>
                                <input
                                    id="customer-new-city"
                                    className="form-control"
                                    value={form.city}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            city: e.target.value,
                                        }))
                                    }
                                    disabled={create.isPending}
                                />
                            </div>
                            <div className="customer-new-row">
                                <label htmlFor="customer-new-description">
                                    12. Opis
                                </label>
                                <textarea
                                    id="customer-new-description"
                                    className="form-control"
                                    value={form.description}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            description: e.target.value,
                                        }))
                                    }
                                    disabled={create.isPending}
                                />
                            </div>
                        </div>

                        <div
                            className="customer-new-section"
                            id="customer-new-advanced"
                        >
                            <h4>zaawansowane</h4>
                            <div className="customer-new-row customer-new-row--checkbox">
                                <label htmlFor="customer-new-email-consent">
                                    Zgoda na kontakt email
                                </label>
                                <input
                                    id="customer-new-email-consent"
                                    type="checkbox"
                                    checked={form.emailConsent}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            emailConsent: e.target.checked,
                                        }))
                                    }
                                    disabled={create.isPending}
                                />
                            </div>
                            <div className="customer-new-row customer-new-row--checkbox">
                                <label htmlFor="customer-new-sms-consent">
                                    Zgoda na kontakt SMS
                                </label>
                                <input
                                    id="customer-new-sms-consent"
                                    type="checkbox"
                                    checked={form.smsConsent}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            smsConsent: e.target.checked,
                                        }))
                                    }
                                    disabled={create.isPending}
                                />
                            </div>
                        </div>

                        <div className="customer-new-actions">
                            <button
                                type="submit"
                                className="btn btn-primary btn-xs"
                                onClick={() => setSubmitMode('view')}
                                disabled={
                                    create.isPending ||
                                    (!form.firstName.trim() &&
                                        !form.lastName.trim() &&
                                        !form.email.trim() &&
                                        !form.phone.trim())
                                }
                            >
                                {create.isPending
                                    ? 'Zapisywanie...'
                                    : 'dodaj klienta'}
                            </button>
                            <button
                                type="submit"
                                className="btn btn-default btn-xs"
                                onClick={() => setSubmitMode('next')}
                                disabled={create.isPending}
                            >
                                zapisz i dodaj kolejnego
                            </button>
                            <Link
                                href={'/customers' as Route}
                                className="btn btn-default btn-xs"
                            >
                                wróć do listy
                            </Link>
                        </div>
                    </form>
                </div>
            </VersumShell>
        </RouteGuard>
    );
}

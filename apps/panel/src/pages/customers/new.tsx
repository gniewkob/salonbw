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
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
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
        buildingNo: '',
        apartmentNo: '',
        city: '',
        postalCode: '',
        country: '',
        nameDay: '',
        origin: '',
        pesel: '',
        nip: '',
        cardNumber: '',
        groups: '',
        description: '',
        emailConsent: false,
        smsConsent: false,
    });

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

    // Must be called before any early return (Rules of Hooks)
    useSetSecondaryNav(
        <div className="sidenav secondarynav" id="sidenav">
            <NewCustomerNav activeTab={activeTab} onSelect={handleSelectTab} />
        </div>,
    );

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
                buildingNo: '',
                apartmentNo: '',
                city: '',
                postalCode: '',
                country: '',
                nameDay: '',
                origin: '',
                pesel: '',
                nip: '',
                cardNumber: '',
                groups: '',
                description: '',
                emailConsent: false,
                smsConsent: false,
            });
            return;
        }
        void router.push(`/customers/${created.id}` as Route);
    };

    return (
        <RouteGuard
            roles={['admin', 'employee', 'receptionist']}
            permission="nav:customers"
        >
            <VersumShell role={role}>
                <VersumCustomersVendorCss />
                <div className="show_customer new_customer" id="customers_main">
                    <ul className="breadcrumb">
                        <li>Klienci / Dodaj klienta</li>
                    </ul>

                    <form
                        onSubmit={(e) => void onSubmit(e)}
                        className="customer-new-form customer-form-legacy"
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
                            <div className="customer-new-row customer-new-row--consent">
                                <label>7. Zgody udzielone przez klienta</label>
                                <div className="customer-consent-box">
                                    Pamiętaj o dopełnieniu obowiązku
                                    informacyjnego w zakresie realizacji umowy.
                                </div>
                            </div>
                            <div className="customer-new-row customer-new-row--checkbox">
                                <label htmlFor="customer-new-consent">
                                    Wyrażam zgodę na przetwarzanie danych
                                    osobowych
                                </label>
                                <input
                                    id="customer-new-consent"
                                    type="checkbox"
                                    checked={
                                        form.emailConsent || form.smsConsent
                                    }
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            emailConsent: e.target.checked,
                                            smsConsent: e.target.checked,
                                        }))
                                    }
                                    disabled={create.isPending}
                                />
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
                                    10. Nr domu
                                </label>
                                <input
                                    id="customer-new-building-no"
                                    className="form-control"
                                    value={form.buildingNo}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            buildingNo: e.target.value,
                                        }))
                                    }
                                    disabled={create.isPending}
                                />
                            </div>
                            <div className="customer-new-row">
                                <label htmlFor="customer-new-apartment-no">
                                    11. Nr lokalu
                                </label>
                                <input
                                    id="customer-new-apartment-no"
                                    className="form-control"
                                    value={form.apartmentNo}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            apartmentNo: e.target.value,
                                        }))
                                    }
                                    disabled={create.isPending}
                                />
                            </div>
                            <div className="customer-new-row">
                                <label htmlFor="customer-new-postal-code">
                                    12. Kod pocztowy
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
                                    13. Miasto
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
                                <label htmlFor="customer-new-country">
                                    14. Kraj
                                </label>
                                <input
                                    id="customer-new-country"
                                    className="form-control"
                                    value={form.country}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            country: e.target.value,
                                        }))
                                    }
                                    disabled={create.isPending}
                                />
                            </div>
                            <div className="customer-new-row">
                                <label htmlFor="customer-new-name-day">
                                    15. Data imienin
                                </label>
                                <input
                                    id="customer-new-name-day"
                                    className="form-control"
                                    value={form.nameDay}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            nameDay: e.target.value,
                                        }))
                                    }
                                    disabled={create.isPending}
                                />
                            </div>
                            <div className="customer-new-row">
                                <label htmlFor="customer-new-groups">
                                    16. Grupy
                                </label>
                                <input
                                    id="customer-new-groups"
                                    className="form-control"
                                    value={form.groups}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            groups: e.target.value,
                                        }))
                                    }
                                    disabled={create.isPending}
                                    placeholder="kliknij, aby dodać do grupy"
                                />
                            </div>
                            <div className="customer-new-row">
                                <label htmlFor="customer-new-origin">
                                    17. Pochodzenie klienta
                                </label>
                                <input
                                    id="customer-new-origin"
                                    className="form-control"
                                    value={form.origin}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            origin: e.target.value,
                                        }))
                                    }
                                    disabled={create.isPending}
                                />
                            </div>
                            <div className="customer-new-row">
                                <label htmlFor="customer-new-pesel">
                                    18. PESEL
                                </label>
                                <input
                                    id="customer-new-pesel"
                                    className="form-control"
                                    value={form.pesel}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            pesel: e.target.value,
                                        }))
                                    }
                                    disabled={create.isPending}
                                />
                            </div>
                            <div className="customer-new-row">
                                <label htmlFor="customer-new-nip">
                                    19. NIP
                                </label>
                                <input
                                    id="customer-new-nip"
                                    className="form-control"
                                    value={form.nip}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            nip: e.target.value,
                                        }))
                                    }
                                    disabled={create.isPending}
                                />
                            </div>
                            <div className="customer-new-row">
                                <label htmlFor="customer-new-card-number">
                                    20. Numer karty
                                </label>
                                <input
                                    id="customer-new-card-number"
                                    className="form-control"
                                    value={form.cardNumber}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            cardNumber: e.target.value,
                                        }))
                                    }
                                    disabled={create.isPending}
                                />
                            </div>
                            <div className="customer-new-row">
                                <label htmlFor="customer-new-description">
                                    21. Opis
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
                            <h4>
                                Zaawansowane{' '}
                                <span className="customer-advanced-hint">
                                    Pokaż
                                </span>
                            </h4>
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

                        <div className="customer-new-actions customer-new-actions--sticky">
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

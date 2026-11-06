import Head from 'next/head';
import Link from 'next/link';
import type { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState, type FormEvent } from 'react';
import {
    ArrowLeftIcon,
    ExclamationTriangleIcon,
    Squares2X2Icon,
    UserPlusIcon,
    UsersIcon,
} from '@heroicons/react/24/outline';
import RouteGuard from '@/components/RouteGuard';
import CustomerFormFields, {
    type CustomerFormDraft,
    type CustomerFormOnChange,
} from '@/components/customers/CustomerFormFields';
import { useCreateCustomer, useCustomers } from '@/hooks/useCustomers';
import foundation from '@/styles/V18Foundation.module.css';
import editStyles from '@/styles/V18EditCustomerModal.module.css';
import styles from '@/styles/V18CreateCustomer.module.css';

const EMPTY_CUSTOMER: CustomerFormDraft = {
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
    gdprConsent: false,
    termsConsent: false,
    notifyPanel: true,
    emailConsent: false,
    smsConsent: false,
    whatsappConsent: false,
    discountPercent: '',
};

/**
 * V18 CRM creation page. Uses the same customer API and field contract
 * as the existing CRM, while keeping all navigation inside Studio V18.
 */
export function V18CreateCustomer() {
    const router = useRouter();
    const create = useCreateCustomer();
    const [draft, setDraft] = useState<CustomerFormDraft>(EMPTY_CUSTOMER);
    const [duplicateSearch, setDuplicateSearch] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const input = draft.phone.trim() || draft.email.trim();
        if (!input) {
            setDuplicateSearch('');
            return;
        }
        const timeout = setTimeout(() => setDuplicateSearch(input), 600);
        return () => clearTimeout(timeout);
    }, [draft.phone, draft.email]);

    const { data: matches } = useCustomers(
        duplicateSearch
            ? { search: duplicateSearch, limit: 5 }
            : { limit: 5 },
    );
    const duplicates = duplicateSearch ? (matches?.items ?? []) : [];
    const hasIdentity = Boolean(
        draft.firstName.trim() ||
            draft.lastName.trim() ||
            draft.phone.trim() ||
            draft.email.trim(),
    );
    const discountRaw = draft.discountPercent?.trim() ?? '';
    const discount = discountRaw === '' ? null : Number(discountRaw);
    const discountValid =
        discount === null ||
        (Number.isFinite(discount) && discount >= 0 && discount <= 100);

    const update: CustomerFormOnChange = (key, value) => {
        setDraft((previous) => ({ ...previous, [key]: value }));
        setError(null);
    };

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!hasIdentity || !discountValid || create.isPending) return;
        setError(null);
        try {
            const result = await create.mutateAsync({
                firstName: draft.firstName.trim() || undefined,
                lastName: draft.lastName.trim() || undefined,
                phone: draft.phone.trim() || undefined,
                email: draft.email.trim() || undefined,
                gender: draft.gender || undefined,
                birthDate: draft.birthDate || undefined,
                address: draft.address.trim() || undefined,
                city: draft.city.trim() || undefined,
                postalCode: draft.postalCode.trim() || undefined,
                description: draft.description.trim() || undefined,
                gdprConsent: draft.gdprConsent,
                termsConsent: draft.termsConsent,
                notifyPanel: draft.notifyPanel,
                smsConsent: draft.smsConsent,
                whatsappConsent: draft.whatsappConsent,
                emailConsent: draft.emailConsent,
                discountPercent: discount,
            });
            // Opening the actual card verifies creation in the same V18 UI.
            await router.push(`/studio-v18/customers/${result.id}`);
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : 'Nie udało się dodać klienta.',
            );
        }
    };

    return (
        <div
            className={foundation.foundation}
            data-testid="v18-create-customer"
        >
            <div className={foundation.layout}>
                <nav
                    className={foundation.rail}
                    aria-label="Nawigacja Studio V18"
                >
                    <Link
                        href="/studio-v18"
                        className={foundation.railBrand}
                        aria-label="Dashboard V18"
                    >
                        B<span>/</span>W
                    </Link>
                    <Link
                        href="/studio-v18"
                        className={foundation.railLink}
                        aria-label="Dashboard"
                    >
                        <Squares2X2Icon
                            width={23}
                            height={23}
                            aria-hidden="true"
                        />
                    </Link>
                    <Link
                        href="/studio-v18/customers"
                        className={[
                            foundation.railLink,
                            foundation.railActive,
                        ].join(' ')}
                        aria-current="page"
                        aria-label="Klienci V18"
                    >
                        <UsersIcon width={23} height={23} aria-hidden="true" />
                    </Link>
                </nav>
                <main className={foundation.surface} id="main-content">
                    <div className={foundation.breadcrumbs}>
                        <Link href="/studio-v18">Studio V18</Link>
                        <span aria-hidden="true">/</span>
                        <Link href="/studio-v18/customers">Klienci</Link>
                        <span aria-hidden="true">/</span>
                        <span>Nowy klient</span>
                    </div>

                    <div className={styles.backRow}>
                        <Link
                            href="/studio-v18/customers"
                            className={styles.backLink}
                        >
                            <ArrowLeftIcon
                                width={17}
                                height={17}
                                aria-hidden="true"
                            />
                            Wróć do klientów
                        </Link>
                    </div>

                    <header className={styles.hero}>
                        <div className={styles.heroIcon} aria-hidden="true">
                            <UserPlusIcon width={27} height={27} />
                        </div>
                        <div>
                            <span className={styles.eyebrow}>
                                Salon Black &amp; White · CRM V18
                            </span>
                            <h1>Nowa karta klienta</h1>
                            <p>
                                Utwórz klienta w CRM. Po zapisaniu otworzymy
                                jego kartę w Dashboardzie V18.
                            </p>
                        </div>
                    </header>

                    <form
                        className={styles.form}
                        onSubmit={(event) => void submit(event)}
                        aria-label="Nowa karta klienta"
                    >
                        {duplicates.length > 0 ? (
                            <div className={styles.duplicate} role="status">
                                <ExclamationTriangleIcon
                                    width={20}
                                    height={20}
                                    aria-hidden="true"
                                />
                                <div>
                                    <strong>Możliwy duplikat klienta</strong>
                                    <p>
                                        Sprawdź istniejącą kartę, zanim
                                        zapiszesz kolejną osobę.
                                    </p>
                                    <ul>
                                        {duplicates.map((customer) => (
                                            <li key={customer.id}>
                                                <Link
                                                    href={
                                                        `/studio-v18/customers/${customer.id}`
                                                    }
                                                >
                                                    {customer.fullName ||
                                                        customer.name}
                                                </Link>
                                                {customer.phone
                                                    ? ` · ${customer.phone}`
                                                    : ''}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ) : null}
                        {error ? (
                            <p className={styles.error} role="alert">
                                {error}
                            </p>
                        ) : null}
                        {!discountValid ? (
                            <p className={styles.error} role="alert">
                                Stały rabat musi mieścić się w zakresie 0–100%.
                            </p>
                        ) : null}

                        <div className={editStyles.formScope}>
                            <CustomerFormFields
                                values={draft}
                                onChange={update}
                                fieldIdPrefix="v18-new-customer"
                                supportedOnly
                                datePickerVariant="v18"
                                disabled={create.isPending}
                                autoFocusFirstName
                            />
                        </div>

                        <footer className={styles.footer}>
                            <span>
                                Dane zapiszą się w CRM środowiska DEV. Zgody
                                klienta zaznaczaj wyłącznie po ich uzyskaniu.
                            </span>
                            <div className={styles.actions}>
                                <Link
                                    href="/studio-v18/customers"
                                    className={styles.cancel}
                                    aria-disabled={create.isPending}
                                    onClick={(event) => {
                                        if (create.isPending)
                                            event.preventDefault();
                                    }}
                                >
                                    Anuluj
                                </Link>
                                <button
                                    type="submit"
                                    className={styles.submit}
                                    disabled={
                                        !hasIdentity ||
                                        !discountValid ||
                                        create.isPending
                                    }
                                >
                                    {create.isPending
                                        ? 'Zapisywanie…'
                                        : 'Utwórz kartę klienta'}
                                </button>
                            </div>
                        </footer>
                    </form>
                </main>
            </div>
        </div>
    );
}

export default function StudioV18NewCustomerPage() {
    return (
        <RouteGuard roles={['admin']} permission="nav:customers">
            <Head>
                <title>Nowy klient V18 — Salon Black &amp; White</title>
                <meta name="robots" content="noindex,nofollow" />
            </Head>
            <V18CreateCustomer />
        </RouteGuard>
    );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
    const host = (req.headers.host ?? '').split(':')[0].toLowerCase();
    const dev =
        process.env.NEXT_PUBLIC_DEPLOYMENT_ENV === 'development' ||
        process.env.NODE_ENV === 'development';
    if (
        !dev ||
        !['dev-panel.salon-bw.pl', 'localhost', '127.0.0.1'].includes(host)
    ) {
        return { notFound: true };
    }
    return { props: {} };
};

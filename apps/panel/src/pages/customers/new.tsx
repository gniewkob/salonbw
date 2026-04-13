import { useRouter } from 'next/router';
import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import NewCustomerNav from '@/components/salon/navs/NewCustomerNav';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import { useCreateCustomer } from '@/hooks/useCustomers';
import CustomerFormFields, {
    type CustomerFormDraft,
    type CustomerFormOnChange,
} from '@/components/customers/CustomerFormFields';
import CustomerErrorBoundary from '@/components/customers/CustomerErrorBoundary';

type Draft = CustomerFormDraft;

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
            basic: 'customer-form-basic',
            extended: 'customer-form-extended',
            advanced: 'customer-form-advanced',
        };
        const target = document.getElementById(idMap[tab]);
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const sections: Array<{
            tab: 'basic' | 'extended' | 'advanced';
            el: HTMLElement;
        }> = [];
        const basic = document.getElementById('customer-form-basic');
        const extended = document.getElementById('customer-form-extended');
        const advanced = document.getElementById('customer-form-advanced');
        if (basic) sections.push({ tab: 'basic', el: basic });
        if (extended) sections.push({ tab: 'extended', el: extended });
        if (advanced) sections.push({ tab: 'advanced', el: advanced });
        if (sections.length === 0) return;

        let raf = 0;
        const compute = () => {
            const mid = window.innerHeight * 0.35;
            let best: {
                tab: 'basic' | 'extended' | 'advanced';
                dist: number;
            } | null = null;

            for (const section of sections) {
                const rect = section.el.getBoundingClientRect();
                const dist = Math.abs(rect.top - mid);
                if (!best || dist < best.dist) {
                    best = { tab: section.tab, dist };
                }
            }

            if (best) setActiveTab(best.tab);
        };

        const onScroll = () => {
            if (raf) return;
            raf = window.requestAnimationFrame(() => {
                raf = 0;
                compute();
            });
        };

        compute();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => {
            if (raf) window.cancelAnimationFrame(raf);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, []);

    const secondaryNav = useMemo(
        () => (
            <div className="sidenav" id="sidenav">
                <NewCustomerNav
                    activeTab={activeTab}
                    onSelect={handleSelectTab}
                />
            </div>
        ),
        [activeTab],
    );

    const handleFormChange: CustomerFormOnChange = (key, value) => {
        setForm((p) => ({ ...p, [key]: value }));
    };

    // Must be called before any early return (Rules of Hooks)
    useSetSecondaryNav(secondaryNav);

    if (!role) return null;

    const onSubmit = async (e: FormEvent) => {
        e.preventDefault();
        let created;
        try {
            created = await create.mutateAsync({
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
        } catch (err) {
            alert(
                err instanceof Error
                    ? err.message
                    : 'Nie udało się zapisać klienta',
            );
            return;
        }
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
            <SalonShell role={role}>
                <CustomerErrorBoundary
                    fallback={
                        <div
                            className="show_customer new_customer"
                            id="customers_main"
                        >
                            <div className="customer-error">
                                Wystąpił błąd podczas renderowania formularza
                                nowego klienta.
                            </div>
                        </div>
                    }
                >
                    <div
                        className="show_customer new_customer"
                        id="customers_main"
                    >
                        <SalonBreadcrumbs
                            iconClass="sprite-breadcrumbs_customers"
                            items={[
                                { label: 'Klienci', href: '/customers' },
                                { label: 'nowy klient' },
                            ]}
                        />

                        <div className="d-flex align-items-center justify-content-between">
                            <h2 className="fs-3 fw-bold">nowy klient</h2>
                        </div>
                        <p className="small text-muted">
                            klienci / nowy klient
                        </p>

                        <form
                            onSubmit={(e) => void onSubmit(e)}
                            className="customer-new-form customer-form-legacy"
                        >
                            <CustomerFormFields
                                values={form}
                                onChange={handleFormChange}
                                disabled={create.isPending}
                                fieldIdPrefix="customer-new"
                                autoFocusFirstName
                            />

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
                </CustomerErrorBoundary>
            </SalonShell>
        </RouteGuard>
    );
}

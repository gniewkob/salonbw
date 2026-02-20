'use client';

import { useRouter } from 'next/router';
import Link from 'next/link';
import type { Route } from 'next';
import { useEffect, useMemo, useState } from 'react';
import RouteGuard from '@/components/RouteGuard';
import VersumShell from '@/components/versum/VersumShell';
import VersumCustomersVendorCss from '@/components/versum/VersumCustomersVendorCss';
import NewCustomerNav from '@/components/versum/navs/NewCustomerNav';
import { useAuth } from '@/contexts/AuthContext';
import { useSetSecondaryNav } from '@/contexts/SecondaryNavContext';
import { useCustomer, useUpdateCustomer } from '@/hooks/useCustomers';
import type { Customer } from '@/types';
import CustomerPersonalDataTab from '@/components/customers/CustomerPersonalDataTab';

type EditTab = 'basic' | 'extended' | 'advanced';

function parseNumericIdParam(
    value: string | string[] | undefined,
): number | null {
    if (!value) return null;
    const raw = Array.isArray(value) ? value[0] : value;
    const n = Number(raw);
    return Number.isInteger(n) && n > 0 ? n : null;
}

function parseCustomerIdFromRoute(
    idParam: string | string[] | undefined,
    asPath: string,
): number | null {
    const fromParam = parseNumericIdParam(idParam);
    if (fromParam !== null) return fromParam;

    const match = asPath.match(/^\/customers\/(\d+)(?:[/?#]|$)/);
    if (!match) return null;
    const parsed = Number(match[1]);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export default function CustomerEditPage() {
    const router = useRouter();
    const { role } = useAuth();
    const { id } = router.query;
    const customerId = parseCustomerIdFromRoute(id, router.asPath);
    const [activeTab, setActiveTab] = useState<EditTab>('basic');

    const { data: customer, isLoading, error } = useCustomer(customerId);
    const updateCustomer = useUpdateCustomer();

    const handleUpdate = async (data: Partial<Customer>) => {
        if (!customerId) return;
        await updateCustomer.mutateAsync({ id: customerId, data });
    };

    const handleSelectTab = (tab: EditTab) => {
        setActiveTab(tab);
        const idMap: Record<EditTab, string> = {
            basic: 'customer-form-basic',
            extended: 'customer-form-extended',
            advanced: 'customer-form-advanced',
        };
        const target = document.getElementById(idMap[tab]);
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const sections: Array<{ tab: EditTab; el: HTMLElement }> = [];
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
            let best: { tab: EditTab; dist: number } | null = null;
            for (const s of sections) {
                const rect = s.el.getBoundingClientRect();
                const dist = Math.abs(rect.top - mid);
                if (!best || dist < best.dist) {
                    best = { tab: s.tab, dist };
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
    }, [customer?.id]);

    const secondaryNav = useMemo(
        () => (
            <div className="sidenav secondarynav" id="sidenav">
                <NewCustomerNav
                    title="EDYCJA KLIENTA"
                    activeTab={activeTab}
                    onSelect={handleSelectTab}
                />
            </div>
        ),
        [activeTab],
    );

    // Must be called before any early return (Rules of Hooks)
    useSetSecondaryNav(secondaryNav);

    if (!role) return null;

    return (
        <RouteGuard
            roles={['admin', 'employee', 'receptionist']}
            permission="nav:customers"
        >
            <VersumShell role={role}>
                <VersumCustomersVendorCss />
                <div className="show_customer" id="customers_main">
                    <ul className="breadcrumb">
                        <li>
                            Klienci / {customer?.name || '...'} / Edytuj klienta
                        </li>
                    </ul>

                    {isLoading ? (
                        <div className="customer-loading">Ładowanie...</div>
                    ) : error ? (
                        <div className="customer-error">
                            Nie udało się załadować klienta.
                        </div>
                    ) : customer ? (
                        <>
                            <div className="customer-actions-bar">
                                <div className="customer-actions-bar__spacer" />
                                <Link
                                    href={`/customers/${customer.id}` as Route}
                                    className="btn btn-default btn-xs"
                                >
                                    wróć do karty klienta
                                </Link>
                            </div>
                            <CustomerPersonalDataTab
                                customer={customer}
                                onUpdate={handleUpdate}
                            />
                        </>
                    ) : (
                        <div className="customer-error">
                            Nie znaleziono klienta.
                        </div>
                    )}
                </div>
            </VersumShell>
        </RouteGuard>
    );
}

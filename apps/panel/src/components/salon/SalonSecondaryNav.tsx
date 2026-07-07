import type { ReactNode } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import type { SalonModule } from './navigation';
import ServicesNav from './navs/ServicesNav';
import ServiceDetailNav from './navs/ServiceDetailNav';
import ClientsNav from './navs/ClientsNav';
import CalendarNav from './navs/CalendarNav';
import WarehouseNav from './navs/WarehouseNav';
import StatisticsNav from './navs/StatisticsNav';
import CommunicationNav from './navs/CommunicationNav';
import SettingsNav from './navs/SettingsNav';

interface SalonSecondaryNavProps {
    module: SalonModule;
}

export default function SalonSecondaryNav({ module }: SalonSecondaryNavProps) {
    const router = useRouter();
    const { role } = useAuth();

    if (!module.secondaryNav) {
        return null;
    }

    // Employees/receptionists only reach /settings to edit their OWN schedule
    // (via the "Mój grafik" entry). The full settings module nav (salon data,
    // payments, RODO logs, …) is admin-only — don't expose dead links to it.
    if (module.key === 'settings' && role !== 'admin') {
        return null;
    }

    let content: ReactNode = null;

    if (module.key === 'calendar') {
        content = <CalendarNav />;
    } else if (module.key === 'customers') {
        if (router.pathname.startsWith('/loyalty')) {
            // Loyalty is a full-width Klienci tool — the customer-list filter
            // sidebar (groups/criteria) is meaningless here; render no sidenav.
            content = null;
        } else if (
            router.pathname === '/customers/[id]' ||
            router.pathname === '/customers/[id]/edit'
        ) {
            // The detail and edit screens now own their navigation inside the
            // page. A second Versum-style sidebar duplicates tabs and narrows
            // the card, which caused the broken desktop layout.
            content = null;
        } else {
            content = <ClientsNav />;
        }
    } else if (module.key === 'products') {
        content = <WarehouseNav />;
    } else if (module.key === 'statistics') {
        content = <StatisticsNav />;
    } else if (module.key === 'communication') {
        content = <CommunicationNav />;
    } else if (module.key === 'services') {
        if (router.pathname === '/services/[id]') {
            const serviceIdRaw = Array.isArray(router.query.id)
                ? router.query.id[0]
                : router.query.id;
            const serviceId = serviceIdRaw ? Number(serviceIdRaw) : Number.NaN;
            const tab = Array.isArray(router.query.tab)
                ? router.query.tab[0]
                : router.query.tab;
            const activeTab = (tab as string | undefined) ?? 'summary';
            content =
                Number.isInteger(serviceId) && serviceId > 0 ? (
                    <ServiceDetailNav
                        serviceId={serviceId}
                        activeTab={
                            activeTab as
                                | 'summary'
                                | 'stats'
                                | 'history'
                                | 'employees'
                                | 'comments'
                                | 'commissions'
                                | 'recipe'
                        }
                    />
                ) : (
                    <ServicesNav />
                );
        } else {
            content = <ServicesNav />;
        }
    } else if (module.key === 'settings') {
        content = <SettingsNav />;
    }

    return (
        <div className="sidenav" id="sidenav">
            {content}
        </div>
    );
}

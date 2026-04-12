import type { ReactNode } from 'react';
import { useRouter } from 'next/router';
import type { SalonModule } from './navigation';
import ServicesNav from './navs/ServicesNav';
import ServiceDetailNav from './navs/ServiceDetailNav';
import CustomersNav from './navs/CustomersNav';
import CustomerDetailNav from './navs/CustomerDetailNav';
import CalendarNav from './navs/CalendarNav';
import WarehouseNav from './navs/WarehouseNav';
import StatisticsNav from './navs/StatisticsNav';
import CommunicationNav from './navs/CommunicationNav';
import SettingsNav from './navs/SettingsNav';

// customersSections moved to CustomersNav
// servicesSections moved to ServicesNav

interface SalonSecondaryNavProps {
    module: SalonModule;
}

function parseCustomerIdFromRoute(
    idParam: string | string[] | undefined,
    asPath: string,
): number | null {
    const raw = Array.isArray(idParam) ? idParam[0] : idParam;
    const fromParam = raw ? Number(raw) : Number.NaN;
    if (Number.isInteger(fromParam) && fromParam > 0) {
        return fromParam;
    }

    const match = asPath.match(/^\/customers\/(\d+)(?:[/?#]|$)/);
    if (!match) return null;
    const parsed = Number(match[1]);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export default function SalonSecondaryNav({ module }: SalonSecondaryNavProps) {
    const router = useRouter();

    if (!module.secondaryNav) {
        return null;
    }

    let content: ReactNode = null;

    if (module.key === 'calendar') {
        content = <CalendarNav />;
    } else if (module.key === 'customers') {
        if (router.pathname === '/customers/[id]') {
            const customerId = parseCustomerIdFromRoute(
                router.query.id,
                router.asPath,
            );
            const tabName = Array.isArray(router.query.tab_name)
                ? router.query.tab_name[0]
                : router.query.tab_name;
            const activeTab =
                tabName === 'personal_data'
                    ? 'personal'
                    : tabName === 'statistics'
                      ? 'statistics'
                      : tabName === 'events_history'
                        ? 'history'
                        : tabName === 'opinions'
                          ? 'comments'
                          : tabName === 'communication_preferences'
                            ? 'communication'
                            : tabName === 'gallery'
                              ? 'gallery'
                              : tabName === 'files'
                                ? 'files'
                                : 'summary';
            content =
                customerId !== null ? (
                    <CustomerDetailNav
                        customerId={customerId}
                        customerName="..."
                        activeTab={activeTab}
                    />
                ) : (
                    <CustomersNav />
                );
        } else {
            content = <CustomersNav />;
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

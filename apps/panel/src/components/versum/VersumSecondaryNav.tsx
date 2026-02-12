import type { ReactNode } from 'react';
import { useRouter } from 'next/router';
import type { VersumModule } from './navigation';
import ServicesNav from './navs/ServicesNav';
import ClientsNav from './navs/ClientsNav';
import ClientDetailNav from './navs/ClientDetailNav';
import CalendarNav from './navs/CalendarNav';
import WarehouseNav from './navs/WarehouseNav';
import StatisticsNav from './navs/StatisticsNav';

type SecondaryItem = {
    label: string;
    children?: string[];
};

// clientsSections moved to ClientsNav

const communicationSections: SecondaryItem[] = [
    {
        label: 'ŁĄCZNOŚĆ',
        children: [
            'Wiadomości masowe',
            'Szablony wiadomości',
            'Grupa testowa',
            'Facebook',
            'Twitter',
            'Komentarze',
            'Szablony graficzne',
            'Posty Facebook',
        ],
    },
];

// servicesSections moved to ServicesNav

interface VersumSecondaryNavProps {
    module: VersumModule;
}

function renderSections(sections: SecondaryItem[]) {
    return sections.map((section) => (
        <div key={section.label}>
            <div className="nav-header">{section.label}</div>
            <ul className="nav nav-list">
                {section.children?.map((child) => (
                    <li key={child}>
                        <a href="javascript:;">{child}</a>
                    </li>
                ))}
            </ul>
        </div>
    ));
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

export default function VersumSecondaryNav({
    module,
}: VersumSecondaryNavProps) {
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
                    <ClientDetailNav
                        customerId={customerId}
                        customerName="..."
                        activeTab={activeTab}
                    />
                ) : (
                    <ClientsNav />
                );
        } else {
            content = <ClientsNav />;
        }
    } else if (module.key === 'products') {
        content = <WarehouseNav />;
    } else if (module.key === 'statistics') {
        content = <StatisticsNav />;
    } else if (module.key === 'communication') {
        content = renderSections(communicationSections);
    } else if (module.key === 'services') {
        content = <ServicesNav />;
    }

    return (
        // Match Versum DOM: `.sidenav#sidenav` (keep `secondarynav` as compatibility class)
        <div className="sidenav secondarynav" id="sidenav">
            {content}
        </div>
    );
}

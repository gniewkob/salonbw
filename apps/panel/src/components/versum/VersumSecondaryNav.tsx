import type { ReactNode } from 'react';
import type { VersumModule } from './navigation';
import ServicesNav from './navs/ServicesNav';
import ClientsNav from './navs/ClientsNav';
import CalendarNav from './navs/CalendarNav';
import WarehouseNav from './navs/WarehouseNav';
import StatisticsNav from './navs/StatisticsNav';

type SecondaryItem = {
    label: string;
    children?: string[];
};

// clientsSections moved to ClientsNav

const statisticsSections: SecondaryItem[] = [
    {
        label: 'RAPORTY',
        children: [
            'Raport finansowy',
            'Pracownicy',
            'Prowizje pracowników',
            'Stan kasy',
            'Napiwki',
            'Usługi',
            'Klienci',
            'Magazyn',
            'Raport czasu pracy',
            'Komentarze',
        ],
    },
];

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

export default function VersumSecondaryNav({
    module,
}: VersumSecondaryNavProps) {
    if (!module.secondaryNav) {
        return null;
    }

    let content: ReactNode = null;

    if (module.key === 'calendar') {
        content = <CalendarNav />;
    } else if (module.key === 'clients') {
        content = <ClientsNav />;
    } else if (module.key === 'products') {
        content = <WarehouseNav />;
    } else if (module.key === 'statistics') {
        content = renderSections(statisticsSections);
    } else if (module.key === 'communication') {
        content = renderSections(communicationSections);
    } else if (module.key === 'services') {
        content = <ServicesNav />;
    } else if (module.key === 'statistics') {
        content = <StatisticsNav />;
    }

    return (
        <div className="secondarynav" id="sidenav">
            {content}
        </div>
    );
}

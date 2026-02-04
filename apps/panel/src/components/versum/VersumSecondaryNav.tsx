import type { ReactNode } from 'react';
import type { VersumModule } from './navigation';

type SecondaryItem = {
    label: string;
    children?: string[];
};

const clientSections: SecondaryItem[] = [
    {
        label: 'GRUPY KLIENTÓW',
        children: ['wszyscy klienci', 'Umówieni na dzisiaj', 'Ostatnio dodani'],
    },
    {
        label: 'WYBIERZ KRYTERIA',
        children: [
            'skorzystali z usług',
            'mają wizytę w salonie',
            'obsługiwani przez pracownika',
            '+ więcej',
        ],
    },
];

const stockSections: SecondaryItem[] = [
    {
        label: 'KATEGORIE PRODUKTÓW',
        children: [
            'Wszystkie produkty',
            'Londa',
            'Nioxin',
            'Wella',
            'Wella care-Pro servis',
            'Moroccanoil',
            'produkty bez kategorii',
            'dodaj/edytuj/usuń',
        ],
    },
];

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

const servicesSections: SecondaryItem[] = [
    {
        label: 'KATEGORIE',
        children: [
            'Wszystkie usługi',
            'Fryzjerstwo',
            'usługi bez kategorii',
            'dodaj/edytuj/usuń',
        ],
    },
];

const monthGrid = [
    ['26', '27', '28', '29', '30', '31', '1'],
    ['2', '3', '4', '5', '6', '7', '8'],
    ['9', '10', '11', '12', '13', '14', '15'],
    ['16', '17', '18', '19', '20', '21', '22'],
    ['23', '24', '25', '26', '27', '28', '29'],
];

interface VersumSecondaryNavProps {
    module: VersumModule;
}

function renderSections(sections: SecondaryItem[]) {
    return sections.map((section) => (
        <section key={section.label} className="versum-secondarynav__section">
            <h4>{section.label}</h4>
            <ul>
                {section.children?.map((child) => (
                    <li key={child}>{child}</li>
                ))}
            </ul>
        </section>
    ));
}

function renderCalendarNav() {
    return (
        <>
            <section className="versum-secondarynav__section versum-secondarynav__calendar">
                <h4>LUTY 2026</h4>
                <div className="versum-mini-cal__weekdays">
                    <span>pn</span>
                    <span>wt</span>
                    <span>śr</span>
                    <span>cz</span>
                    <span>pt</span>
                    <span>so</span>
                    <span>nd</span>
                </div>
                <div className="versum-mini-cal__days">
                    {monthGrid.flat().map((day, index) => (
                        <span
                            key={`${day}-${index}`}
                            className={day === '3' ? 'is-active' : undefined}
                        >
                            {day}
                        </span>
                    ))}
                </div>
            </section>
            <section className="versum-secondarynav__section">
                <h4>PRACOWNICY</h4>
                <ul>
                    <li>
                        <span className="versum-chip" /> Aleksandra Bodora
                    </li>
                </ul>
            </section>
        </>
    );
}

export default function VersumSecondaryNav({
    module,
}: VersumSecondaryNavProps) {
    if (!module.secondaryNav) {
        return null;
    }

    let content: ReactNode = null;

    if (module.key === 'calendar') {
        content = renderCalendarNav();
    } else if (module.key === 'clients') {
        content = renderSections(clientSections);
    } else if (module.key === 'products') {
        content = renderSections(stockSections);
    } else if (module.key === 'statistics') {
        content = renderSections(statisticsSections);
    } else if (module.key === 'communication') {
        content = renderSections(communicationSections);
    } else if (module.key === 'services') {
        content = renderSections(servicesSections);
    }

    return <aside className="versum-secondarynav">{content}</aside>;
}

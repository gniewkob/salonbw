type NewCustomerTab = 'basic' | 'extended' | 'advanced';

interface NewCustomerNavProps {
    activeTab: NewCustomerTab;
    onSelect: (tab: NewCustomerTab) => void;
    title?: string;
}

const tabs: Array<{
    id: NewCustomerTab;
    label: string;
    href: string;
    iconClass: string;
}> = [
    {
        id: 'basic',
        label: 'dane podstawowe',
        href: '#customer-form-basic',
        iconClass: 'fa-list-alt',
    },
    {
        id: 'extended',
        label: 'dane rozszerzone',
        href: '#customer-form-extended',
        iconClass: 'fa-table',
    },
    {
        id: 'advanced',
        label: 'zaawansowane',
        href: '#customer-form-advanced',
        iconClass: 'fa-cogs',
    },
];

export default function NewCustomerNav({
    activeTab,
    onSelect,
    title = 'NOWY KLIENT',
}: NewCustomerNavProps) {
    return (
        <div className="sidebar-inner">
            <div className="nav-header">{title}</div>
            <ul className="nav nav-list">
                {tabs.map((tab) => (
                    <li
                        key={tab.id}
                        className={activeTab === tab.id ? 'active' : undefined}
                    >
                        <a
                            href={tab.href}
                            onClick={(e) => {
                                e.preventDefault();
                                onSelect(tab.id);
                            }}
                        >
                            <i
                                className={`fa ${tab.iconClass}`}
                                aria-hidden="true"
                            />
                            {tab.label}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}

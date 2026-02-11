type NewCustomerTab = 'basic' | 'extended' | 'advanced';

interface NewCustomerNavProps {
    activeTab: NewCustomerTab;
    onSelect: (tab: NewCustomerTab) => void;
}

const tabs: Array<{
    id: NewCustomerTab;
    label: string;
    iconClass: string;
}> = [
    { id: 'basic', label: 'dane podstawowe', iconClass: 'fa-list-alt' },
    { id: 'extended', label: 'dane rozszerzone', iconClass: 'fa-table' },
    { id: 'advanced', label: 'zaawansowane', iconClass: 'fa-cogs' },
];

export default function NewCustomerNav({
    activeTab,
    onSelect,
}: NewCustomerNavProps) {
    return (
        <div className="sidebar-inner client-detail-nav">
            <div className="nav-header client-nav-header">NOWY KLIENT</div>
            <ul className="nav nav-list client-nav-tabs client-nav-tabs--flat">
                {tabs.map((tab) => (
                    <li
                        key={tab.id}
                        className={activeTab === tab.id ? 'active' : undefined}
                    >
                        <button
                            type="button"
                            className="client-nav-button"
                            onClick={() => onSelect(tab.id)}
                        >
                            <i
                                className={`fa ${tab.iconClass} client-nav-icon`}
                                aria-hidden="true"
                            />
                            {tab.label}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}

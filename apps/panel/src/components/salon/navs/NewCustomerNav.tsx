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
    isLast?: boolean;
}> = [
    {
        id: 'basic',
        label: 'dane podstawowe',
        href: '#customer-form-basic',
        iconClass: 'sprite-customer_personal_data',
    },
    {
        id: 'extended',
        label: 'dane rozszerzone',
        href: '#customer-form-extended',
        iconClass: 'sprite-customer_statistics',
    },
    {
        id: 'advanced',
        label: 'zaawansowane',
        href: '#customer-form-advanced',
        iconClass: 'sprite-settings_sms_nav',
        isLast: true,
    },
];

export default function NewCustomerNav({
    activeTab,
    onSelect,
    title = 'NOWY KLIENT',
}: NewCustomerNavProps) {
    return (
        <div className="show_action_content client-detail-nav">
            <div className="column_row">
                <h4>{title}</h4>
                <div className="tree">
                    <ul>
                        {tabs.map((tab) => (
                            <li
                                key={tab.id}
                                className={
                                    activeTab === tab.id ? 'active' : undefined
                                }
                            >
                                <a
                                    href={tab.href}
                                    className={tab.isLast ? 'last' : undefined}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onSelect(tab.id);
                                    }}
                                >
                                    <div className="icon_box">
                                        <i
                                            className={`icon ${tab.iconClass}`}
                                            aria-hidden="true"
                                        />
                                    </div>
                                    {tab.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

// Sidebar navigation for client detail page (KARTA KLIENTA)
// Matches Versum 1:1 style
import Link from 'next/link';

type TabId =
    | 'summary'
    | 'personal'
    | 'statistics'
    | 'history'
    | 'comments'
    | 'communication'
    | 'gallery'
    | 'files';

interface Tab {
    id: TabId;
    label: string;
    iconClass: string;
    tabName?: string;
    isLast?: boolean;
}

const tabs: Tab[] = [
    {
        id: 'summary',
        label: 'podsumowanie',
        iconClass: 'sprite-customer_dashboard',
    },
    {
        id: 'personal',
        label: 'dane osobowe',
        iconClass: 'sprite-customer_personal_data',
        tabName: 'personal_data',
    },
    {
        id: 'statistics',
        label: 'statystyki',
        iconClass: 'sprite-customer_statistics',
        tabName: 'statistics',
    },
    {
        id: 'history',
        label: 'historia wizyt',
        iconClass: 'sprite-customer_history_visits',
        tabName: 'events_history',
    },
    {
        id: 'comments',
        label: 'komentarze',
        iconClass: 'sprite-opinions',
        tabName: 'opinions',
    },
    {
        id: 'communication',
        label: 'komunikacja',
        iconClass: 'sprite-settings_sms_nav',
        tabName: 'communication_preferences',
    },
    {
        id: 'gallery',
        label: 'galeria zdjęć',
        iconClass: 'sprite-customer_photo_gallery',
        tabName: 'gallery',
    },
    {
        id: 'files',
        label: 'załączone pliki',
        iconClass: 'sprite-customer_files',
        tabName: 'files',
        isLast: true,
    },
];

interface ClientDetailNavProps {
    customerId: number;
    customerName: string;
    customerGender?: 'male' | 'female' | 'other';
    activeTab: TabId;
}

export default function ClientDetailNav({
    customerId,
    customerName,
    customerGender,
    activeTab,
}: ClientDetailNavProps) {
    const genderIconClass =
        customerGender === 'female'
            ? 'sprite-customer_female'
            : customerGender === 'male'
              ? 'sprite-customer_male'
              : 'sprite-customer_unknown_sex';

    return (
        <div className="show_action_content client-detail-nav">
            <div className="column_row">
                <h4>Karta klienta</h4>
                <div className="tree">
                    <Link
                        href={`/customers/${customerId}`}
                        className="pjax_link root with_icon"
                    >
                        <span className="icon_box">
                            <i
                                className={`gender_icon icon ${genderIconClass}`}
                                aria-hidden="true"
                            />
                        </span>
                        <span className="customer_name">{customerName}</span>
                    </Link>
                    <ul>
                        {tabs.map((tab) => (
                            <li
                                key={tab.id}
                                className={activeTab === tab.id ? 'active' : ''}
                            >
                                <Link
                                    className={`pjax_link ${tab.isLast ? 'last' : ''}`.trim()}
                                    href={
                                        tab.id === 'summary'
                                            ? {
                                                  pathname: `/customers/${customerId}`,
                                              }
                                            : {
                                                  pathname: `/customers/${customerId}`,
                                                  query: {
                                                      tab_name: tab.tabName,
                                                  },
                                              }
                                    }
                                    data-tab_name={tab.tabName}
                                    aria-current={
                                        activeTab === tab.id
                                            ? 'page'
                                            : undefined
                                    }
                                >
                                    <div className="icon_box">
                                        <i
                                            className={`icon ${tab.iconClass}`}
                                            aria-hidden="true"
                                        />
                                    </div>
                                    {tab.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

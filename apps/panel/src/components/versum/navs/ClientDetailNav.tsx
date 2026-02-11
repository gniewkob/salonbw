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
}

const tabs: Tab[] = [
    { id: 'summary', label: 'podsumowanie', iconClass: 'fa-th-large' },
    {
        id: 'personal',
        label: 'dane osobowe',
        iconClass: 'fa-id-card-o',
        tabName: 'personal_data',
    },
    {
        id: 'statistics',
        label: 'statystyki',
        iconClass: 'fa-bar-chart',
        tabName: 'statistics',
    },
    {
        id: 'history',
        label: 'historia wizyt',
        iconClass: 'fa-calendar-o',
        tabName: 'events_history',
    },
    {
        id: 'comments',
        label: 'komentarze',
        iconClass: 'fa-comment-o',
        tabName: 'opinions',
    },
    {
        id: 'communication',
        label: 'komunikacja',
        iconClass: 'fa-envelope-o',
        tabName: 'communication_preferences',
    },
    {
        id: 'gallery',
        label: 'galeria zdjęć',
        iconClass: 'fa-camera',
        tabName: 'gallery',
    },
    {
        id: 'files',
        label: 'załączone pliki',
        iconClass: 'fa-paperclip',
        tabName: 'files',
    },
];

interface ClientDetailNavProps {
    customerId: number;
    customerName: string;
    activeTab: TabId;
}

export default function ClientDetailNav({
    customerId,
    customerName,
    activeTab,
}: ClientDetailNavProps) {
    return (
        <div className="sidebar-inner client-detail-nav">
            {/* Header - KARTA KLIENTA */}
            <div className="nav-header client-nav-header">KARTA KLIENTA</div>

            {/* Customer name link */}
            <ul className="nav nav-list">
                <li>
                    <Link
                        href={`/customers/${customerId}`}
                        className="client-nav-name"
                    >
                        <i
                            className="fa fa-user-o client-nav-icon"
                            aria-hidden="true"
                        />
                        {customerName}
                    </Link>
                </li>
            </ul>

            {/* Tabs */}
            <ul className="nav nav-list client-nav-tabs">
                {tabs.map((tab) => (
                    <li
                        key={tab.id}
                        className={activeTab === tab.id ? 'active' : ''}
                    >
                        <Link
                            href={
                                tab.id === 'summary'
                                    ? { pathname: `/customers/${customerId}` }
                                    : {
                                          pathname: `/customers/${customerId}`,
                                          query: { tab_name: tab.tabName },
                                      }
                            }
                            aria-current={
                                activeTab === tab.id ? 'page' : undefined
                            }
                        >
                            <i
                                className={`fa ${tab.iconClass} client-nav-icon`}
                                aria-hidden="true"
                            />
                            {tab.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

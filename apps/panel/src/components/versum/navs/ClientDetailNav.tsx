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
    {
        id: 'summary',
        label: 'podsumowanie',
        iconClass: 'glyphicon-th-large',
    },
    {
        id: 'personal',
        label: 'dane osobowe',
        iconClass: 'glyphicon-list-alt',
        tabName: 'personal_data',
    },
    {
        id: 'statistics',
        label: 'statystyki',
        iconClass: 'glyphicon-stats',
        tabName: 'statistics',
    },
    {
        id: 'history',
        label: 'historia wizyt',
        iconClass: 'glyphicon-calendar',
        tabName: 'events_history',
    },
    {
        id: 'comments',
        label: 'komentarze',
        iconClass: 'glyphicon-comment',
        tabName: 'opinions',
    },
    {
        id: 'communication',
        label: 'komunikacja',
        iconClass: 'glyphicon-earphone',
        tabName: 'communication_preferences',
    },
    {
        id: 'gallery',
        label: 'galeria zdjęć',
        iconClass: 'glyphicon-camera',
        tabName: 'gallery',
    },
    {
        id: 'files',
        label: 'załączone pliki',
        iconClass: 'glyphicon-paperclip',
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
                        <span className="icon_box">
                            <i
                                className="glyphicon glyphicon-user client-nav-icon"
                                aria-hidden="true"
                            />
                        </span>
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
                                    : tab.id === 'personal'
                                      ? {
                                            pathname: `/customers/${customerId}`,
                                            query: { tab_name: tab.tabName },
                                        }
                                      : {
                                            pathname: `/customers/${customerId}`,
                                            query: { tab_name: tab.tabName },
                                        }
                            }
                            aria-current={
                                activeTab === tab.id ? 'page' : undefined
                            }
                        >
                            <span className="icon_box">
                                <i
                                    className={`glyphicon ${tab.iconClass} client-nav-icon`}
                                    aria-hidden="true"
                                />
                            </span>
                            {tab.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

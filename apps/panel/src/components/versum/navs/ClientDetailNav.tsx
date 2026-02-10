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
}

const tabs: Tab[] = [
    { id: 'summary', label: 'podsumowanie', iconClass: 'fa-th-large' },
    { id: 'personal', label: 'dane osobowe', iconClass: 'fa-id-card-o' },
    { id: 'statistics', label: 'statystyki', iconClass: 'fa-bar-chart' },
    { id: 'history', label: 'historia wizyt', iconClass: 'fa-calendar-o' },
    { id: 'comments', label: 'komentarze', iconClass: 'fa-comment-o' },
    { id: 'communication', label: 'komunikacja', iconClass: 'fa-envelope-o' },
    { id: 'gallery', label: 'galeria zdjęć', iconClass: 'fa-camera' },
    { id: 'files', label: 'załączone pliki', iconClass: 'fa-paperclip' },
];

interface ClientDetailNavProps {
    customerId: number;
    customerName: string;
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
}

export default function ClientDetailNav({
    customerId,
    customerName,
    activeTab,
    onTabChange,
}: ClientDetailNavProps) {
    return (
        <div className="sidebar-inner client-detail-nav">
            {/* Header - KARTA KLIENTA */}
            <div className="nav-header client-nav-header">KARTA KLIENTA</div>

            {/* Customer name link */}
            <ul className="nav nav-list">
                <li>
                    <Link
                        href={`/clients/${customerId}`}
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
                        <a onClick={() => onTabChange(tab.id)}>
                            <i
                                className={`fa ${tab.iconClass} client-nav-icon`}
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

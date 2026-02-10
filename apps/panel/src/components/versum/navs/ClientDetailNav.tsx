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
    icon: string;
}

const tabs: Tab[] = [
    { id: 'summary', label: 'podsumowanie', icon: '📊' },
    { id: 'personal', label: 'dane osobowe', icon: '👤' },
    { id: 'statistics', label: 'statystyki', icon: '📈' },
    { id: 'history', label: 'historia wizyt', icon: '📅' },
    { id: 'comments', label: 'komentarze', icon: '💬' },
    { id: 'communication', label: 'komunikacja', icon: '📧' },
    { id: 'gallery', label: 'galeria zdjęć', icon: '📷' },
    { id: 'files', label: 'załączone pliki', icon: '📎' },
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
                        <span className="client-nav-icon">👤</span>
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
                        <a
                            href="javascript:;"
                            onClick={() => onTabChange(tab.id)}
                            className="client-nav-tab"
                        >
                            <span className="client-nav-icon">{tab.icon}</span>
                            {tab.label}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}

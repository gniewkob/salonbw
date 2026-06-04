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

interface MobileTab {
    id: TabId;
    label: string;
    tabName?: string;
}

const TABS: ReadonlyArray<MobileTab> = [
    { id: 'summary', label: 'Podsumowanie' },
    { id: 'personal', label: 'Dane', tabName: 'personal_data' },
    { id: 'statistics', label: 'Statystyki', tabName: 'statistics' },
    { id: 'history', label: 'Historia', tabName: 'events_history' },
    { id: 'comments', label: 'Komentarze', tabName: 'opinions' },
    {
        id: 'communication',
        label: 'Komunikacja',
        tabName: 'communication_preferences',
    },
    { id: 'gallery', label: 'Galeria', tabName: 'gallery' },
    { id: 'files', label: 'Pliki', tabName: 'files' },
];

interface MobileCustomerTabsNavProps {
    customerId: number;
    activeTab: TabId;
}

export default function MobileCustomerTabsNav({
    customerId,
    activeTab,
}: MobileCustomerTabsNavProps) {
    return (
        <nav
            aria-label="Sekcje karty klienta"
            style={{
                display: 'flex',
                gap: '0.375rem',
                padding: '0.5rem 0.75rem 0.75rem',
                overflowX: 'auto',
                overflowY: 'hidden',
                background: '#ffffff',
                borderBottom: '1px solid #e5e7eb',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',
            }}
            // Hide horizontal scrollbar on WebKit
            className="salonbw-mobile-tabs-nav"
        >
            {TABS.map((tab) => {
                const isActive = tab.id === activeTab;
                return (
                    <Link
                        key={tab.id}
                        href={
                            tab.id === 'summary'
                                ? `/customers/${customerId}`
                                : {
                                      pathname: `/customers/${customerId}`,
                                      query: { tab_name: tab.tabName },
                                  }
                        }
                        aria-current={isActive ? 'page' : undefined}
                        style={{
                            flexShrink: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            minHeight: 36,
                            padding: '0.375rem 0.75rem',
                            borderRadius: 999,
                            fontSize: '0.85rem',
                            fontWeight: isActive ? 600 : 500,
                            letterSpacing: '0.02em',
                            background: isActive ? '#0d0d0d' : '#f1f3f5',
                            color: isActive ? '#ffffff' : '#1a1a1a',
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {tab.label}
                    </Link>
                );
            })}
        </nav>
    );
}

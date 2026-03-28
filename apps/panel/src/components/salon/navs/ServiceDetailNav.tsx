import Link from 'next/link';
import { useServiceSummary } from '@/hooks/useServicesAdmin';

type TabId =
    | 'summary'
    | 'stats'
    | 'history'
    | 'employees'
    | 'comments'
    | 'commissions';

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
        iconClass: 'sprite-customer_dashboard',
    },
    {
        id: 'stats',
        label: 'statystyki',
        iconClass: 'sprite-customer_statistics',
        tabName: 'stats',
    },
    {
        id: 'history',
        label: 'historia usługi',
        iconClass: 'sprite-customer_history_visits',
        tabName: 'history',
    },
    {
        id: 'employees',
        label: 'przypisani pracownicy',
        iconClass: 'sprite-all_employees',
        tabName: 'employees',
    },
    {
        id: 'comments',
        label: 'komentarze',
        iconClass: 'sprite-opinions',
        tabName: 'comments',
    },
    {
        id: 'commissions',
        label: 'prowizje',
        iconClass: 'sprite-stock_value_report',
        tabName: 'commissions',
    },
];

interface ServiceDetailNavProps {
    serviceId: number;
    activeTab: TabId;
}

export default function ServiceDetailNav({
    serviceId,
    activeTab,
}: ServiceDetailNavProps) {
    const summary = useServiceSummary(serviceId);
    const serviceName = summary.data?.name ?? '...';

    return (
        <div className="column_row">
            <div className="tree">
                <Link
                    href={`/services/${serviceId}`}
                    className="item root with_icon"
                >
                    <span className="icon_box">
                        <i
                            className="icon sprite-settings_services"
                            aria-hidden="true"
                        />
                    </span>
                    {serviceName}
                </Link>
                <ul>
                    {tabs.map((tab) => (
                        <li
                            key={tab.id}
                            className={activeTab === tab.id ? 'active' : ''}
                        >
                            <Link
                                href={
                                    tab.id === 'summary'
                                        ? `/services/${serviceId}`
                                        : {
                                              pathname: `/services/${serviceId}`,
                                              query: { tab: tab.tabName },
                                          }
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
    );
}

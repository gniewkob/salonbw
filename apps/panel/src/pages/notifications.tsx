import Head from 'next/head';
import Link from 'next/link';
import RouteGuard from '@/components/RouteGuard';
import SalonShell from '@/components/salon/SalonShell';
import SalonBreadcrumbs from '@/components/salon/SalonBreadcrumbs';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import PanelButton from '@/components/ui/PanelButton';

function formatNotificationDate(value: string) {
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return '';
    return date.toLocaleString('pl-PL', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function NotificationsPage() {
    const { role } = useAuth();
    const notifications = useNotifications();
    const items = notifications.data ?? [];

    return (
        <RouteGuard roles={['admin', 'employee', 'receptionist', 'client']}>
            <Head>
                <title>Powiadomienia — Salon Black &amp; White</title>
            </Head>
            <SalonShell role={role}>
                <div className="salonbw-page notifications-page">
                    <SalonBreadcrumbs
                        iconClass="sprite-breadcrumbs_communication"
                        items={[{ label: 'Powiadomienia' }]}
                    />
                    <div className="salonbw-dashboard__header">
                        <h1 className="salonbw-dashboard__title client-shell-page-title">
                            Powiadomienia
                        </h1>
                    </div>

                    <section className="salonbw-dashboard__section">
                        <div className="salonbw-dashboard__section-header">
                            <h2>Najnowsze</h2>
                        </div>
                        <div className="notifications-list">
                            {notifications.isLoading ? (
                                <div
                                    className="notifications-list__empty"
                                    role="status"
                                >
                                    Ładowanie powiadomień...
                                </div>
                            ) : notifications.isError ? (
                                <div
                                    className="notifications-list__empty"
                                    role="alert"
                                >
                                    Nie udało się pobrać powiadomień.
                                </div>
                            ) : items.length === 0 ? (
                                <div className="notifications-list__empty">
                                    Brak nowych powiadomień.
                                </div>
                            ) : (
                                items.map((item) => (
                                    <article
                                        key={item.id}
                                        className={[
                                            'notifications-list__item',
                                            item.type === 'reschedule_action' ||
                                            item.type ===
                                                'online_booking_action'
                                                ? 'notifications-list__item--action'
                                                : '',
                                        ]
                                            .filter(Boolean)
                                            .join(' ')}
                                    >
                                        <span
                                            className="notifications-list__dot"
                                            aria-hidden="true"
                                        />
                                        <div className="notifications-list__body">
                                            {item.actionHref ? (
                                                <Link
                                                    href={item.actionHref}
                                                    className="notifications-list__message-link"
                                                >
                                                    {item.message}
                                                </Link>
                                            ) : (
                                                <p>{item.message}</p>
                                            )}
                                            <time dateTime={item.createdAt}>
                                                {formatNotificationDate(
                                                    item.createdAt,
                                                )}
                                            </time>
                                        </div>
                                        {item.actionHref && item.actionLabel ? (
                                            <PanelButton
                                                href={item.actionHref}
                                                size="sm"
                                                variant={
                                                    item.type ===
                                                    'reschedule_action'
                                                        ? 'primary'
                                                        : 'secondary'
                                                }
                                                className="notifications-list__action"
                                            >
                                                {item.actionLabel}
                                            </PanelButton>
                                        ) : null}
                                    </article>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            </SalonShell>
        </RouteGuard>
    );
}

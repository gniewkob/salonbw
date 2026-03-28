import { useNotifications } from '@/hooks/useNotifications';

export default function NotificationList() {
    const { data } = useNotifications();
    return (
        <ul className="gap-2">
            {data.map((n) => (
                <li key={n.id} className="border p-2">
                    <div>{n.message}</div>
                    <div className="small text-muted">
                        {new Date(n.createdAt).toLocaleString()}
                    </div>
                </li>
            ))}
        </ul>
    );
}
